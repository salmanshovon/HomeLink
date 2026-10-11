"""Billing tests: invoices, payments, allocations, idempotency."""

from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import Role
from accounts.tests import create_user
from billing.models import InvoiceStatus, Payment, PaymentStatus, RentInvoice
from billing.services import allocate_to_invoice, generate_invoice, initiate_payment, verify_payment
from properties.models import Property, PropertyUnit
from rentals.models import Tenancy, TenancyStatus


class InvoiceTests(TestCase):
    def setUp(self):
        self.landlord = create_user('01730000001', role=Role.LANDLORD)
        self.tenant = create_user('01730000002', role=Role.TENANT)
        self.prop = Property.objects.create(title='P', category='apartment_building', division='Dhaka',
                                            district='Dhaka', city='Dhaka', landlord=self.landlord)
        self.unit = PropertyUnit.objects.create(property=self.prop, unit_number='1A', unit_type='apartment')
        self.tenancy = Tenancy.objects.create(
            unit=self.unit, tenant=self.tenant, landlord=self.landlord,
            start_date='2026-01-01', monthly_rent=Decimal('10000'), status=TenancyStatus.ACTIVE,
        )

    def test_invoice_amounts_computed(self):
        inv = generate_invoice(
            tenancy=self.tenancy, billing_period='2026-01', issue_date='2026-01-01',
            due_date='2026-01-10', base_rent=Decimal('10000'), service_charge=Decimal('1000'),
            created_by=self.landlord,
        )
        self.assertEqual(inv.total_amount, Decimal('11000'))
        self.assertEqual(inv.outstanding_amount, Decimal('11000'))
        self.assertEqual(inv.status, InvoiceStatus.ISSUED)

    def test_duplicate_invoice_rejected(self):
        generate_invoice(tenancy=self.tenancy, billing_period='2026-01', issue_date='2026-01-01',
                         due_date='2026-01-10', base_rent=Decimal('10000'), created_by=self.landlord)
        with self.assertRaises(ValueError):
            generate_invoice(tenancy=self.tenancy, billing_period='2026-01', issue_date='2026-01-01',
                             due_date='2026-01-10', base_rent=Decimal('10000'), created_by=self.landlord)


class PaymentTests(TestCase):
    def setUp(self):
        self.landlord = create_user('01730000003', role=Role.LANDLORD)
        self.tenant = create_user('01730000004', role=Role.TENANT)
        self.staff = create_user('01730000005', role=Role.EMPLOYEE)
        self.staff.is_staff = True
        self.staff.save()
        self.prop = Property.objects.create(title='P', category='apartment_building', division='Dhaka',
                                            district='Dhaka', city='Dhaka', landlord=self.landlord)
        self.unit = PropertyUnit.objects.create(property=self.prop, unit_number='1A', unit_type='apartment')
        self.tenancy = Tenancy.objects.create(
            unit=self.unit, tenant=self.tenant, landlord=self.landlord,
            start_date='2026-01-01', monthly_rent=Decimal('10000'), status=TenancyStatus.ACTIVE,
        )
        self.invoice = generate_invoice(
            tenancy=self.tenancy, billing_period='2026-01', issue_date='2026-01-01',
            due_date='2026-01-10', base_rent=Decimal('10000'), created_by=self.landlord,
        )

    def test_payment_idempotency(self):
        p1 = initiate_payment(payer=self.tenant, amount=Decimal('10000'), purpose='rent',
                              method='cash', idempotency_key='key-1')
        p2 = initiate_payment(payer=self.tenant, amount=Decimal('10000'), purpose='rent',
                              method='cash', idempotency_key='key-1')
        self.assertEqual(p1.id, p2.id)
        self.assertEqual(Payment.objects.count(), 1)

    def test_verify_payment_creates_receipt_and_allocates(self):
        payment = initiate_payment(payer=self.tenant, amount=Decimal('5000'), purpose='rent',
                                   method='cash', invoice=self.invoice)
        verify_payment(payment, self.staff)
        payment.refresh_from_db()
        self.assertEqual(payment.status, PaymentStatus.SUCCESSFUL)
        self.assertTrue(hasattr(payment, 'receipt'))
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.paid_amount, Decimal('5000'))
        self.assertEqual(self.invoice.outstanding_amount, Decimal('5000'))
        self.assertEqual(self.invoice.status, InvoiceStatus.PARTIALLY_PAID)

    def test_repeated_verify_is_idempotent(self):
        payment = initiate_payment(payer=self.tenant, amount=Decimal('10000'), purpose='rent',
                                   method='cash', invoice=self.invoice)
        verify_payment(payment, self.staff)
        verify_payment(payment, self.staff)  # second call
        self.assertEqual(Payment.objects.count(), 1)
        self.assertEqual(payment.receipt.__class__.objects.count(), 1)

    def test_allocation_cannot_exceed_invoice(self):
        payment = initiate_payment(payer=self.tenant, amount=Decimal('5000'), purpose='rent', method='cash')
        verify_payment(payment, self.staff)
        with self.assertRaises(ValueError):
            allocate_to_invoice(payment, self.invoice, Decimal('999999'))

    def test_tenant_cannot_verify_payment(self):
        payment = initiate_payment(payer=self.tenant, amount=Decimal('5000'), purpose='rent', method='cash')
        with self.assertRaises(ValueError):
            verify_payment(payment, self.tenant)
