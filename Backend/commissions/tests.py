"""Commissions tests: obligation creation, payer splits."""

from decimal import Decimal

from django.test import TestCase

from accounts.models import Role
from accounts.tests import create_user
from commissions.models import AgreementStatus, CommissionAgreement, CommissionObligation, PayerType
from commissions.services import create_obligations_for_agreement
from properties.models import Property, PropertyUnit
from rentals.models import Tenancy, TenancyStatus


class CommissionTests(TestCase):
    def setUp(self):
        self.landlord = create_user('01750000001', role=Role.LANDLORD)
        self.tenant = create_user('01750000002', role=Role.TENANT)
        self.prop = Property.objects.create(title='P', category='apartment_building', division='Dhaka',
                                            district='Dhaka', city='Dhaka', landlord=self.landlord)
        self.unit = PropertyUnit.objects.create(property=self.prop, unit_number='1A', unit_type='apartment')
        self.tenancy = Tenancy.objects.create(
            unit=self.unit, tenant=self.tenant, landlord=self.landlord,
            start_date='2026-01-01', monthly_rent=Decimal('10000'), status=TenancyStatus.ACTIVE,
        )

    def test_both_payer_creates_two_obligations(self):
        agreement = CommissionAgreement.objects.create(
            tenancy=self.tenancy, payer_type=PayerType.BOTH, calculation_type='months_of_rent',
            rate=Decimal('1'), created_by=self.landlord, status=AgreementStatus.ACTIVE,
        )
        create_obligations_for_agreement(agreement)
        self.assertEqual(agreement.obligations.count(), 2)
        payers = set(agreement.obligations.values_list('payer_id', flat=True))
        self.assertEqual(payers, {self.landlord.id, self.tenant.id})

    def test_single_payer_creates_one_obligation(self):
        agreement = CommissionAgreement.objects.create(
            tenancy=self.tenancy, payer_type=PayerType.LANDLORD, calculation_type='fixed',
            amount=Decimal('5000'), created_by=self.landlord, status=AgreementStatus.ACTIVE,
        )
        create_obligations_for_agreement(agreement)
        self.assertEqual(agreement.obligations.count(), 1)
        self.assertEqual(agreement.obligations.first().payer, self.landlord)
        self.assertEqual(agreement.obligations.first().amount_due, Decimal('5000'))
