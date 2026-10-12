"""
Location reference data for Bangladesh.

A single self-referencing table models the hierarchy, so each level shares the
same shape and a cascading dropdown is just "children of X":

    division (Dhaka)
      district (Dhaka)
        city (Dhaka)
          area (Uttara, Banani, ...)

Property/address records keep their own text columns for division/district/
city/area, so this table is the authoritative list the UI offers and the API
validates against.
"""

from django.db import models

from common.models import TimeStampedModel


class LocationLevel(models.TextChoices):
    DIVISION = 'division', 'Division'
    DISTRICT = 'district', 'District'
    CITY = 'city', 'City'
    AREA = 'area', 'Area'


#: level -> the level of its parent
PARENT_LEVEL = {
    LocationLevel.DIVISION: None,
    LocationLevel.DISTRICT: LocationLevel.DIVISION,
    LocationLevel.CITY: LocationLevel.DISTRICT,
    LocationLevel.AREA: LocationLevel.CITY,
}


class LocationQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_active=True)

    def of_level(self, level):
        return self.filter(level=level)

    def children_of(self, parent):
        """Direct children of a location, cached for cascading dropdowns."""
        return self.filter(parent=parent).select_related('parent').order_by('name')


class Location(TimeStampedModel):
    """One node in the division/district/city/area tree."""

    name = models.CharField(max_length=120)
    name_bn = models.CharField(max_length=120, blank=True)
    slug = models.SlugField(max_length=140)
    level = models.CharField(max_length=20, choices=LocationLevel.choices, db_index=True)

    parent = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name='children',
    )

    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    is_active = models.BooleanField(default=True, db_index=True)

    # Where the row came from, e.g. the upstream dataset name.
    source = models.CharField(max_length=80, blank=True)

    objects = LocationQuerySet.as_manager()

    class Meta:
        verbose_name = 'location'
        verbose_name_plural = 'locations'
        ordering = ('level', 'name')
        indexes = [models.Index(fields=['level', 'parent'])]
        constraints = [
            models.UniqueConstraint(
                fields=['level', 'parent', 'name'],
                name='uniq_location_name_per_parent',
            ),
        ]

    def __str__(self):
        if self.parent_id:
            return f'{self.parent.name} / {self.name}'
        return self.name

    @property
    def label(self):
        return f'{self.name}, {self.parent.name}' if self.parent_id else self.name

    def clean(self):
        from django.core.exceptions import ValidationError

        expected_parent_level = PARENT_LEVEL[self.level]
        if expected_parent_level is None:
            if self.parent_id:
                raise ValidationError({'parent': 'Divisions cannot have a parent.'})
            return

        if not self.parent_id:
            raise ValidationError({'parent': f'A {self.level} requires a parent {expected_parent_level}.'})

        if self.parent.level != expected_parent_level:
            raise ValidationError({
                'parent': f'A {self.level} must belong to a {expected_parent_level}, '
                          f'not a {self.parent.level}.',
            })