from django.test import TestCase
from django.db import IntegrityError
from apps.customers.models import Customer


class CustomerModelCreationTests(TestCase):
    """Tests de creacion del modelo Customer."""

    def test_create_with_minimum_required_fields(self):
        customer = Customer.objects.create(
            name='Empresa ABC',
            email='contacto@empresaabc.com',
            phone='3001234567',
            address='Calle 10 # 5-20',
            city='Bogota',
        )
        self.assertIsNotNone(customer.pk)

    def test_default_customer_type_is_company(self):
        customer = Customer.objects.create(
            name='Empresa XYZ',
            email='xyz@empresa.com',
            phone='3009876543',
            address='Carrera 15 # 80-10',
            city='Medellin',
        )
        self.assertEqual(customer.customer_type, Customer.COMPANY)

    def test_default_country_is_colombia(self):
        customer = Customer.objects.create(
            name='Cliente Colombia',
            email='cliente@co.com',
            phone='3111111111',
            address='Av 68 # 10-50',
            city='Cali',
        )
        self.assertEqual(customer.country, 'Colombia')

    def test_default_is_active_is_true(self):
        customer = Customer.objects.create(
            name='Cliente Activo',
            email='activo@test.com',
            phone='3122222222',
            address='Calle 50 # 20-30',
            city='Barranquilla',
        )
        self.assertTrue(customer.is_active)

    def test_create_individual_customer(self):
        customer = Customer.objects.create(
            name='Juan Perez',
            customer_type=Customer.INDIVIDUAL,
            email='juan@personal.com',
            phone='3133333333',
            address='Transversal 40 # 5-10',
            city='Cartagena',
        )
        self.assertEqual(customer.customer_type, Customer.INDIVIDUAL)

    def test_create_with_tax_id(self):
        customer = Customer.objects.create(
            name='Empresa con NIT',
            email='nit@empresa.com',
            phone='3144444444',
            address='Calle 100 # 15-30',
            city='Bogota',
            tax_id='900123456-1',
        )
        self.assertEqual(customer.tax_id, '900123456-1')

    def test_tax_id_can_be_null(self):
        customer = Customer.objects.create(
            name='Sin NIT',
            email='sinnit@empresa.com',
            phone='3155555555',
            address='Calle 20 # 10-5',
            city='Pereira',
        )
        self.assertIsNone(customer.tax_id)

    def test_created_at_auto_set(self):
        customer = Customer.objects.create(
            name='Cliente Fecha',
            email='fecha@test.com',
            phone='3166666666',
            address='Calle 30 # 5-15',
            city='Manizales',
        )
        self.assertIsNotNone(customer.created_at)

    def test_updated_at_auto_set(self):
        customer = Customer.objects.create(
            name='Cliente Update',
            email='update@test.com',
            phone='3177777777',
            address='Calle 40 # 8-20',
            city='Bucaramanga',
        )
        self.assertIsNotNone(customer.updated_at)


class CustomerModelStrTests(TestCase):
    """Tests del metodo __str__."""

    def test_str_returns_name_and_type(self):
        customer = Customer.objects.create(
            name='TechCorp',
            customer_type=Customer.COMPANY,
            email='tech@corp.com',
            phone='3188888888',
            address='Zona Industrial # 1',
            city='Bogota',
        )
        self.assertEqual(str(customer), 'TechCorp (COMPANY)')

    def test_str_individual(self):
        customer = Customer.objects.create(
            name='Maria Lopez',
            customer_type=Customer.INDIVIDUAL,
            email='maria@personal.com',
            phone='3199999999',
            address='Calle 5 # 2-10',
            city='Cali',
        )
        self.assertEqual(str(customer), 'Maria Lopez (INDIVIDUAL)')


class CustomerModelMetaTests(TestCase):
    """Tests de Meta del modelo Customer."""

    def test_db_table_is_customers(self):
        self.assertEqual(Customer._meta.db_table, 'customers')

    def test_ordering_by_created_at_desc(self):
        self.assertEqual(Customer._meta.ordering, ['-created_at'])


class CustomerModelUniqueConstraintTests(TestCase):
    """Tests de constraints de unicidad."""

    def test_email_unique_raises_integrity_error(self):
        Customer.objects.create(
            name='Empresa 1',
            email='duplicado@test.com',
            phone='3200000001',
            address='Calle 1 # 1-1',
            city='Bogota',
        )
        with self.assertRaises(IntegrityError):
            Customer.objects.create(
                name='Empresa 2',
                email='duplicado@test.com',
                phone='3200000002',
                address='Calle 2 # 2-2',
                city='Bogota',
            )

    def test_tax_id_unique_raises_integrity_error(self):
        Customer.objects.create(
            name='Empresa A',
            email='a@empresa.com',
            phone='3200000003',
            address='Calle 3 # 3-3',
            city='Medellin',
            tax_id='NIT-UNICO-001',
        )
        with self.assertRaises(IntegrityError):
            Customer.objects.create(
                name='Empresa B',
                email='b@empresa.com',
                phone='3200000004',
                address='Calle 4 # 4-4',
                city='Medellin',
                tax_id='NIT-UNICO-001',
            )

    def test_two_customers_with_null_tax_id_are_allowed(self):
        """Dos clientes con tax_id=None no violan la restriccion UNIQUE (NULL != NULL)."""
        c1 = Customer.objects.create(
            name='Sin NIT 1',
            email='sinnit1@test.com',
            phone='3200000005',
            address='Dir 1',
            city='Bogota',
            tax_id=None,
        )
        c2 = Customer.objects.create(
            name='Sin NIT 2',
            email='sinnit2@test.com',
            phone='3200000006',
            address='Dir 2',
            city='Bogota',
            tax_id=None,
        )
        self.assertIsNone(c1.tax_id)
        self.assertIsNone(c2.tax_id)


class CustomerModelChoicesTests(TestCase):
    """Tests de choices para customer_type."""

    def test_valid_company_choice(self):
        customer = Customer.objects.create(
            name='Empresa Choices',
            customer_type='COMPANY',
            email='choices@empresa.com',
            phone='3210000001',
            address='Calle Choices',
            city='Bogota',
        )
        self.assertEqual(customer.customer_type, 'COMPANY')

    def test_valid_individual_choice(self):
        customer = Customer.objects.create(
            name='Persona Natural',
            customer_type='INDIVIDUAL',
            email='individual@persona.com',
            phone='3210000002',
            address='Calle Individual',
            city='Cali',
        )
        self.assertEqual(customer.customer_type, 'INDIVIDUAL')

    def test_type_choices_constants(self):
        self.assertEqual(Customer.COMPANY, 'COMPANY')
        self.assertEqual(Customer.INDIVIDUAL, 'INDIVIDUAL')


class CustomerModelSoftDeleteTests(TestCase):
    """Tests de soft delete."""

    def test_soft_delete_sets_is_active_false(self):
        customer = Customer.objects.create(
            name='Para Eliminar',
            email='eliminar@test.com',
            phone='3220000001',
            address='Calle Delete',
            city='Bogota',
        )
        customer.is_active = False
        customer.save()
        refreshed = Customer.objects.get(pk=customer.pk)
        self.assertFalse(refreshed.is_active)

    def test_soft_deleted_customer_still_exists_in_db(self):
        customer = Customer.objects.create(
            name='Fantasma',
            email='fantasma@test.com',
            phone='3220000002',
            address='Calle Fantasma',
            city='Bogota',
        )
        customer.is_active = False
        customer.save()
        self.assertTrue(Customer.objects.filter(pk=customer.pk).exists())
