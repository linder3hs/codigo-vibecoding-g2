import uuid
import stripe

from django.conf import settings
from django.http import HttpResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status, serializers as drf_serializers

from drf_spectacular.utils import extend_schema, OpenApiResponse, inline_serializer

import apps.payments.stripe_client  # noqa: F401 — configures stripe.api_key + api_version

from apps.products.models import Product
from apps.payments.models import Payment, PaymentItem
from apps.payments.serializers import CheckoutRequestSerializer, CartItemSerializer


class CheckoutSessionView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=['Payments'],
        summary='Create a Stripe Checkout Session',
        description=(
            'Creates a Stripe Checkout Session for one or more products (shopping cart). '
            'Returns a `checkout_url` to redirect the user to Stripe\'s hosted payment page. '
            'All products must be synced to Stripe first (`sync_stripe_products`). '
            'Duplicate `product_id` entries in the same request are rejected.'
        ),
        request=CheckoutRequestSerializer,
        responses={
            200: inline_serializer(
                name='CheckoutResponse',
                fields={
                    'checkout_url': drf_serializers.URLField(),
                    'session_id':   drf_serializers.CharField(),
                    'amount_total': drf_serializers.DecimalField(max_digits=12, decimal_places=2),
                    'items_count':  drf_serializers.IntegerField(),
                },
            ),
            400: OpenApiResponse(description='Empty cart, duplicate products, or product not synced to Stripe.'),
            404: OpenApiResponse(description='One or more products not found or inactive.'),
        },
    )
    def post(self, request):
        serializer = CheckoutRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cart_items = serializer.validated_data['items']
        product_ids = [item['product_id'] for item in cart_items]

        products = {
            p.id: p for p in Product.objects.filter(pk__in=product_ids, is_active=True)
        }

        missing = [pid for pid in product_ids if pid not in products]
        if missing:
            return Response(
                {'detail': f'Products not found or inactive: {missing}'},
                status=status.HTTP_404_NOT_FOUND,
            )

        unsynced = [pid for pid in product_ids if not products[pid].stripe_price_id]
        if unsynced:
            return Response(
                {'detail': f'Products not synced to Stripe: {unsynced}. Run sync_stripe_products first.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        line_items = [
            {'price': products[item['product_id']].stripe_price_id, 'quantity': item['quantity']}
            for item in cart_items
        ]

        amount_total = sum(
            products[item['product_id']].unit_price * item['quantity']
            for item in cart_items
        )

        idempotency_key = f'checkout-{request.user.id}-{uuid.uuid4()}'

        session = stripe.checkout.Session.create(
            line_items=line_items,
            mode='payment',
            success_url=settings.STRIPE_SUCCESS_URL + '?session_id={CHECKOUT_SESSION_ID}',
            cancel_url=settings.STRIPE_CANCEL_URL,
            metadata={'user_id': str(request.user.id)},
            idempotency_key=idempotency_key,
        )

        payment = Payment.objects.create(
            stripe_session_id=session.id,
            amount_total=amount_total,
            currency='usd',
            status=Payment.PENDING,
        )

        PaymentItem.objects.bulk_create([
            PaymentItem(
                payment=payment,
                product=products[item['product_id']],
                quantity=item['quantity'],
                unit_price=products[item['product_id']].unit_price,
                subtotal=products[item['product_id']].unit_price * item['quantity'],
            )
            for item in cart_items
        ])

        return Response({
            'checkout_url': session.url,
            'session_id':   session.id,
            'amount_total': str(amount_total),
            'items_count':  len(cart_items),
        })


@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(APIView):
    authentication_classes = []
    permission_classes     = [AllowAny]

    @extend_schema(
        tags=['Payments'],
        summary='Stripe webhook receiver',
        description=(
            'Receives and verifies Stripe webhook events. '
            'Signature is validated via `Stripe-Signature` header using HMAC-SHA256. '
            'Handles `checkout.session.completed` and `checkout.session.expired`. '
            'This endpoint must NOT be called directly — register it in the Stripe Dashboard.'
        ),
        request=inline_serializer(
            name='StripeWebhookPayload',
            fields={'payload': drf_serializers.CharField(help_text='Raw Stripe event JSON')},
        ),
        responses={
            200: OpenApiResponse(description='Event received and processed.'),
            400: OpenApiResponse(description='Invalid signature or malformed payload.'),
        },
        auth=[],
    )
    def post(self, request):
        payload    = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except ValueError:
            return HttpResponse(status=400)
        except stripe.error.SignatureVerificationError:
            return HttpResponse(status=400)

        event_type = event['type']
        session    = event['data']['object']

        if event_type == 'checkout.session.completed':
            Payment.objects.filter(stripe_session_id=session['id']).update(
                status=Payment.COMPLETED,
                stripe_payment_intent=session.get('payment_intent'),
                customer_email=(session.get('customer_details') or {}).get('email'),
            )
        elif event_type == 'checkout.session.expired':
            Payment.objects.filter(stripe_session_id=session['id']).update(
                status=Payment.EXPIRED,
            )

        return HttpResponse(status=200)
