"""Post-migrate signal handlers: create the role groups."""

from django.contrib.auth.models import Group
from django.db.models.signals import post_migrate
from django.dispatch import receiver

from .models import Role


@receiver(post_migrate)
def create_role_groups(sender, **kwargs):
    """Create one Django group per business role."""
    if getattr(sender, 'name', None) != 'accounts':
        return
    for value in Role.values:
        Group.objects.get_or_create(name=value)
