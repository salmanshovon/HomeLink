# Backend implementation conventions

All apps live under `Backend/`. API prefix is `/api/v1/`.

## URL wiring
- Each app has `urls.py` with `app_name = '<app>'` and a `urlpatterns` list.
- Use `rest_framework.routers.DefaultRouter()` and register viewsets, OR explicit
  `path(...)` entries. Keep names stable.
- `config/urls.py` includes each app under `/api/v1/<prefix>/`.

## Serializers
- `ModelSerializer` subclasses. Separate serializers for public / owner / tenant /
  staff when field exposure differs (e.g. never expose NID, private addresses,
  caretaker contacts, internal notes, payment secrets).
- Validate money with `MinValueValidator(0)`; use `DecimalField(max_digits=12, decimal_places=2)`.
- Derive the acting user from `self.context['request'].user` — never trust a
  client-supplied user/landlord/owner id for authorization.

## Views / viewsets
- Set `permission_classes` at the viewset level and `get_queryset()` scoping.
- Use `IsAuthenticatedAndActive` as the baseline for protected endpoints.
- Use the shared permissions in `common.permissions`
  (`IsLandlord`, `IsTenant`, `IsEmployee`, `IsStaffOrSuperuser`,
  `CanManageProperty`, `CanAccessTenancy`, `CanViewPrivateLocation`,
  `CanAccessConversation`, `CanManageInvoice`, `CanVerifyPayment`).
- State transitions go through explicit service functions, not arbitrary PATCH.

## Services
- `services.py` holds module-level functions for multi-step operations.
- Wrap multi-record writes in `with transaction.atomic():`.
- Use `select_for_update()` for concurrent financial/tenancy operations.
- Never perform irreversible side effects before commit.

## Money
- All monetary fields are `DecimalField`. Never use float.

## Files
- Public media → default storage (`media/`). Private documents →
  `common.storage.private_media_storage` (`private_media/`), served only via
  permission-checked download endpoints.

## Errors
- `common.exceptions.standardized_exception_handler` already formats errors.
- Raise `rest_framework.exceptions.ValidationError` / `PermissionNotFound` etc.

## Filters
- Use `django_filters.rest_framework.DjangoFilterBackend` with a `FilterSet`
  in `filters.py` for list endpoints that need filtering.

## Tests
- Django `APITestCase` / `TestCase`. Put tests in `tests/` package or `tests.py`.
