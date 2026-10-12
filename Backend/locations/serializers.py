from rest_framework import serializers

from .models import Location, LocationLevel


class LocationSerializer(serializers.ModelSerializer):
    """One node in the location tree, for cascading dropdowns."""

    label = serializers.CharField(read_only=True)
    parent_name = serializers.CharField(source='parent.name', read_only=True, default=None)

    class Meta:
        model = Location
        fields = (
            'id', 'name', 'name_bn', 'slug', 'level',
            'parent', 'parent_name', 'label',
            'latitude', 'longitude', 'is_active',
        )
        read_only_fields = ('id', 'slug', 'level', 'parent', 'latitude', 'longitude', 'is_active')