"""Seed development base data: amenities and service categories.

Development only. Never run in production.
"""

from django.core.management.base import BaseCommand

from properties.models import Amenity
from services.models import ServiceCategory

AMENITIES = [
    ('Lift', 'building'),
    ('Generator', 'utility'),
    ('Gas line', 'utility'),
    ('Parking', 'building'),
    ('Rooftop access', 'building'),
    ('Security guard', 'security'),
    ('Water supply', 'utility'),
    ('Internet availability', 'utility'),
]

SERVICE_CATEGORIES = [
    ('PABX', 'PABX installation and servicing'),
    ('CCTV', 'CCTV installation and servicing'),
    ('Television servicing', 'Television repair and servicing'),
    ('Air-conditioner servicing', 'AC repair and servicing'),
    ('Refrigerator servicing', 'Refrigerator repair and servicing'),
]


class Command(BaseCommand):
    help = 'Seed amenities and service categories (development only).'

    def handle(self, *args, **options):
        for name, category in AMENITIES:
            Amenity.objects.get_or_create(
                name=name,
                defaults={'slug': name.lower().replace(' ', '-'), 'category': category},
            )
        for name, description in SERVICE_CATEGORIES:
            ServiceCategory.objects.get_or_create(
                name=name,
                defaults={
                    'slug': name.lower().replace(' ', '-'),
                    'description': description,
                },
            )
        self.stdout.write(self.style.SUCCESS('Seeded amenities and service categories.'))
