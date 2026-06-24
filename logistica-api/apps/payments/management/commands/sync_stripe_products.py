import stripe

from django.conf import settings
from django.core.management.base import BaseCommand

from apps.products.models import Product
from apps.suppliers.models import Supplier
from apps.warehouses.models import Warehouse

MOCK_PRODUCTS = [
    {
        'name': 'Cisco Catalyst 9300 48-Port Switch',
        'sku': 'NET-SW-C9300-48',
        'description': 'Enterprise-grade 48-port PoE+ switch with 740W power budget, UPOE support, and Cisco IOS-XE for campus networking.',
        'category': 'Networking',
        'unit_price': '8500.00',
        'weight_kg': '7.500',
        'width_cm': '44.50',
        'height_cm': '4.40',
        'depth_cm': '36.80',
        'stock_quantity': 12,
    },
    {
        'name': 'Dell PowerEdge R750 Server',
        'sku': 'SRV-PE-R750-2U',
        'description': '2U rack server with dual Intel Xeon Scalable processors, up to 2TB DDR4 RAM, and 24 NVMe drive bays.',
        'category': 'Servers',
        'unit_price': '22000.00',
        'weight_kg': '18.200',
        'width_cm': '48.20',
        'height_cm': '8.70',
        'depth_cm': '73.50',
        'stock_quantity': 5,
    },
    {
        'name': 'Synology RS3621xs+ NAS Storage Array',
        'sku': 'STG-NAS-RS3621XS',
        'description': '2U rackmount NAS with 12 drive bays, Intel Xeon D-1541 CPU, 8GB ECC RAM, dual 10GbE ports.',
        'category': 'Storage',
        'unit_price': '5800.00',
        'weight_kg': '11.300',
        'width_cm': '48.00',
        'height_cm': '8.80',
        'depth_cm': '55.10',
        'stock_quantity': 8,
    },
    {
        'name': 'Lenovo ThinkPad X1 Carbon Gen 12',
        'sku': 'LAP-TP-X1C-G12',
        'description': '14" ultralight business laptop with Intel Core Ultra 7, 32GB LPDDR5X, 1TB NVMe SSD, and OLED display.',
        'category': 'Laptops',
        'unit_price': '2400.00',
        'weight_kg': '1.120',
        'width_cm': '31.56',
        'height_cm': '1.55',
        'depth_cm': '22.10',
        'stock_quantity': 30,
    },
    {
        'name': 'Ubiquiti UniFi Cloud Gateway Ultra',
        'sku': 'NET-RT-UCGU-01',
        'description': 'Compact all-in-one router with built-in UniFi Network Server, 2.5GbE WAN, 4x GbE LAN, and IDS/IPS.',
        'category': 'Networking',
        'unit_price': '350.00',
        'weight_kg': '0.360',
        'width_cm': '13.50',
        'height_cm': '3.20',
        'depth_cm': '13.50',
        'stock_quantity': 50,
    },
]


class Command(BaseCommand):
    help = 'Sync local products to Stripe (creates/updates Products and Prices)'

    def handle(self, *args, **options):
        stripe.api_key     = settings.STRIPE_SECRET_KEY
        stripe.api_version = settings.STRIPE_API_VERSION

        if not stripe.api_key:
            self.stderr.write(self.style.ERROR('STRIPE_SECRET_KEY is not set.'))
            return

        self._seed_mock_products_if_needed()

        products = Product.objects.filter(is_active=True)
        self.stdout.write(f'Syncing {products.count()} products to Stripe...')

        created = updated = skipped = 0

        for product in products:
            try:
                product_data = {
                    'name': product.name,
                    'metadata': {'sku': product.sku, 'category': product.category},
                }
                if product.description:
                    product_data['description'] = product.description

                if product.stripe_product_id:
                    stripe.Product.modify(
                        product.stripe_product_id,
                        **product_data,
                        idempotency_key=f'sync-product-{product.id}-{product.updated_at.isoformat()}',
                    )
                    updated += 1
                    action = 'updated'
                else:
                    stripe_product = stripe.Product.create(
                        **product_data,
                        idempotency_key=f'sync-product-create-{product.id}',
                    )
                    product.stripe_product_id = stripe_product.id
                    created += 1
                    action = 'created'

                unit_amount = int(product.unit_price * 100)

                if product.stripe_price_id:
                    existing_price = stripe.Price.retrieve(product.stripe_price_id)
                    if existing_price.unit_amount != unit_amount:
                        stripe.Price.modify(product.stripe_price_id, active=False)
                        new_price = stripe.Price.create(
                            product=product.stripe_product_id,
                            unit_amount=unit_amount,
                            currency='usd',
                            idempotency_key=f'sync-price-new-{product.id}-{unit_amount}',
                        )
                        product.stripe_price_id = new_price.id
                        self.stdout.write(f'  Price updated for {product.name}')
                else:
                    stripe_price = stripe.Price.create(
                        product=product.stripe_product_id,
                        unit_amount=unit_amount,
                        currency='usd',
                        idempotency_key=f'sync-price-{product.id}-{unit_amount}',
                    )
                    product.stripe_price_id = stripe_price.id

                product.save(update_fields=['stripe_product_id', 'stripe_price_id'])
                self.stdout.write(self.style.SUCCESS(f'  [{action}] {product.name} ({product.sku})'))

            except stripe.error.StripeError as e:
                self.stderr.write(self.style.ERROR(f'  [error] {product.name}: {e}'))
                skipped += 1

        self.stdout.write(self.style.SUCCESS(
            f'\nDone. Created: {created}, Updated: {updated}, Errors: {skipped}'
        ))

    def _seed_mock_products_if_needed(self):
        count = Product.objects.filter(is_active=True).count()
        if count >= 5:
            return

        supplier  = Supplier.objects.first()
        warehouse = Warehouse.objects.first()

        if not supplier or not warehouse:
            self.stderr.write(self.style.ERROR(
                'No Supplier or Warehouse found. Create at least one of each before running this command.'
            ))
            return

        needed = 5 - count
        seeded = 0

        for mock in MOCK_PRODUCTS:
            if seeded >= needed:
                break
            if Product.objects.filter(sku=mock['sku']).exists():
                continue
            Product.objects.create(supplier=supplier, warehouse=warehouse, **mock)
            self.stdout.write(f'  [mock] Created {mock["name"]}')
            seeded += 1

        if seeded:
            self.stdout.write(self.style.WARNING(f'Seeded {seeded} mock product(s) into the database.'))
