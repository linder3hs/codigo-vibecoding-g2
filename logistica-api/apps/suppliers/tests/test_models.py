from django.test import TestCase
from django.db import IntegrityError
from apps.suppliers.models import Supplier


class SupplierModelCreationTests(TestCase):
    """Tests de creacion del modelo Supplier."""

    def setUp(self):
        self.valid_data = {
            'name': 'TechCorp S.A.',
            'contact_name': 'Ana Torres',
            'email': 'ana@techcorp.com',
            'phone': '3001234567',
            'address': 'Calle 10 # 20-30',
            'city': 'Bogota',
        }

    def test_create_supplier_with_minimum_required_fields(self):
        """Creacion exitosa con campos minimos requeridos."""
        supplier = Supplier.objects.create(**self.valid_data)
        self.assertIsNotNone(supplier.pk)
        self.assertEqual(supplier.name, 'TechCorp S.A.')
        self.assertEqual(supplier.contact_name, 'Ana Torres')
        self.assertEqual(supplier.email, 'ana@techcorp.com')
        self.assertEqual(supplier.phone, '3001234567')
        self.assertEqual(supplier.address, 'Calle 10 # 20-30')
        self.assertEqual(supplier.city, 'Bogota')

    def test_country_defaults_to_colombia(self):
        """El campo country tiene default='Colombia'."""
        supplier = Supplier.objects.create(**self.valid_data)
        self.assertEqual(supplier.country, 'Colombia')

    def test_is_active_defaults_to_true(self):
        """El campo is_active tiene default=True."""
        supplier = Supplier.objects.create(**self.valid_data)
        self.assertTrue(supplier.is_active)

    def test_tax_id_is_nullable(self):
        """El campo tax_id puede ser null."""
        supplier = Supplier.objects.create(**self.valid_data)
        self.assertIsNone(supplier.tax_id)

    def test_create_supplier_with_tax_id(self):
        """Creacion exitosa con tax_id provisto."""
        self.valid_data['tax_id'] = '900123456-7'
        supplier = Supplier.objects.create(**self.valid_data)
        self.assertEqual(supplier.tax_id, '900123456-7')

    def test_created_at_and_updated_at_are_set_automatically(self):
        """Los campos de timestamp se asignan automaticamente."""
        supplier = Supplier.objects.create(**self.valid_data)
        self.assertIsNotNone(supplier.created_at)
        self.assertIsNotNone(supplier.updated_at)


class SupplierModelStrTests(TestCase):
    """Tests del metodo __str__ del modelo Supplier."""

    def test_str_returns_supplier_name(self):
        """__str__ retorna el nombre del proveedor."""
        supplier = Supplier(name='Distribuidora XYZ')
        self.assertEqual(str(supplier), 'Distribuidora XYZ')


class SupplierModelMetaTests(TestCase):
    """Tests de la clase Meta del modelo Supplier."""

    def test_db_table_is_suppliers(self):
        """db_table debe ser 'suppliers'."""
        self.assertEqual(Supplier._meta.db_table, 'suppliers')

    def test_default_ordering_is_by_created_at_desc(self):
        """El ordering por defecto es ['-created_at']."""
        self.assertEqual(Supplier._meta.ordering, ['-created_at'])


class SupplierModelUniquenessTests(TestCase):
    """Tests de restricciones de unicidad."""

    def test_tax_id_must_be_unique(self):
        """No se pueden crear dos proveedores con el mismo tax_id."""
        Supplier.objects.create(
            name='Proveedor A',
            tax_id='NIT-001',
            contact_name='Juan Perez',
            email='a@a.com',
            phone='300',
            address='Dir A',
            city='Medellin',
        )
        with self.assertRaises(IntegrityError):
            Supplier.objects.create(
                name='Proveedor B',
                tax_id='NIT-001',
                contact_name='Maria Lopez',
                email='b@b.com',
                phone='301',
                address='Dir B',
                city='Cali',
            )

    def test_two_suppliers_with_null_tax_id_are_allowed(self):
        """Dos proveedores pueden tener tax_id=null simultaneamente."""
        Supplier.objects.create(
            name='Proveedor A',
            tax_id=None,
            contact_name='Juan Perez',
            email='a@a.com',
            phone='300',
            address='Dir A',
            city='Medellin',
        )
        supplier_b = Supplier.objects.create(
            name='Proveedor B',
            tax_id=None,
            contact_name='Maria Lopez',
            email='b@b.com',
            phone='301',
            address='Dir B',
            city='Cali',
        )
        self.assertIsNotNone(supplier_b.pk)


class SupplierModelSoftDeleteTests(TestCase):
    """Tests del soft delete via is_active."""

    def test_soft_delete_sets_is_active_false(self):
        """Marcar is_active=False no elimina el registro de la BD."""
        supplier = Supplier.objects.create(
            name='Proveedor Temporal',
            contact_name='Carlos Ruiz',
            email='c@c.com',
            phone='302',
            address='Dir C',
            city='Barranquilla',
        )
        supplier.is_active = False
        supplier.save()

        supplier_in_db = Supplier.objects.get(pk=supplier.pk)
        self.assertFalse(supplier_in_db.is_active)

    def test_inactive_supplier_still_exists_in_db(self):
        """Un proveedor inactivo sigue existiendo en la BD."""
        supplier = Supplier.objects.create(
            name='Proveedor Inactivo',
            contact_name='Laura Diaz',
            email='d@d.com',
            phone='303',
            address='Dir D',
            city='Pereira',
        )
        supplier.is_active = False
        supplier.save()

        self.assertTrue(Supplier.objects.filter(pk=supplier.pk).exists())
