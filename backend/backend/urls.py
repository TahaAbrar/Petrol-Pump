from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("api.urls")),
]

# WhiteNoise serves collected static files. Media is served here for free PaaS
# (no nginx yet). Set SERVE_MEDIA=False when moving uploads to Cloudinary/S3.
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
if settings.DEBUG or getattr(settings, "SERVE_MEDIA", True):
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
