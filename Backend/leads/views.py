"""Leads views: rental requirements, service requests, matches, leads."""

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from common.pagination import StandardResultsSetPagination
from common.permissions import IsAuthenticatedAndActive, IsStaffOrSuperuser, IsTenant

from .models import Lead, RequirementMatch, RentalRequirement, RentalServiceRequest
from .serializers import (
    LeadSerializer,
    RequirementMatchSerializer,
    RentalRequirementSerializer,
    RentalServiceRequestSerializer,
)
from .services import create_lead, create_match, create_requirement


def _is_staff(user):
    """Staff = admin, superuser, or a user with the employee role."""
    from accounts.models import Role

    return bool(
        user.is_staff or user.is_superuser or user.roles.filter(role=Role.EMPLOYEE).exists()
    )


class RentalRequirementViewSet(viewsets.ModelViewSet):
    """Create, list, and update rental requirements.

    Tenants see and manage their own requirements; staff see all. A tenant
    creates a requirement for themselves; staff may create on behalf of a
    customer by supplying the customer's user id. Object-level access for
    retrieve/update is scoped to the owner or staff via ``get_queryset()``.
    """

    serializer_class = RentalRequirementSerializer
    pagination_class = StandardResultsSetPagination
    permission_classes = [IsAuthenticatedAndActive]
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        if _is_staff(user):
            return RentalRequirement.objects.all()
        return RentalRequirement.objects.filter(tenant=user)

    def create(self, request, *args, **kwargs):
        is_staff = IsStaffOrSuperuser().has_permission(request, self)
        is_tenant = IsTenant().has_permission(request, self)
        if not (is_staff or is_tenant):
            raise PermissionDenied('Only tenants or staff may create rental requirements.')

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)

        if is_staff:
            tenant = data.get('tenant')
            if tenant is None:
                raise ValidationError({'tenant': 'Staff must specify the customer (tenant).'})
        else:
            # A tenant always creates for themselves; never trust a client-supplied tenant id.
            tenant = request.user
            data.pop('tenant', None)

        requirement = create_requirement(tenant=tenant, entered_by=request.user, **data)
        serializer = self.get_serializer(requirement)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='service-requests')
    def create_service_request(self, request, pk=None):
        """Create a :class:`RentalServiceRequest` linked to this requirement."""
        requirement = self.get_object()

        serializer = RentalServiceRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = dict(serializer.validated_data)
        data.pop('requirement', None)  # requirement always comes from the URL
        data.setdefault('customer', requirement.tenant)

        service_request = RentalServiceRequest.objects.create(requirement=requirement, **data)
        return Response(
            RentalServiceRequestSerializer(service_request).data, status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['get'], url_path='matches')
    def list_matches(self, request, pk=None):
        """List the matches suggested for this requirement."""
        requirement = self.get_object()
        matches = requirement.matches.all()
        serializer = RequirementMatchSerializer(matches, many=True)
        return Response(serializer.data)


class RentalServiceRequestViewSet(viewsets.ModelViewSet):
    """List rental service requests, scoped to the customer or staff."""

    serializer_class = RentalServiceRequestSerializer
    pagination_class = StandardResultsSetPagination
    permission_classes = [IsAuthenticatedAndActive]
    http_method_names = ['get', 'patch', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        if _is_staff(user):
            return RentalServiceRequest.objects.all()
        return RentalServiceRequest.objects.filter(customer=user)

    @action(
        detail=True,
        methods=['post'],
        permission_classes=[IsStaffOrSuperuser],
        url_path='matches',
    )
    def create_match(self, request, pk=None):
        """Staff: suggest a listing match for this service request's requirement."""
        service_request = self.get_object()

        serializer = RequirementMatchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        match = create_match(
            requirement=service_request.requirement,
            suggested_by=request.user,
            **serializer.validated_data,
        )
        return Response(RequirementMatchSerializer(match).data, status=status.HTTP_201_CREATED)


class LeadViewSet(viewsets.ModelViewSet):
    """Staff-only leads: list, create, retrieve, and update."""

    serializer_class = LeadSerializer
    pagination_class = StandardResultsSetPagination
    permission_classes = [IsAuthenticatedAndActive, IsStaffOrSuperuser]
    http_method_names = ['get', 'post', 'patch', 'head', 'options']
    queryset = Lead.objects.all()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lead = create_lead(**serializer.validated_data)
        serializer = self.get_serializer(lead)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
