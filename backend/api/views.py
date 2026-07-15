from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import SiteSettings, PageContent, Employee, EventItem, EventImage, Review, ServiceItem, ServiceImage, FeaturedVideo
from .serializers import (
    SiteSettingsSerializer,
    PageContentSerializer,
    EmployeeSerializer,
    EventItemSerializer,
    ServiceItemSerializer,
    FeaturedVideoSerializer,
    ReviewSerializer,
    LoginSerializer,
    UserSerializer,
    ChangeCredentialsSerializer,
)


# --- Auth ------------------------------------------------------------------
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "user": UserSerializer(user).data})


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UpdateCredentialsView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        serializer = ChangeCredentialsSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)


# --- Content viewsets ------------------------------------------------------
class SiteSettingsViewSet(viewsets.ViewSet):
    """Singleton settings: GET /site/ and PUT/PATCH /site/."""

    def list(self, request):
        return Response(SiteSettingsSerializer(SiteSettings.load()).data)

    def update_settings(self, request):
        obj = SiteSettings.load()
        data = request.data

        clear_flag = str(data.get("clear_logo", "")).lower() in ("1", "true", "yes")
        # JSON null / empty string clears the custom logo (fallback to default brand mark).
        logo_absent = "logo" in data and not request.FILES.get("logo") and data.get("logo") in (
            None, "", "null",
        )
        if clear_flag or logo_absent:
            if obj.logo:
                obj.logo.delete(save=False)
            obj.logo = None
            obj.save(update_fields=["logo", "updated_at"])
            only_clearing = clear_flag or logo_absent
            other_keys = [k for k in data.keys() if k not in ("logo", "clear_logo")]
            if only_clearing and not other_keys and not request.FILES:
                return Response(SiteSettingsSerializer(obj).data)

        serializer = SiteSettingsSerializer(obj, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class PageContentViewSet(viewsets.ModelViewSet):
    queryset = PageContent.objects.all()
    serializer_class = PageContentSerializer
    lookup_field = "key"


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer


class EventItemViewSet(viewsets.ModelViewSet):
    queryset = EventItem.objects.prefetch_related("images").all()
    serializer_class = EventItemSerializer

    def get_object(self):
        lookup = self.kwargs.get(self.lookup_url_kwarg or "pk")
        qs = self.get_queryset()
        if str(lookup).isdigit():
            return get_object_or_404(qs, pk=lookup)
        return get_object_or_404(qs, slug=lookup)

    @action(detail=True, methods=["post"], url_path="gallery")
    def add_gallery_images(self, request, pk=None):
        event = self.get_object()
        files = request.FILES.getlist("images")
        if not files:
            return Response({"detail": "No images provided."}, status=status.HTTP_400_BAD_REQUEST)

        start_order = event.images.count()
        for i, uploaded in enumerate(files):
            EventImage.objects.create(event=event, image=uploaded, order=start_order + i)

        if not event.image and event.images.exists():
            event.image = event.images.first().image
            event.save(update_fields=["image"])

        return Response(EventItemSerializer(event, context={"request": request}).data)

    @action(detail=True, methods=["delete"], url_path=r"gallery/(?P<image_id>[^/.]+)")
    def remove_gallery_image(self, request, pk=None, image_id=None):
        event = self.get_object()
        image = get_object_or_404(EventImage, pk=image_id, event=event)
        image.delete()

        if event.images.exists():
            event.image = event.images.first().image
        else:
            event.image = None
        event.save(update_fields=["image"])

        return Response(EventItemSerializer(event, context={"request": request}).data)


class ServiceItemViewSet(viewsets.ModelViewSet):
    queryset = ServiceItem.objects.prefetch_related("images").all()
    serializer_class = ServiceItemSerializer

    def get_object(self):
        lookup = self.kwargs.get(self.lookup_url_kwarg or "pk")
        qs = self.get_queryset()
        if str(lookup).isdigit():
            return get_object_or_404(qs, pk=lookup)
        return get_object_or_404(qs, slug=lookup)

    @action(detail=True, methods=["post"], url_path="gallery")
    def add_gallery_images(self, request, pk=None):
        service = self.get_object()
        files = request.FILES.getlist("images")
        if not files:
            return Response({"detail": "No images provided."}, status=status.HTTP_400_BAD_REQUEST)

        start_order = service.images.count()
        for i, uploaded in enumerate(files):
            ServiceImage.objects.create(service=service, image=uploaded, order=start_order + i)

        if not service.image and service.images.exists():
            service.image = service.images.first().image
            service.save(update_fields=["image"])

        return Response(ServiceItemSerializer(service, context={"request": request}).data)

    @action(detail=True, methods=["delete"], url_path=r"gallery/(?P<image_id>[^/.]+)")
    def remove_gallery_image(self, request, pk=None, image_id=None):
        service = self.get_object()
        image = get_object_or_404(ServiceImage, pk=image_id, service=service)
        image.delete()

        if service.images.exists():
            service.image = service.images.first().image
        else:
            service.image = None
        service.save(update_fields=["image"])

        return Response(ServiceItemSerializer(service, context={"request": request}).data)


class FeaturedVideoViewSet(viewsets.ModelViewSet):
    queryset = FeaturedVideo.objects.all()
    serializer_class = FeaturedVideoSerializer


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer

    def get_queryset(self):
        qs = Review.objects.all()
        # Public visitors only see approved reviews; admins see everything.
        if not (self.request.user and self.request.user.is_staff):
            qs = qs.filter(approved=True)
        return qs


@api_view(["GET"])
@permission_classes([IsAdminUser])
def dashboard_stats(request):
    """Aggregate counts for the admin dashboard."""
    pages = {p.key: bool(p.banner) for p in PageContent.objects.all()}
    return Response(
        {
            "employees": Employee.objects.count(),
            "events": EventItem.objects.count(),
            "services": ServiceItem.objects.count(),
            "featured_videos": FeaturedVideo.objects.count(),
            "reviews": Review.objects.count(),
            "reviews_pending": Review.objects.filter(approved=False).count(),
            "pages": PageContent.objects.count(),
            "page_banners": pages,
        }
    )
