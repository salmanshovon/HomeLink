"""File validation helpers."""

import mimetypes
import os

from django.core.exceptions import ValidationError
from django.utils.deconstruct import deconstructible

# Allowed content types for public property media.
ALLOWED_IMAGE_TYPES = {
    'image/jpeg': ('.jpg', '.jpeg'),
    'image/png': ('.png',),
    'image/webp': ('.webp',),
}
ALLOWED_MEDIA_TYPES = {
    **ALLOWED_IMAGE_TYPES,
    'video/mp4': ('.mp4',),
    'application/pdf': ('.pdf',),
}

MAX_IMAGE_SIZE_MB = 10
MAX_DOCUMENT_SIZE_MB = 20
MAX_VIDEO_SIZE_MB = 100


@deconstructible
class FileValidator:
    """Validate an uploaded file's extension, content type, and size."""

    def __init__(self, allowed_types, max_size_mb):
        self.allowed_types = allowed_types
        self.max_size_mb = max_size_mb

    def __call__(self, value):
        ext = os.path.splitext(getattr(value, 'name', '') or '')[1].lower()
        content_type = getattr(value, 'content_type', '') or ''

        valid_exts = {
            extension
            for extensions in self.allowed_types.values()
            for extension in extensions
        }
        if ext not in valid_exts:
            raise ValidationError(
                f'Unsupported file type "{ext}". Allowed: {", ".join(sorted(valid_exts))}.'
            )
        if self.allowed_types and content_type not in self.allowed_types:
            raise ValidationError(f'Invalid content type "{content_type}".')

        max_bytes = self.max_size_mb * 1024 * 1024
        if value.size and value.size > max_bytes:
            raise ValidationError(f'File exceeds the {self.max_size_mb} MB limit.')

    def __eq__(self, other):
        return (
            isinstance(other, FileValidator)
            and self.allowed_types == other.allowed_types
            and self.max_size_mb == other.max_size_mb
        )


validate_image = FileValidator(ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_MB)
validate_media = FileValidator(ALLOWED_MEDIA_TYPES, MAX_VIDEO_SIZE_MB)
validate_document = FileValidator(
    {'application/pdf': ('.pdf',)}, MAX_DOCUMENT_SIZE_MB
)
