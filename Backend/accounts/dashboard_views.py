"""Superadmin dashboard metrics endpoint."""

from django.db.models import Count, Sum, Avg, Q, F
from django.db.models.functions import TruncMonth, TruncDay
from django.utils import timezone
from datetime import timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from common.permissions import IsStaffOrSuperuser

from accounts.models import User, UserRole, AccountStatus, EmployeeProfile, LandlordProfile, TenantProfile
from properties.models import Property, PropertyListing, PropertyUnit
from rentals.models import Tenancy, ViewingAppointment, RentalApplication
from billing.models import RentInvoice, Payment, Bill
from complaints.models import Complaint
from leads.models import Lead, RentalRequirement
from services.models import ServiceRequest
from communications.models import Conversation, Message
from notifications.models import Notification


class AdminDashboardMetricsView(APIView):
    """Aggregate metrics for the superadmin dashboard. Staff only."""

    permission_classes = [IsStaffOrSuperuser]

    def get(self, request):
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)
        ninety_days_ago = now - timedelta(days=90)

        data = {}

        data['users'] = self._user_metrics()
        data['properties'] = self._property_metrics()
        data['rentals'] = self._rental_metrics()
        data['billing'] = self._billing_metrics(thirty_days_ago)
        data['complaints'] = self._complaint_metrics()
        data['leads'] = self._lead_metrics()
        data['services'] = self._service_metrics()
        data['communications'] = self._communication_metrics()
        data['recent_activity'] = self._recent_activity()

        return Response(data)

    def _user_metrics(self):
        total = User.objects.count()
        by_role = {}
        for role_choice in ['landlord', 'tenant', 'employee', 'superadmin']:
            by_role[role_choice] = UserRole.objects.filter(role=role_choice).count()

        by_status = {}
        for s in AccountStatus.values:
            by_status[s] = User.objects.filter(account_status=s).count()

        phone_verified = User.objects.filter(is_phone_verified=True).count()
        landlord_verified = LandlordProfile.objects.filter(profile_verified=True).count()
        tenant_verified = TenantProfile.objects.filter(profile_verified=True).count()

        active_employees = EmployeeProfile.objects.filter(employment_status='active').count()

        return {
            'total': total,
            'by_role': by_role,
            'by_status': by_status,
            'phone_verified': phone_verified,
            'phone_verification_rate': round(phone_verified / total * 100, 1) if total else 0,
            'landlord_verified': landlord_verified,
            'tenant_verified': tenant_verified,
            'active_employees': active_employees,
        }

    def _property_metrics(self):
        total_properties = Property.objects.count()
        total_units = PropertyUnit.objects.count()
        total_listings = PropertyListing.objects.count()

        prop_by_category = {}
        for cat in ['apartment', 'house', 'duplex', 'studio', 'commercial']:
            prop_by_category[cat] = Property.objects.filter(category=cat).count()

        listing_by_status = {}
        for s in ['draft', 'pending_review', 'published', 'reserved', 'rented', 'suspended', 'rejected', 'archived']:
            listing_by_status[s] = PropertyListing.objects.filter(status=s).count()

        unit_by_availability = {}
        for a in ['available', 'reserved', 'rented', 'unavailable']:
            unit_by_availability[a] = PropertyUnit.objects.filter(availability_status=a).count()

        avg_rent = PropertyListing.objects.filter(monthly_rent__isnull=False).aggregate(avg=Avg('monthly_rent'))['avg']
        avg_rent = round(avg_rent, 0) if avg_rent else 0

        return {
            'total_properties': total_properties,
            'total_units': total_units,
            'total_listings': total_listings,
            'by_category': prop_by_category,
            'listings_by_status': listing_by_status,
            'units_by_availability': unit_by_availability,
            'avg_monthly_rent': avg_rent,
        }

    def _rental_metrics(self):
        total_tenancies = Tenancy.objects.count()
        active_tenancies = Tenancy.objects.filter(status='active').count()

        tenancy_by_status = {}
        for s in ['pending', 'active', 'expired', 'terminated', 'cancelled']:
            tenancy_by_status[s] = Tenancy.objects.filter(status=s).count()

        viewings_total = ViewingAppointment.objects.count()
        viewings_by_status = {}
        for s in ['requested', 'confirmed', 'rescheduled', 'completed', 'cancelled', 'no_show']:
            viewings_by_status[s] = ViewingAppointment.objects.filter(status=s).count()

        apps_total = RentalApplication.objects.count()
        apps_by_status = {}
        for s in ['submitted', 'under_review', 'approved', 'rejected', 'withdrawn']:
            apps_by_status[s] = RentalApplication.objects.filter(status=s).count()

        avg_rent = Tenancy.objects.filter(monthly_rent__isnull=False).aggregate(avg=Avg('monthly_rent'))['avg']
        avg_rent = round(avg_rent, 0) if avg_rent else 0

        return {
            'total_tenancies': total_tenancies,
            'active_tenancies': active_tenancies,
            'by_status': tenancy_by_status,
            'viewings': {'total': viewings_total, 'by_status': viewings_by_status},
            'applications': {'total': apps_total, 'by_status': apps_by_status},
            'avg_tenancy_rent': avg_rent,
        }

    def _billing_metrics(self, thirty_days_ago):
        total_invoiced = RentInvoice.objects.filter(status__in=['issued', 'partially_paid', 'paid', 'overdue']).aggregate(total=Sum('total_amount'))['total'] or 0
        total_collected = RentInvoice.objects.filter(status__in=['paid', 'partially_paid']).aggregate(total=Sum('paid_amount'))['total'] or 0
        total_outstanding = RentInvoice.objects.filter(status__in=['partially_paid', 'overdue', 'issued']).aggregate(total=Sum('outstanding_amount'))['total'] or 0

        overdue_count = RentInvoice.objects.filter(status='overdue').count()

        payments_total = Payment.objects.filter(status='successful').aggregate(total=Sum('amount'))['total'] or 0
        payments_count = Payment.objects.filter(status='successful').count()

        payments_by_method = {}
        for m in ['cash', 'bank', 'mobile', 'online']:
            result = Payment.objects.filter(status='successful', method=m).aggregate(total=Sum('amount'))
            payments_by_method[m] = result['total'] or 0

        collection_rate = round(total_collected / total_invoiced * 100, 1) if total_invoiced else 0

        return {
            'total_invoiced': round(total_invoiced, 2),
            'total_collected': round(total_collected, 2),
            'total_outstanding': round(total_outstanding, 2),
            'overdue_count': overdue_count,
            'payments_total': round(payments_total, 2),
            'payments_count': payments_count,
            'payments_by_method': payments_by_method,
            'collection_rate': collection_rate,
        }

    def _complaint_metrics(self):
        total = Complaint.objects.count()
        by_category = {}
        for c in ['plumbing', 'electrical', 'security', 'cleanliness', 'noise', 'structural', 'billing', 'other']:
            by_category[c] = Complaint.objects.filter(category=c).count()

        by_priority = {}
        for p in ['low', 'medium', 'high', 'urgent']:
            by_priority[p] = Complaint.objects.filter(priority=p).count()

        by_status = {}
        for s in ['open', 'acknowledged', 'in_progress', 'awaiting_customer', 'resolved', 'closed', 'reopened']:
            by_status[s] = Complaint.objects.filter(status=s).count()

        resolved = Complaint.objects.filter(status__in=['resolved', 'closed']).count()
        resolution_rate = round(resolved / total * 100, 1) if total else 0

        return {
            'total': total,
            'by_category': by_category,
            'by_priority': by_priority,
            'by_status': by_status,
            'resolution_rate': resolution_rate,
        }

    def _lead_metrics(self):
        total = Lead.objects.count()
        by_status = {}
        for s in ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']:
            by_status[s] = Lead.objects.filter(status=s).count()

        won = Lead.objects.filter(status='won').count()
        conversion_rate = round(won / total * 100, 1) if total else 0

        requirements = RentalRequirement.objects.count()

        return {
            'total': total,
            'by_status': by_status,
            'conversion_rate': conversion_rate,
            'requirements': requirements,
        }

    def _service_metrics(self):
        total = ServiceRequest.objects.count()
        by_status = {}
        for s in ['submitted', 'reviewing', 'quoted', 'accepted', 'scheduled', 'in_progress', 'completed', 'cancelled']:
            by_status[s] = ServiceRequest.objects.filter(status=s).count()

        completed = ServiceRequest.objects.filter(status='completed').count()
        completion_rate = round(completed / total * 100, 1) if total else 0

        return {
            'total': total,
            'by_status': by_status,
            'completion_rate': completion_rate,
        }

    def _communication_metrics(self):
        conversations = Conversation.objects.count()
        messages = Message.objects.count()
        unread_notifications = Notification.objects.filter(is_read=False).count()
        total_notifications = Notification.objects.count()

        return {
            'conversations': conversations,
            'messages': messages,
            'unread_notifications': unread_notifications,
            'total_notifications': total_notifications,
        }

    def _recent_activity(self):
        """Recent users and properties for the activity feed."""
        recent_users = User.objects.order_by('-created_at')[:5].values('id', 'phone_number', 'first_name', 'account_status', 'created_at')
        recent_properties = Property.objects.order_by('-created_at')[:5].values('id', 'title', 'category', 'status', 'created_at')

        return {
            'recent_users': list(recent_users),
            'recent_properties': list(recent_properties),
        }
