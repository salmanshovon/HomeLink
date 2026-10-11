"""Communications tests: messaging, privacy, announcements, internal notes."""

from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient

from accounts.models import Role
from accounts.tests import create_user
from communications.models import Conversation, ConversationParticipant, Message
from communications.services import send_announcement, send_message
from complaints.models import Complaint, ComplaintComment
from properties.models import Property, PropertyUnit
from rentals.models import Tenancy, TenancyStatus


class MessagingTests(TestCase):
    def setUp(self):
        self.landlord = create_user('01740000001', role=Role.LANDLORD)
        self.tenant = create_user('01740000002', role=Role.TENANT)
        self.prop = Property.objects.create(title='P', category='apartment_building', division='Dhaka',
                                            district='Dhaka', city='Dhaka', landlord=self.landlord)
        self.unit = PropertyUnit.objects.create(property=self.prop, unit_number='1A', unit_type='apartment')
        self.tenancy = Tenancy.objects.create(
            unit=self.unit, tenant=self.tenant, landlord=self.landlord,
            start_date='2026-01-01', monthly_rent=Decimal('10000'), status=TenancyStatus.ACTIVE,
        )

    def _make_conversation(self):
        conv = Conversation.objects.create(conversation_type='landlord_tenant', tenancy=self.tenancy,
                                           created_by=self.landlord)
        ConversationParticipant.objects.create(conversation=conv, user=self.landlord)
        ConversationParticipant.objects.create(conversation=conv, user=self.tenant)
        return conv

    def test_tenant_can_message_landlord(self):
        conv = self._make_conversation()
        client = APIClient()
        client.force_authenticate(user=self.tenant)
        resp = client.post(f'/api/v1/conversations/{conv.id}/messages/', {
            'body': 'Hello', 'message_type': 'text',
        }, format='json')
        self.assertIn(resp.status_code, (200, 201))
        self.assertEqual(conv.messages.count(), 1)

    def test_non_participant_cannot_read_messages(self):
        conv = self._make_conversation()
        send_message(conv, self.landlord, 'Hi')
        stranger = create_user('01740000003', role=Role.TENANT)
        client = APIClient()
        client.force_authenticate(user=stranger)
        resp = client.get(f'/api/v1/conversations/{conv.id}/messages/')
        self.assertIn(resp.status_code, (403, 404))

    def test_internal_complaint_comment_hidden_from_tenant(self):
        complaint = Complaint.objects.create(
            complainant=self.tenant, tenancy=self.tenancy, category='plumbing',
            subject='Leak', description='Tap leaking',
        )
        ComplaintComment.objects.create(complaint=complaint, author=self.tenant, message='Visible')
        ComplaintComment.objects.create(complaint=complaint, author=self.landlord, message='Internal note',
                                       is_internal=True)
        client = APIClient()
        client.force_authenticate(user=self.tenant)
        # Tenant adds a visible comment (endpoint is POST only)
        resp = client.post(f'/api/v1/complaints/{complaint.id}/comments/', {
            'message': 'My follow-up',
        }, format='json')
        self.assertEqual(resp.status_code, 201)
        # Internal comments are never serialized to non-staff
        from complaints.serializers import ComplaintSerializer
        data = ComplaintSerializer(complaint).data
        bodies = [c['message'] for c in data.get('comments', [])]
        self.assertNotIn('Internal note', bodies)


class AnnouncementTests(TestCase):
    def setUp(self):
        self.landlord = create_user('01740000004', role=Role.LANDLORD)
        self.tenant = create_user('01740000005', role=Role.TENANT)
        self.prop = Property.objects.create(title='P', category='apartment_building', division='Dhaka',
                                            district='Dhaka', city='Dhaka', landlord=self.landlord)
        self.unit = PropertyUnit.objects.create(property=self.prop, unit_number='1A', unit_type='apartment')
        self.tenancy = Tenancy.objects.create(
            unit=self.unit, tenant=self.tenant, landlord=self.landlord,
            start_date='2026-01-01', monthly_rent=Decimal('10000'), status=TenancyStatus.ACTIVE,
        )

    def test_announcement_targets_active_tenants(self):
        ann = send_announcement(self.landlord, 'Rent due', 'Please pay rent', 'all_tenants')
        self.assertEqual(ann.recipients.count(), 1)
        self.assertEqual(ann.recipients.first().tenancy, self.tenancy)
