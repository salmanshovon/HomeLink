"""
Reusable DRF permission classes.

Role checks are performed against the authenticated user's assigned roles
(``accounts.UserRole``). Object-level permissions are provided for the
resources that need ownership/tenancy scoping. All privileged role grants are
made server-side; public registration can never self-assign them.
"""

from rest_framework import permissions


class IsAuthenticatedAndActive(permissions.IsAuthenticated):
    """Only active accounts may access the API."""

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user.is_authenticated
            and user.is_active
            and getattr(user, 'account_status', None) == 'active'
        )


def _has_role(user, role):
    return user.roles.filter(role=role).exists()


class IsAdminOrSuperuser(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(user.is_authenticated and (user.is_staff or user.is_superuser))


class IsLandlord(permissions.BasePermission):
    message = 'This action requires a landlord account.'

    def has_permission(self, request, view):
        from accounts.models import Role

        return bool(request.user.is_authenticated and _has_role(request.user, Role.LANDLORD))


class IsTenant(permissions.BasePermission):
    message = 'This action requires a tenant account.'

    def has_permission(self, request, view):
        from accounts.models import Role

        return bool(request.user.is_authenticated and _has_role(request.user, Role.TENANT))


class IsEmployee(permissions.BasePermission):
    message = 'This action requires a HomeLink employee account.'

    def has_permission(self, request, view):
        from accounts.models import Role

        return bool(request.user.is_authenticated and _has_role(request.user, Role.EMPLOYEE))


class IsStaffOrSuperuser(permissions.BasePermission):
    """Employees, staff and superusers (trusted back-office actors)."""

    message = 'This action requires staff privileges.'

    def has_permission(self, request, view):
        from accounts.models import Role

        user = request.user
        if not user.is_authenticated:
            return False
        return bool(user.is_staff or user.is_superuser or _has_role(user, Role.EMPLOYEE))


class IsOwnerOrStaff(permissions.BasePermission):
    """Generic object permission: owner (via ``owner_field``) or staff."""

    owner_field = 'created_by'
    message = 'You do not have permission to access this object.'

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_staff or user.is_superuser:
            return True
        owner = getattr(obj, self.owner_field, None)
        return owner is not None and owner_id == user.id


class CanManageProperty(permissions.BasePermission):
    """Landlords may manage properties they own or are authorized to manage."""

    message = 'You are not authorized to manage this property.'

    def has_object_permission(self, request, view, obj):
        from accounts.models import Role
        from properties.models import Property

        user = request.user
        if user.is_staff or user.is_superuser:
            return True
        if not _has_role(user, Role.LANDLORD):
            return False

        property_obj = obj if isinstance(obj, Property) else getattr(obj, 'property', obj)
        return property_obj.landlord_id == user.id


class CanAccessTenancy(permissions.BasePermission):
    """Landlord (owner), tenant (member) or authorized staff may access a tenancy."""

    message = 'You are not authorized to access this tenancy.'

    def has_object_permission(self, request, view, obj):
        from accounts.models import Role

        user = request.user
        if user.is_staff or user.is_superuser:
            return True
        if _has_role(user, Role.LANDLORD) and getattr(obj, 'landlord_id', None) == user.id:
            return True
        if _has_role(user, Role.TENANT) and getattr(obj, 'tenant_id', None) == user.id:
            return True
        # Tenancy members / other occupants with their own accounts.
        return obj.members.filter(user=user).exists() if hasattr(obj, 'members') else False


class CanViewPrivateLocation(permissions.BasePermission):
    """Private addresses require an explicit, verified access grant."""

    message = 'You are not authorized to view this property\'s private location.'

    def has_object_permission(self, request, view, obj):
        from properties.services import can_view_private_location

        listing = obj if obj._meta.model_name == 'propertylisting' else getattr(obj, 'listing', None)
        return can_view_private_location(request.user, listing)


class CanAccessConversation(permissions.BasePermission):
    """Only conversation participants (or staff) may read/send messages."""

    message = 'You are not a participant in this conversation.'

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_staff or user.is_superuser:
            return True
        return obj.participants.filter(user=user, is_active=True).exists()


class CanManageInvoice(permissions.BasePermission):
    """Landlord (owner of the tenancy's property) or staff may manage invoices."""

    message = 'You are not authorized to manage this invoice.'

    def has_object_permission(self, request, view, obj):
        from accounts.models import Role

        user = request.user
        if user.is_staff or user.is_superuser:
            return True
        if _has_role(user, Role.LANDLORD):
            tenancy = getattr(obj, 'tenancy', None)
            if tenancy and getattr(tenancy, 'landlord_id', None) == user.id:
                return True
            unit = getattr(obj, 'unit', None)
            if unit and getattr(unit.property, 'landlord_id', None) == user.id:
                return True
        return False


class CanVerifyPayment(permissions.BasePermission):
    """Only trusted staff may mark payments verified or create receipts."""

    message = 'Only authorized staff may verify payments.'

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user.is_authenticated
            and (user.is_staff or user.is_superuser)
        )
