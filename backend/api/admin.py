from django.contrib import admin

from .models import SiteSettings, PageContent, Employee, EventItem, Review


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    list_display = ["name", "phone", "email", "updated_at"]


@admin.register(PageContent)
class PageContentAdmin(admin.ModelAdmin):
    list_display = ["key", "title", "updated_at"]


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ["name", "role", "order"]
    list_editable = ["order"]
    prepopulated_fields = {"slug": ("name",)}


@admin.register(EventItem)
class EventItemAdmin(admin.ModelAdmin):
    list_display = ["title", "date", "order"]
    list_editable = ["order"]
    prepopulated_fields = {"slug": ("title",)}


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ["name", "rating", "approved", "order"]
    list_editable = ["approved", "order"]
