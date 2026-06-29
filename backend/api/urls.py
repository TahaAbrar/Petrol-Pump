from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r"pages", views.PageContentViewSet, basename="pages")
router.register(r"employees", views.EmployeeViewSet, basename="employees")
router.register(r"events", views.EventItemViewSet, basename="events")
router.register(r"reviews", views.ReviewViewSet, basename="reviews")

site_settings = views.SiteSettingsViewSet.as_view(
    {"get": "list", "put": "update_settings", "patch": "update_settings"}
)

urlpatterns = [
    path("auth/login/", views.LoginView.as_view(), name="login"),
    path("auth/logout/", views.LogoutView.as_view(), name="logout"),
    path("auth/me/", views.me, name="me"),
    path("auth/credentials/", views.UpdateCredentialsView.as_view(), name="update-credentials"),
    path("site/", site_settings, name="site-settings"),
    path("dashboard/stats/", views.dashboard_stats, name="dashboard-stats"),
    path("", include(router.urls)),
]
