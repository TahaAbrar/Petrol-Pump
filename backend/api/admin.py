from django.contrib import admin

from .models import SiteSettings, PageContent, BannerImage, UndoSnapshot, Employee, EventItem, Review, ServiceItem, FeaturedVideo


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    list_display = ["name", "phone", "email", "updated_at"]


@admin.register(PageContent)
class PageContentAdmin(admin.ModelAdmin):
    list_display = ["key", "title", "updated_at"]


@admin.register(BannerImage)
class BannerImageAdmin(admin.ModelAdmin):
    list_display = ["page", "order", "archived", "created_at"]
    list_filter = ["archived", "page"]


@admin.register(UndoSnapshot)
class UndoSnapshotAdmin(admin.ModelAdmin):
    list_display = ["page", "scope", "token", "expires_at", "created_at"]
    list_filter = ["scope"]


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ["name", "role", "order"]
    list_editable = ["order"]
    prepopulated_fields = {"slug": ("name",)}


@admin.register(EventItem)
class EventItemAdmin(admin.ModelAdmin):
    list_display = ["title", "date", "featured", "order"]
    list_editable = ["featured", "order"]
    prepopulated_fields = {"slug": ("title",)}


@admin.register(ServiceItem)
class ServiceItemAdmin(admin.ModelAdmin):
    list_display = ["title", "category", "availability", "featured", "order"]
    list_editable = ["featured", "order"]
    prepopulated_fields = {"slug": ("title",)}


@admin.register(FeaturedVideo)
class FeaturedVideoAdmin(admin.ModelAdmin):
    list_display = ["title", "order", "created_at"]
    list_editable = ["order"]


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ["name", "rating", "approved", "order"]
    list_editable = ["approved", "order"]
