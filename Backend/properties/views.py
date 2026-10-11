"""Properties views: public discovery, landlord management, employee operations."""

from django.db.models import Prefetch
from django.utils import timezone
from rest_framework import decorators, mixins, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from common.pagination import StandardResultsSetPagination
from common.permissions import (
    CanViewPrivateLocation,
    IsAuthenticatedAndActive,
    IsLandlord,
    IsStaffOrSuperuser,
)

from .filters import PropertyListingFilter
from .models import (
    Amenity,
    ListingSource,
    ListingStatus,
    ListingVerification,
    LocationAccessGrant,
    LocationGrantStatus,
    MediaVisibility,
    Property,
    PropertyInquiry,
    PropertyListing,
    PropertyMedia,
    PropertyUnit,
    SavedProperty,
)
from .serializers import (
    AmenitySerializer,
    LocationAccessGrantSerializer,
    PropertyContactDetailsSerializer,
    PropertyCreateSerializer,
    PropertyInquirySerializer,
    PropertyListingCreateSerializer,
    PropertyListingOwnerSerializer,
    PropertyMediaSerializer,
    PropertyOwnerSerializer,
    PropertyUnitSerializer,
    PublicListingSerializer,
    PublicPropertySerializer,
    SavedPropertySerializer,
)
from .services import (
    can_view_private_location,
    create_property,
    grant_location_access,
    publish_listing,
    submit_for_review,
)


# ---------------------------------------------------------------------------
# Public discovery
# ---------------------------------------------------------------------------
class PublicPropertyViewSet(viewsets.ReadOnlyModelViewSet):
    """Public, published properties and their listings."""
    pagination_class = StandardResultsSetPagination
    permission_classes = [permissions.AllowAny]

    def get_serializer_class(self):
        if self.action == 'list':
            return PublicListingSerializer
        return PublicPropertySerializer

    def get_queryset(self):
        if self.action == 'list':
            return PropertyListing.objects.filter(
                status=ListingStatus.PUBLISHED,
                verification_status=ListingVerification.VERIFIED,
            ).select_related('property', 'unit').prefetch_related('unit__amenities', 'media')
        return Property.objects.filter(
            listings__status=ListingStatus.PUBLISHED,
            listings__verification_status=ListingVerification.VERIFIED,
        ).distinct().prefetch_related(
            Prefetch('listings', queryset=PropertyListing.objects.filter(
                status=ListingStatus.PUBLISHED,
                verification_status=ListingVerification.VERIFIED,
            )),
            'units',
        )

    @decorators.action(detail=True, methods=['get'])
    def media(self, request, pk=None):
        prop = self.get_object()
        media = prop.media.filter(visibility=MediaVisibility.PUBLIC)
        return Response(PropertyMediaSerializer(media, many=True).data)

    @decorators.action(detail=True, methods=['post', 'delete'])
    def save(self, request, pk=None):
        prop = self.get_object()
        if request.method == 'DELETE':
            SavedProperty.objects.filter(user=request.user, listing__property=prop).delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        listing = prop.listings.filter(
            status=ListingStatus.PUBLISHED,
            verification_status=ListingVerification.VERIFIED,
        ).first()
        if not listing:
            return Response({'error': {'code': 'not_found', 'message': 'No published listing for this property.'}}, status=status.HTTP_404_NOT_FOUND)
        obj, created = SavedProperty.objects.get_or_create(user=request.user, listing=listing)
        return Response(SavedPropertySerializer(obj).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class PropertyListingSearchViewSet(viewsets.ReadOnlyModelViewSet):
    """Public listing search with filtering, ordering, pagination."""
    serializer_class = PublicListingSerializer
    pagination_class = StandardResultsSetPagination
    permission_classes = [permissions.AllowAny]
    filterset_class = PropertyListingFilter
    ordering_fields = ('monthly_rent', 'created_at', 'unit__size_sqft', 'availability_date')
    ordering = ('-created_at',)

    def get_queryset(self):
        return PropertyListing.objects.filter(
            status=ListingStatus.PUBLISHED,
            verification_status=ListingVerification.VERIFIED,
        ).select_related('property', 'unit').prefetch_related('unit__amenities', 'media')


class AmenityViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AmenitySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None

    def get_queryset(self):
        return Amenity.objects.filter(active=True)


class PropertyMediaViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PropertyMediaSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        return PropertyMedia.objects.filter(visibility=MediaVisibility.PUBLIC).select_related('property')


class SavedPropertyViewSet(viewsets.ModelViewSet):
    serializer_class = SavedPropertySerializer
    permission_classes = [IsAuthenticatedAndActive]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        return SavedProperty.objects.filter(user=self.request.user).select_related('listing', 'listing__property')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class PropertyInquiryViewSet(viewsets.ModelViewSet):
    serializer_class = PropertyInquirySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = StandardResultsSetPagination
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return PropertyInquiry.objects.all()
        if user.is_authenticated:
            return PropertyInquiry.objects.filter(user=user)
        return PropertyInquiry.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(
            user=user if user.is_authenticated else None,
            guest_name='' if user.is_authenticated else serializer.validated_data.get('guest_name', ''),
        )


class LocationAccessRequestView(APIView):
    """Request private location access. Creates a PENDING grant for staff approval."""

    permission_classes = [IsAuthenticatedAndActive]

    def post(self, request, pk):
        try:
            listing = PropertyListing.objects.get(pk=pk)
        except PropertyListing.DoesNotExist:
            return Response({'error': {'code': 'not_found', 'message': 'Listing not found.'}}, status=status.HTTP_404_NOT_FOUND)

        grant, created = LocationAccessGrant.objects.get_or_create(
            listing=listing,
            user=request.user,
            defaults={'source': 'staff', 'status': LocationGrantStatus.PENDING, 'reason': 'Requested by user'},
        )
        return Response(
            LocationAccessGrantSerializer(grant).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


# ---------------------------------------------------------------------------
# Landlord management
# ---------------------------------------------------------------------------
class LandlordPropertyViewSet(viewsets.ModelViewSet):
    """Landlords manage properties they own."""
    permission_classes = [IsAuthenticatedAndActive, IsLandlord]
    pagination_class = StandardResultsSetPagination

    def get_serializer_class(self):
        if self.action == 'create':
            return PropertyCreateSerializer
        return PropertyOwnerSerializer

    def get_queryset(self):
        return Property.objects.filter(landlord=self.request.user).prefetch_related('units')

    def perform_create(self, serializer):
        data = serializer.validated_data
        prop = create_property(actor=self.request.user, landlord=self.request.user, data=data)
        return prop

    @decorators.action(detail=True, methods=['post'], serializer_class=PropertyUnitSerializer)
    def units(self, request, pk=None):
        prop = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        unit = PropertyUnit.objects.create(property=prop, **serializer.validated_data)
        return Response(PropertyUnitSerializer(unit).data, status=status.HTTP_201_CREATED)


class LandlordListingViewSet(viewsets.ModelViewSet):
    """Landlords manage their listings."""
    permission_classes = [IsAuthenticatedAndActive, IsLandlord]
    pagination_class = StandardResultsSetPagination

    def get_serializer_class(self):
        if self.action == 'create':
            return PropertyListingCreateSerializer
        return PropertyListingOwnerSerializer

    def get_queryset(self):
        return PropertyListing.objects.filter(property__landlord=self.request.user).select_related('property', 'unit')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, source=ListingSource.LANDLORD)

    @decorators.action(detail=True, methods=['post'])
    def submit_for_review(self, request, pk=None):
        listing = self.get_object()
        try:
            submit_for_review(listing, request.user)
        except ValueError as exc:
            return Response({'error': {'code': 'invalid_transition', 'message': str(exc)}}, status=status.HTTP_400_BAD_REQUEST)
        return Response(PropertyListingOwnerSerializer(listing).data)


class LandlordTenancyViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticatedAndActive, IsLandlord]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        from rentals.models import Tenancy
        return Tenancy.objects.filter(landlord=self.request.user).select_related('tenant', 'unit', 'unit__property')


class LandlordTenantViewSet(viewsets.ReadOnlyModelViewSet):
    """Tenants across the landlord's active tenancies."""
    permission_classes = [IsAuthenticatedAndActive, IsLandlord]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        from rentals.models import Tenancy
        from accounts.models import User
        return User.objects.filter(tenancies__landlord=self.request.user).distinct()


class LandlordComplaintViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticatedAndActive, IsLandlord]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        from complaints.models import Complaint
        return Complaint.objects.filter(tenancy__landlord=self.request.user).select_related('tenancy', 'unit')


class LandlordInvoiceViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticatedAndActive, IsLandlord]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        from billing.models import RentInvoice
        return RentInvoice.objects.filter(tenancy__landlord=self.request.user).select_related('tenancy')


class LandlordPaymentViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticatedAndActive, IsLandlord]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        from billing.models import Payment
        return Payment.objects.filter(tenancy__landlord=self.request.user).select_related('tenancy')


class LandlordAnnouncementView(APIView):
    """Landlord sends an announcement to active tenants of their properties."""
    permission_classes = [IsAuthenticatedAndActive, IsLandlord]

    def post(self, request):
        from communications.services import send_announcement
        title = request.data.get('title', '')
        body = request.data.get('body', '')
        targeting_mode = request.data.get('targeting_mode', 'all_tenants')
        if not title or not body:
            return Response({'error': {'code': 'invalid', 'message': 'title and body are required.'}}, status=status.HTTP_400_BAD_REQUEST)
        announcement = send_announcement(request.user, title, body, targeting_mode)
        return Response({'id': str(announcement.id), 'title': announcement.title}, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# Employee / staff operations
# ---------------------------------------------------------------------------
class EmployeePropertyViewSet(viewsets.ModelViewSet):
    """Staff: intake, verify, and manage all properties."""
    permission_classes = [IsAuthenticatedAndActive, IsStaffOrSuperuser]
    pagination_class = StandardResultsSetPagination

    def get_serializer_class(self):
        if self.action == 'create':
            return PropertyCreateSerializer
        return PropertyOwnerSerializer

    def get_queryset(self):
        return Property.objects.all().prefetch_related('units', 'ownership_documents', 'contacts')

    def perform_create(self, serializer):
        data = serializer.validated_data
        landlord = None
        # Staff may associate a verified landlord account if provided.
        from accounts.models import User, Role
        landlord_id = self.request.data.get('landlord')
        if landlord_id:
            landlord = User.objects.filter(pk=landlord_id, roles__role=Role.LANDLORD).first()
        create_property(actor=self.request.user, landlord=landlord, data=data)

    @decorators.action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        prop = self.get_object()
        prop.ownership_verified = True
        prop.verified_by = request.user
        prop.verified_at = timezone.now()
        prop.save(update_fields=['ownership_verified', 'verified_by', 'verified_at', 'updated_at'])
        return Response(PropertyOwnerSerializer(prop).data)


class EmployeeListingViewSet(viewsets.ModelViewSet):
    """Staff: review and approve/reject listings."""
    permission_classes = [IsAuthenticatedAndActive, IsStaffOrSuperuser]
    pagination_class = StandardResultsSetPagination
    serializer_class = PropertyListingOwnerSerializer

    def get_queryset(self):
        return PropertyListing.objects.all().select_related('property', 'unit')

    @decorators.action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        listing = self.get_object()
        listing.verification_status = ListingVerification.VERIFIED
        listing.save(update_fields=['verification_status', 'updated_at'])
        try:
            publish_listing(listing, request.user)
        except ValueError:
            pass
        return Response(PropertyListingOwnerSerializer(listing).data)

    @decorators.action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        listing = self.get_object()
        previous = listing.status
        listing.status = ListingStatus.REJECTED
        listing.verification_status = ListingVerification.REJECTED
        listing.save(update_fields=['status', 'verification_status', 'updated_at'])
        from .models import ListingAudit
        ListingAudit.objects.create(
            listing=listing, property=listing.property, actor=request.user,
            from_status=previous, to_status=ListingStatus.REJECTED,
            note=request.data.get('note', ''),
        )
        return Response(PropertyListingOwnerSerializer(listing).data)


class EmployeeLocationGrantViewSet(viewsets.ModelViewSet):
    """Staff: approve/revoke location access grants."""
    permission_classes = [IsAuthenticatedAndActive, IsStaffOrSuperuser]
    serializer_class = LocationAccessGrantSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        return LocationAccessGrant.objects.all().select_related('listing', 'user')

    @decorators.action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        grant = self.get_object()
        grant.status = LocationGrantStatus.GRANTED
        grant.granted_by = request.user
        grant.granted_at = timezone.now()
        grant.save(update_fields=['status', 'granted_by', 'granted_at', 'updated_at'])
        return Response(LocationAccessGrantSerializer(grant).data)

    @decorators.action(detail=True, methods=['post'])
    def revoke(self, request, pk=None):
        grant = self.get_object()
        grant.status = LocationGrantStatus.REVOKED
        grant.revoked_at = timezone.now()
        grant.revoke_reason = request.data.get('reason', '')
        grant.save(update_fields=['status', 'revoked_at', 'revoke_reason', 'updated_at'])
        return Response(LocationAccessGrantSerializer(grant).data)


