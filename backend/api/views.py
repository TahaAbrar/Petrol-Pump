from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status, mixins
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import SiteSettings, PageContent, BannerImage, UndoSnapshot, Employee, EventItem, EventImage, Review, ServiceItem, ServiceImage, FeaturedVideo, BusinessHub, BusinessHubBannerImage, Business, BusinessBannerImage, BusinessGalleryImage, BusinessTeamMember, AboutStoryImage, AboutPerson
from .serializers import (
    SiteSettingsSerializer,
    PageContentSerializer,
    BannerImageSerializer,
    EmployeeSerializer,
    EventItemSerializer,
    ServiceItemSerializer,
    FeaturedVideoSerializer,
    ReviewSerializer,
    LoginSerializer,
    UserSerializer,
    ChangeCredentialsSerializer,
    BusinessHubSerializer,
    BusinessListSerializer,
    BusinessDetailSerializer,
    BusinessTeamMemberSerializer,
    AboutStoryImageSerializer,
    AboutPersonSerializer,
    ContactInquirySerializer,
)
from . import undo as undo_helpers


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


def _truthy(val) -> bool:
    if isinstance(val, bool):
        return val
    return str(val or "").lower() in ("1", "true", "yes")


class PageContentViewSet(viewsets.ModelViewSet):
    queryset = PageContent.objects.prefetch_related("banner_images", "undo_snapshots", "story_gallery").all()
    serializer_class = PageContentSerializer
    lookup_field = "key"

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        # Ensure About sub-pages exist
        PageContent.objects.get_or_create(key="about", defaults={"title": "About Us"})
        PageContent.objects.get_or_create(key="about_story", defaults={"title": "Our Story"})
        PageContent.objects.get_or_create(key="about_leadership", defaults={"title": "Leadership"})

    def retrieve(self, request, *args, **kwargs):
        page = self.get_object()
        undo_helpers.cleanup_expired_undos(page)
        return Response(PageContentSerializer(page, context={"request": request}).data)

    def list(self, request, *args, **kwargs):
        undo_helpers.cleanup_expired_undos()
        return super().list(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        page = self.get_object()
        undo_helpers.cleanup_expired_undos(page)

        undo_scope = str(request.data.get("undo_scope") or "").strip()
        create_undo = _truthy(request.data.get("create_undo"))

        snap = None
        if create_undo and undo_scope:
            if undo_scope == "banner":
                prev = undo_helpers.snapshot_banner_state(page)
            elif undo_scope == "features":
                prev = undo_helpers.snapshot_features_state(page)
            elif undo_scope.startswith("feature_card:"):
                try:
                    idx = int(undo_scope.split(":", 1)[1])
                except ValueError:
                    idx = -1
                prev = undo_helpers.snapshot_feature_card(page, idx)
            else:
                prev = None
            if prev is not None:
                snap = UndoSnapshot.create_for(page, undo_scope, prev)
                if undo_scope == "banner" and _truthy(request.data.get("archive_banner_images")):
                    undo_helpers.archive_live_banner_images(page, snap.token)

        # Strip undo control keys before serializer save.
        mutable = request.data.copy() if hasattr(request.data, "copy") else dict(request.data)
        for k in ("undo_scope", "create_undo", "archive_banner_images"):
            mutable.pop(k, None)

        serializer = self.get_serializer(page, data=mutable, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Keep legacy `banner` in sync with first live slide when present.
        page.refresh_from_db()
        first = page.banner_images.filter(archived=False).order_by("order", "id").first()
        if first and first.image and not request.FILES.get("banner"):
            if not page.banner or page.banner.name != first.image.name:
                page.banner = first.image
                page.save(update_fields=["banner", "updated_at"])

        data = PageContentSerializer(page, context={"request": request}).data
        if snap:
            data["undo"] = {
                "scope": snap.scope,
                "token": str(snap.token),
                "expires_at": snap.expires_at.isoformat(),
            }
        return Response(data)

    @action(detail=True, methods=["post"], url_path="banner-images")
    def add_banner_images(self, request, key=None):
        page = self.get_object()
        undo_helpers.cleanup_expired_undos(page)
        files = request.FILES.getlist("images") or request.FILES.getlist("image")
        if not files and request.FILES.get("images"):
            files = [request.FILES["images"]]
        if not files:
            return Response({"detail": "No images provided."}, status=status.HTTP_400_BAD_REQUEST)

        create_undo = _truthy(request.data.get("create_undo"))
        replace = _truthy(request.data.get("replace"))
        snap = None
        if create_undo:
            prev = undo_helpers.snapshot_banner_state(page)
            snap = UndoSnapshot.create_for(page, "banner", prev)
            if replace:
                undo_helpers.archive_live_banner_images(page, snap.token)

        start_order = page.banner_images.filter(archived=False).count()
        for i, uploaded in enumerate(files):
            BannerImage.objects.create(page=page, image=uploaded, order=start_order + i)

        first = page.banner_images.filter(archived=False).order_by("order", "id").first()
        if first and first.image:
            page.banner = first.image
            page.save(update_fields=["banner", "updated_at"])

        data = PageContentSerializer(page, context={"request": request}).data
        if snap:
            data["undo"] = {
                "scope": snap.scope,
                "token": str(snap.token),
                "expires_at": snap.expires_at.isoformat(),
            }
        return Response(data)

    @action(detail=True, methods=["delete"], url_path=r"banner-images/(?P<image_id>[^/.]+)")
    def remove_banner_image(self, request, key=None, image_id=None):
        page = self.get_object()
        image = get_object_or_404(BannerImage, pk=image_id, page=page, archived=False)
        if image.image:
            image.image.delete(save=False)
        image.delete()

        first = page.banner_images.filter(archived=False).order_by("order", "id").first()
        if first and first.image:
            page.banner = first.image
        else:
            # Keep legacy single banner if no slides left.
            pass
        page.save(update_fields=["banner", "updated_at"])
        return Response(PageContentSerializer(page, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="undo")
    def undo(self, request, key=None):
        page = self.get_object()
        token = (request.data.get("token") or "").strip()
        if not token:
            return Response({"detail": "token required"}, status=status.HTTP_400_BAD_REQUEST)
        snap = undo_helpers.restore_undo(page, token)
        if snap is None:
            return Response(
                {"detail": "Undo token invalid or expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        page.refresh_from_db()
        return Response(PageContentSerializer(page, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="story-images")
    def add_story_images(self, request, key=None):
        page = self.get_object()
        files = request.FILES.getlist("images") or request.FILES.getlist("image")
        if not files:
            return Response({"detail": "No images provided."}, status=status.HTTP_400_BAD_REQUEST)
        captions = request.data.getlist("captions") if hasattr(request.data, "getlist") else []
        orders = request.data.getlist("orders") if hasattr(request.data, "getlist") else []
        start = page.story_gallery.count()
        for i, uploaded in enumerate(files):
            caption = (captions[i] if i < len(captions) else request.data.get("caption") or "").strip()
            if not caption:
                caption = f"Image {start + i + 1}"
            try:
                order = int(orders[i]) if i < len(orders) else start + i
            except (TypeError, ValueError):
                order = start + i
            AboutStoryImage.objects.create(page=page, image=uploaded, caption=caption, order=order)
        page.save(update_fields=["updated_at"])
        return Response(PageContentSerializer(page, context={"request": request}).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["patch", "delete"], url_path=r"story-images/(?P<image_id>[^/.]+)")
    def story_image_detail(self, request, key=None, image_id=None):
        page = self.get_object()
        img = get_object_or_404(AboutStoryImage, pk=image_id, page=page)
        if request.method == "DELETE":
            if img.image:
                img.image.delete(save=False)
            img.delete()
            page.save(update_fields=["updated_at"])
            return Response(PageContentSerializer(page, context={"request": request}).data)
        if "caption" in request.data:
            img.caption = str(request.data.get("caption") or "").strip()
        if "order" in request.data:
            try:
                img.order = int(request.data.get("order"))
            except (TypeError, ValueError):
                pass
        if request.FILES.get("image"):
            img.image = request.FILES["image"]
        img.save()
        page.save(update_fields=["updated_at"])
        return Response(PageContentSerializer(page, context={"request": request}).data)


class AboutPersonViewSet(viewsets.ModelViewSet):
    queryset = AboutPerson.objects.all()
    serializer_class = AboutPersonSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        kind = self.request.query_params.get("kind")
        if kind in ("leader", "director"):
            qs = qs.filter(kind=kind)
        return qs


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


class BusinessHubViewSet(viewsets.GenericViewSet, mixins.UpdateModelMixin):
    """Singleton hub for /businesses overview."""

    serializer_class = BusinessHubSerializer
    queryset = BusinessHub.objects.all()

    def get_object(self):
        return BusinessHub.load()

    def list(self, request):
        return Response(BusinessHubSerializer(self.get_object(), context={"request": request}).data)

    @action(detail=False, methods=["patch"], url_path="save")
    def save_hub(self, request):
        hub = self.get_object()
        serializer = BusinessHubSerializer(hub, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(BusinessHubSerializer(hub, context={"request": request}).data)

    @action(detail=False, methods=["post"], url_path="banner-images")
    def add_banner_images(self, request):
        hub = self.get_object()
        files = request.FILES.getlist("images") or request.FILES.getlist("image")
        if not files:
            return Response({"detail": "No images provided."}, status=status.HTTP_400_BAD_REQUEST)
        start = hub.banner_images.count()
        for i, uploaded in enumerate(files):
            BusinessHubBannerImage.objects.create(hub=hub, image=uploaded, order=start + i)
        return Response(BusinessHubSerializer(hub, context={"request": request}).data)

    @action(detail=False, methods=["delete"], url_path=r"banner-images/(?P<image_id>[^/.]+)")
    def remove_banner_image(self, request, image_id=None):
        hub = self.get_object()
        image = get_object_or_404(BusinessHubBannerImage, pk=image_id, hub=hub)
        if image.image:
            image.image.delete(save=False)
        image.delete()
        return Response(BusinessHubSerializer(hub, context={"request": request}).data)


class BusinessViewSet(viewsets.ModelViewSet):
    queryset = Business.objects.prefetch_related(
        "banner_images", "gallery_images", "team_members"
    ).all()
    lookup_field = "slug"

    def get_serializer_class(self):
        if self.action == "list":
            return BusinessListSerializer
        return BusinessDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if not (self.request.user and self.request.user.is_staff):
            qs = qs.filter(is_active=True)
        return qs

    def _fresh_business(self, business):
        """Re-fetch so nested relations aren't stale after create/update/delete."""
        return (
            Business.objects.prefetch_related("banner_images", "gallery_images", "team_members")
            .get(pk=business.pk)
        )

    def _detail_response(self, business, status_code=status.HTTP_200_OK):
        fresh = self._fresh_business(business)
        return Response(
            BusinessDetailSerializer(fresh, context={"request": self.request}).data,
            status=status_code,
        )

    @action(detail=True, methods=["post"], url_path="banner-images")
    def add_banner_images(self, request, slug=None):
        business = self.get_object()
        files = request.FILES.getlist("images") or request.FILES.getlist("image")
        if not files:
            return Response({"detail": "No images provided."}, status=status.HTTP_400_BAD_REQUEST)
        start = business.banner_images.count()
        for i, uploaded in enumerate(files):
            BusinessBannerImage.objects.create(business=business, image=uploaded, order=start + i)
        return self._detail_response(business)

    @action(detail=True, methods=["delete"], url_path=r"banner-images/(?P<image_id>[^/.]+)")
    def remove_banner_image(self, request, slug=None, image_id=None):
        business = self.get_object()
        image = get_object_or_404(BusinessBannerImage, pk=image_id, business=business)
        if image.image:
            image.image.delete(save=False)
        image.delete()
        return self._detail_response(business)

    @action(detail=True, methods=["post"], url_path=r"gallery/(?P<section>background|investment|overview)")
    def add_gallery_images(self, request, slug=None, section=None):
        business = self.get_object()
        files = request.FILES.getlist("images") or request.FILES.getlist("image")
        if not files:
            return Response({"detail": "No images provided."}, status=status.HTTP_400_BAD_REQUEST)
        start = business.gallery_images.filter(section=section).count()
        for i, uploaded in enumerate(files):
            BusinessGalleryImage.objects.create(
                business=business, section=section, image=uploaded, order=start + i
            )
        business.save(update_fields=["updated_at"])
        return self._detail_response(business)

    @action(detail=True, methods=["delete"], url_path=r"gallery/(?P<section>background|investment|overview)/(?P<image_id>[^/.]+)")
    def remove_gallery_image(self, request, slug=None, section=None, image_id=None):
        business = self.get_object()
        image = get_object_or_404(
            BusinessGalleryImage, pk=image_id, business=business, section=section
        )
        if image.image:
            image.image.delete(save=False)
        image.delete()
        business.save(update_fields=["updated_at"])
        return self._detail_response(business)

    @action(detail=True, methods=["post"], url_path="team")
    def add_team_member(self, request, slug=None):
        business = self.get_object()
        data = request.data.copy() if hasattr(request.data, "copy") else dict(request.data)
        data.pop("image", None)
        name = (data.get("name") or "").strip()
        role = (data.get("role") or "").strip()
        if not name or not role:
            return Response(
                {"detail": "Name and role are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not request.FILES.get("image"):
            return Response(
                {"detail": "Image is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        name_style = data.get("name_style")
        role_style = data.get("role_style")
        if isinstance(name_style, str):
            import json
            try:
                data["name_style"] = json.loads(name_style)
            except json.JSONDecodeError:
                data["name_style"] = {}
        if isinstance(role_style, str):
            import json
            try:
                data["role_style"] = json.loads(role_style)
            except json.JSONDecodeError:
                data["role_style"] = {}
        order = business.team_members.count()
        BusinessTeamMember.objects.create(
            business=business,
            name=name,
            role=role,
            name_style=data.get("name_style") or {},
            role_style=data.get("role_style") or {},
            order=order,
            image=request.FILES["image"],
        )
        business.save(update_fields=["updated_at"])
        return self._detail_response(business, status.HTTP_201_CREATED)

    @action(detail=True, methods=["patch", "delete"], url_path=r"team/(?P<member_id>[^/.]+)")
    def team_member_detail(self, request, slug=None, member_id=None):
        business = self.get_object()
        member = get_object_or_404(BusinessTeamMember, pk=member_id, business=business)

        if request.method == "DELETE":
            if member.image:
                member.image.delete(save=False)
            member.delete()
            business.save(update_fields=["updated_at"])
            return self._detail_response(business)

        data = request.data.copy() if hasattr(request.data, "copy") else dict(request.data)
        name = data.get("name", member.name)
        role = data.get("role", member.role)
        if isinstance(name, str):
            name = name.strip()
        if isinstance(role, str):
            role = role.strip()
        if not name or not role:
            return Response(
                {"detail": "Name and role are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not member.image and not request.FILES.get("image"):
            return Response(
                {"detail": "Image is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        member.name = name
        member.role = role
        for field in ("order",):
            if field in data:
                setattr(member, field, data[field])
        for field in ("name_style", "role_style"):
            if field in data:
                val = data[field]
                if isinstance(val, str):
                    import json
                    try:
                        val = json.loads(val)
                    except json.JSONDecodeError:
                        val = {}
                setattr(member, field, val or {})
        if request.FILES.get("image"):
            member.image = request.FILES["image"]
        member.save()
        business.save(update_fields=["updated_at"])
        return self._detail_response(business)


@api_view(["POST"])
@permission_classes([AllowAny])
def contact_submit(request):
    """Public contact form from the navbar Contact popup."""
    serializer = ContactInquirySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response({"ok": True}, status=status.HTTP_201_CREATED)


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
