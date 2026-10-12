from django.contrib import admin

from .models import Location


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ('name', 'level', 'parent', 'is_active')
    list_filter = ('level', 'is_active')
    search_fields = ('name', 'name_bn')