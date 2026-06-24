from django.urls import path
from .views import CheckoutSessionView, StripeWebhookView

urlpatterns = [
    path('payments/checkout/', CheckoutSessionView.as_view(), name='checkout-session'),
    path('payments/webhook/',  StripeWebhookView.as_view(),   name='stripe-webhook'),
]
