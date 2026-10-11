"""Shared abstract base models."""

from django.db import models
from django.utils import timezone


class TimeStampedModel(models.Model):
    """Adds ``created_at`` / ``updated_at`` audit timestamps."""

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ('-created_at',)


class SoftDeleteQuerySet(models.QuerySet):
    def active(self):
        return self.filter(deleted_at__isnull=True)

    def deleted(self):
        return self.filter(deleted_at__isnull=False)


class SoftDeleteModel(models.Model):
    """
    Soft-deletion support.

    Records are never hard-deleted by the application; ``deleted_at`` marks
    them as archived. Use ``objects.active()`` to exclude archived rows.
    """

    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)

    objects = SoftDeleteQuerySet.as_manager()
    all_objects = models.Manager()

    class Meta:
        abstract = True

    def soft_delete(self, *, using=None):
        self.deleted_at = timezone.now()
        self.save(update_fields=['deleted_at', 'updated_at'])

    def restore(self):
        self.deleted_at = None
        self.save(update_fields=['deleted_at', 'updated_at'])
