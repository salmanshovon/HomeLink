"""Location lookup endpoints for cascading dropdowns."""

from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Location, LocationLevel
from .serializers import LocationSerializer


class LocationViewSet(viewsets.ReadOnlyModelViewSet):
    """List locations.

    Supports the cascading dropdown pattern:

        /locations/?level=division
        /locations/?level=district&parent=<division uuid>
        /locations/?level=city&parent=<district uuid>
        /locations/?level=area&parent=<city uuid>

    Omitting ``parent`` returns every active location at that level.
    """

    serializer_class = LocationSerializer
    permission_classes = [AllowAny]
    pagination_class = None
    lookup_field = 'pk'

    def get_queryset(self):
        qs = Location.objects.active().order_by('name')

        level = self.request.query_params.get('level')
        if level:
            valid = {choice.value for choice in LocationLevel}
            if level not in valid:
                qs = qs.none()
            else:
                qs = qs.of_level(level)

        parent = self.request.query_params.get('parent')
        if parent:
            try:
                qs = qs.filter(parent_id=parent)
            except (ValueError, TypeError):
                qs = qs.none()

        return qs.select_related('parent')


class LocationTreeView(APIView):
    """The whole tree in one request, for prefetching a cascading form."""

    permission_classes = [AllowAny]

    def get(self, request):
        nodes = Location.objects.active().order_by('level', 'name').select_related('parent')
        return Response(LocationSerializer(nodes, many=True).data)