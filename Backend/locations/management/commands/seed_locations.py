"""Seed the location tree from the bundled Bangladesh dataset.

Idempotent: safe to run repeatedly. Existing rows are updated, never duplicated.
"""

import json
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify

from locations.models import Location, LocationLevel

DATA_FILE = Path(__file__).resolve().parents[2] / 'data' / 'bd_locations.json'


class Command(BaseCommand):
    help = 'Seed divisions, districts, cities and areas from the bundled dataset.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--flush',
            action='store_true',
            help='Delete all existing locations before seeding.',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        payload = json.loads(DATA_FILE.read_text(encoding='utf-8'))
        source = payload.get('source', 'bundled dataset')

        if options['flush']:
            deleted, _ = Location.objects.all().delete()
            self.stdout.write(self.style.WARNING(f'Flushed {deleted} existing locations.'))

        counts = {level: 0 for level, _ in LocationLevel.choices}

        # 1. Divisions
        divisions = {}
        for row in payload['divisions']:
            obj = self._upsert(
                name=row['name'],
                level=LocationLevel.DIVISION,
                parent=None,
                name_bn=row.get('name_bn', ''),
                source=source,
            )
            divisions[row['name']] = obj
            counts[LocationLevel.DIVISION] += 1

        # 2. Districts
        districts = {}
        for row in payload['districts']:
            parent = divisions.get(row['division'])
            if parent is None:
                self.stderr.write(f"Unknown division '{row['division']}'; skipping {row['name']}.")
                continue
            obj = self._upsert(
                name=row['name'],
                level=LocationLevel.DISTRICT,
                parent=parent,
                name_bn=row.get('name_bn', ''),
                source=source,
                latitude=row.get('lat'),
                longitude=row.get('lon'),
            )
            districts[(row['division'], row['name'])] = obj
            counts[LocationLevel.DISTRICT] += 1

        # 3. Cities — Bangladesh has no admin tier below district, so each
        #    district seat is seeded as its eponymous city.
        cities = {}
        for (division_name, district_name), district in districts.items():
            obj = self._upsert(
                name=district_name,
                level=LocationLevel.CITY,
                parent=district,
                name_bn=district.name_bn,
                source=source,
                latitude=district.latitude,
                longitude=district.longitude,
            )
            cities[district_name] = obj
            counts[LocationLevel.CITY] += 1

        # 4. Areas — curated per city (currently Dhaka).
        for city_name, area_names in payload.get('areas', {}).items():
            city = cities.get(city_name)
            if city is None:
                self.stderr.write(f"Unknown city '{city_name}'; skipping its areas.")
                continue
            for area_name in area_names:
                self._upsert(
                    name=area_name,
                    level=LocationLevel.AREA,
                    parent=city,
                    source=source,
                )
                counts[LocationLevel.AREA] += 1

        for level, count in counts.items():
            self.stdout.write(f'  {level:9} {count}')

        total = Location.objects.count()
        self.stdout.write(self.style.SUCCESS(f'Seeded {total} locations.'))

    def _upsert(self, *, name, level, parent, name_bn='', source='', latitude=None, longitude=None):
        obj, created = Location.objects.update_or_create(
            level=level,
            parent=parent,
            name=name,
            defaults={
                'name_bn': name_bn,
                'slug': slugify(f'{parent.name}-{name}' if parent else name),
                'latitude': latitude,
                'longitude': longitude,
                'is_active': True,
                'source': source,
            },
        )
        return obj