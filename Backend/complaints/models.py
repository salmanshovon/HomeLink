"""Complaints domain: complaints, attachments, comments."""

import uuid

from django.conf import settings
from django.db import models

from common.models import TimeStampedModel
from common.validators import validate_document

User = settings.AUTH_USER_MODEL


class ComplaintCategory(models.TextChoices):
    PLUMBING = 'plumbing', 'Plumbing'
    ELECTRICAL = 'electrical', 'Electrical'
    SECURITY = 'security', 'Security'
    CLEANLINESS = 'cleanliness', 'Cleanliness'
    NOISE = 'noise', 'Noise'
    STRUCTURAL = 'structural', 'Structural'
    BILLING = 'billing', 'Billing'
    OTHER = 'other', 'Other'


class ComplaintPriority(models.TextChoices):
    LOW = 'low', 'Low'
    MEDIUM = 'medium', 'Medium'
    HIGH = 'high', 'High'
    URGENT = 'urgent', 'Urgent'


class ComplaintStatus(models.TextChoices):
    OPEN = 'open', 'Open'
    ACKNOWLEDGED = 'acknowledged', 'Acknowledged'
    IN_PROGRESS = 'in_progress', 'In progress'
    AWAITING_CUSTOMER = 'awaiting_customer', 'Awaiting customer'
    RESOLVED = 'resolved', 'Resolved'
    CLOSED = 'closed', 'Closed'
    REOPENED = 'reopened', 'Reopened'


class Complaint(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    complainant = models.ForeignKey(User, on_delete=models.PROTECT, related_name='complaints')
    tenancy = models.ForeignKey('rentals.Tenancy', on_delete=models.PROTECT, related_name='complaints')
    unit = models.ForeignKey('properties.PropertyUnit', null=True, blank=True, on_delete=models.SET_NULL, related_name='complaints')
    category = models.CharField(max_length=20, choices=ComplaintCategory.choices)
    subject = models.CharField(max_length=255)
    description = models.TextField()
    priority = models.CharField(
        max_length=10, choices=ComplaintPriority.choices, default=ComplaintPriority.MEDIUM
    )
    status = models.CharField(
        max_length=20, choices=ComplaintStatus.choices, default=ComplaintStatus.OPEN, db_index=True
    )
    assigned_landlord = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='assigned_complaints'
    )
    assigned_employee = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name='assigned_complaints_staff'
    )
    resolution_details = models.TextField(blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return f'complaint:{self.id}:{self.get_category_display()}'


class ComplaintAttachment(TimeStampedModel):
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='complaints/attachments/%Y/%m/', validators=[validate_document])
    uploaded_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='complaint_attachments')

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return f'complaint-attachment:{self.complaint_id}'


class ComplaintComment(TimeStampedModel):
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.PROTECT, related_name='complaint_comments')
    message = models.TextField()
    is_internal = models.BooleanField(default=False)

    class Meta:
        ordering = ('created_at',)

    def __str__(self):
        return f'complaint-comment:{self.complaint_id}:{self.author_id}'
