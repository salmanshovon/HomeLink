"""Storage backends.

Public media (listing images) uses the default storage. Sensitive files
(ownership documents, tenancy agreements, identity documents) use
``PrivateMediaStorage``, which lives outside ``MEDIA_ROOT`` and is served only
through permission-checked endpoints.
"""

from django.core.files.storage import FileSystemStorage
from django.utils.functional import cached_property

from config.settings.base import PRIVATE_MEDIA_ROOT


class PrivateMediaStorage(FileSystemStorage):
    """FileSystem storage rooted at the private media directory."""

    def __init__(self, *args, **kwargs):
        kwargs.setdefault('location', PRIVATE_MEDIA_ROOT)
        kwargs.setdefault('base_url', None)
        super().__init__(*args, **kwargs)

    def url(self, name):
        """Private files must never be served through a public URL."""
        raise NotImplementedError(
            'Private media cannot be accessed via URL; use the authorized download endpoint.'
        )


private_media_storage = PrivateMediaStorage()
