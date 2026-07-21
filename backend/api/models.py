import uuid
from datetime import timedelta

from django.db import models
from django.utils import timezone
from django.utils.text import slugify

UNDO_TTL = timedelta(minutes=5)


class SiteSettings(models.Model):
    """Global site info shown in navbar/footer/contact. Single row."""

    name = models.CharField(max_length=120, default="Total Fuel Station")
    tagline = models.CharField(max_length=200, default="Premium Energy. Trusted Service.")
    phone = models.CharField(max_length=40, blank=True)
    email = models.EmailField(blank=True)
    address = models.CharField(max_length=255, blank=True)
    hours = models.CharField(max_length=120, blank=True, default="Open 24 / 7")
    maps_query = models.CharField(max_length=200, blank=True)
    instagram = models.CharField(max_length=255, blank=True, default="#")
    facebook = models.CharField(max_length=255, blank=True, default="#")
    twitter = models.CharField(max_length=255, blank=True, default="#")
    linkedin = models.CharField(max_length=255, blank=True, default="#")
    # Optional custom brand mark — when empty, frontend uses the default orb + "Sukka PR".
    logo = models.ImageField(upload_to="site/", blank=True, null=True)
    text_colors = models.JSONField(default=dict, blank=True)
    footer_description = models.TextField(
        blank=True,
        default="Premium Energy. Trusted Service. Powering your journey with quality fuel and uncompromising service.",
    )
    faqs = models.JSONField(default=list, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Site settings"
        verbose_name_plural = "Site settings"

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        self.pk = 1  # enforce singleton
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class PageContent(models.Model):
    """Editable banner + copy for each public page (home, about, events, contact)."""

    KEY_CHOICES = [
        ("home", "Home"),
        ("about", "About Overview"),
        ("about_story", "Our Story"),
        ("about_leadership", "Leadership"),
        ("events", "Events"),
        ("services", "Services"),
    ]

    key = models.CharField(max_length=40, unique=True, choices=KEY_CHOICES)
    title = models.CharField(max_length=200, blank=True)
    subtitle = models.CharField(max_length=300, blank=True)
    body = models.TextField(blank=True)
    banner = models.ImageField(upload_to="banners/", blank=True, null=True)
    story_image = models.ImageField(upload_to="pages/", blank=True, null=True)
    # Leadership portraits on About (CEO 1 / CEO 2 / Manager)
    founder_image = models.ImageField(upload_to="pages/", blank=True, null=True)
    ceo2_image = models.ImageField(upload_to="pages/", blank=True, null=True)
    manager_image = models.ImageField(upload_to="pages/", blank=True, null=True)
    # Flexible per-page blocks (e.g. home stats, about story sections, location).
    extra = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["key"]

    def __str__(self):
        return self.get_key_display()


class BannerImage(models.Model):
    """Extra banner slides for a page (auto-scroll on the public site)."""

    page = models.ForeignKey(PageContent, related_name="banner_images", on_delete=models.CASCADE)
    image = models.ImageField(upload_to="banners/")
    order = models.PositiveIntegerField(default=0)
    # Soft-archived while an undo token is alive; purged when the token expires.
    archived = models.BooleanField(default=False)
    undo_token = models.UUIDField(null=True, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return f"Banner image for {self.page.key} #{self.pk}"


class UndoSnapshot(models.Model):
    """
    5-minute undo window after an admin save.
    previous_data holds the prior live state; archived BannerImages share undo_token.
    On expire → purge previous (archived) data. On undo → restore previous, drop new.
    """

    page = models.ForeignKey(PageContent, related_name="undo_snapshots", on_delete=models.CASCADE)
    scope = models.CharField(max_length=80)  # "banner" | "feature_card:{i}" | "features"
    token = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    previous_data = models.JSONField(default=dict)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["page", "scope"])]

    def __str__(self):
        return f"Undo {self.scope} ({self.token})"

    @property
    def is_expired(self):
        return timezone.now() >= self.expires_at

    @classmethod
    def create_for(cls, page, scope, previous_data):
        # Replace any existing open undo for this scope.
        for old in cls.objects.filter(page=page, scope=scope):
            old.purge_expired(force=True)
        return cls.objects.create(
            page=page,
            scope=scope,
            previous_data=previous_data,
            expires_at=timezone.now() + UNDO_TTL,
        )

    def purge_expired(self, force=False):
        """Delete this snapshot and any archived banner images tied to its token."""
        if not force and not self.is_expired:
            return False
        for img in BannerImage.objects.filter(undo_token=self.token, archived=True):
            if img.image:
                img.image.delete(save=False)
            img.delete()
        self.delete()
        return True


class Employee(models.Model):
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True, blank=True)
    role = models.CharField(max_length=120)
    image = models.ImageField(upload_to="employees/", blank=True, null=True)
    experience = models.CharField(max_length=200, blank=True)
    bio = models.TextField(blank=True)
    responsibilities = models.JSONField(default=list, blank=True)
    email = models.EmailField(blank=True)
    order = models.PositiveIntegerField(default=0)
    text_colors = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name) or "employee"
            slug = base
            i = 2
            while Employee.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base}-{i}"
                i += 1
            self.slug = slug
        super().save(*args, **kwargs)


class EventImage(models.Model):
    event = models.ForeignKey("EventItem", related_name="images", on_delete=models.CASCADE)
    image = models.ImageField(upload_to="events/gallery/")
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return f"Image for {self.event.title}"


class EventItem(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    description = models.TextField(blank=True)
    long_description = models.TextField(blank=True)
    date = models.CharField(max_length=80, blank=True)  # free text e.g. "March 14, 2026"
    image = models.ImageField(upload_to="events/", blank=True, null=True)
    video = models.FileField(upload_to="events/videos/", blank=True, null=True)
    featured = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    text_colors = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "-created_at"]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title) or "event"
            slug = base
            i = 2
            while EventItem.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base}-{i}"
                i += 1
            self.slug = slug
        super().save(*args, **kwargs)


class Review(models.Model):
    name = models.CharField(max_length=120)
    role = models.CharField(max_length=120, blank=True)
    rating = models.PositiveSmallIntegerField(default=5)
    text = models.TextField()
    approved = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    text_colors = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "-created_at"]

    def __str__(self):
        return f"{self.name} ({self.rating}\u2605)"


class ServiceImage(models.Model):
    service = models.ForeignKey("ServiceItem", related_name="images", on_delete=models.CASCADE)
    image = models.ImageField(upload_to="services/gallery/")
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return f"Image for {self.service.title}"


class ServiceItem(models.Model):
    """Station offerings — fuel grades, air, EV, convenience, etc."""

    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    category = models.CharField(max_length=120, blank=True, default="General")
    description = models.TextField(blank=True)
    long_description = models.TextField(blank=True)
    availability = models.CharField(max_length=120, blank=True, default="Available")
    quantity = models.CharField(max_length=120, blank=True)
    price = models.CharField(max_length=120, blank=True)
    highlights = models.JSONField(default=list, blank=True)
    image = models.ImageField(upload_to="services/", blank=True, null=True)
    featured = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    text_colors = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "-created_at"]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title) or "service"
            slug = base
            i = 2
            while ServiceItem.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base}-{i}"
                i += 1
            self.slug = slug
        super().save(*args, **kwargs)


class FeaturedVideo(models.Model):
    """Home-page featured video carousel (below hero banner)."""

    title = models.CharField(max_length=200, blank=True)
    video = models.FileField(upload_to="home/videos/")
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "-created_at"]
        verbose_name = "Featured video"
        verbose_name_plural = "Featured videos"

    def __str__(self):
        return self.title or f"Video #{self.pk}"


class BusinessHub(models.Model):
    """Singleton content for /businesses overview page."""

    overview_title = models.CharField(max_length=200, default="Overview")
    overview_subtitle = models.CharField(max_length=300, blank=True)
    overview_html = models.TextField(blank=True)
    overview_image = models.ImageField(upload_to="businesses/hub/", blank=True, null=True)
    banner_subtitle = models.CharField(max_length=300, blank=True, default="Our Businesses")
    banner_title = models.CharField(max_length=240, blank=True, default="Building trust across every venture.")
    banner_body = models.TextField(blank=True, default="")
    banner_fields = models.JSONField(default=dict, blank=True)
    businesses_title = models.CharField(max_length=200, default="Our Businesses")
    businesses_subtitle = models.CharField(max_length=400, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Business hub"
        verbose_name_plural = "Business hub"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return "Business hub overview"


class BusinessHubBannerImage(models.Model):
    hub = models.ForeignKey(BusinessHub, related_name="banner_images", on_delete=models.CASCADE)
    image = models.ImageField(upload_to="businesses/hub/banners/")
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return f"Hub banner #{self.pk}"


class Business(models.Model):
    """Individual business under Our Businesses."""

    slug = models.SlugField(max_length=120, unique=True)
    name = models.CharField(max_length=200)
    short_description = models.TextField(blank=True)
    card_image = models.ImageField(upload_to="businesses/cards/", blank=True, null=True)
    icon_key = models.CharField(max_length=40, blank=True, default="Building2")
    accent_color = models.CharField(max_length=20, blank=True, default="#0ea5e9")
    banner_subtitle = models.CharField(max_length=300, blank=True, default="Our Businesses")
    banner_title = models.CharField(max_length=240, blank=True, default="")
    banner_body = models.TextField(blank=True, default="")
    background_html = models.TextField(blank=True)
    investment_history_html = models.TextField(blank=True)
    overview_html = models.TextField(blank=True)
    why_us = models.JSONField(default=list, blank=True)
    address = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=40, blank=True, default="")
    maps_query = models.CharField(max_length=200, blank=True)
    section_meta = models.JSONField(default=dict, blank=True)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "id"]
        verbose_name_plural = "Businesses"

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name) or "business"
        super().save(*args, **kwargs)


class BusinessBannerImage(models.Model):
    business = models.ForeignKey(Business, related_name="banner_images", on_delete=models.CASCADE)
    image = models.ImageField(upload_to="businesses/banners/")
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return f"Banner for {self.business.name}"


class BusinessGalleryImage(models.Model):
    SECTION_CHOICES = [
        ("background", "Background"),
        ("investment", "Investment History"),
        ("overview", "Overview"),
    ]

    business = models.ForeignKey(Business, related_name="gallery_images", on_delete=models.CASCADE)
    section = models.CharField(max_length=20, choices=SECTION_CHOICES)
    image = models.ImageField(upload_to="businesses/gallery/")
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return f"{self.section} image for {self.business.name}"


class BusinessTeamMember(models.Model):
    business = models.ForeignKey(Business, related_name="team_members", on_delete=models.CASCADE)
    name = models.CharField(max_length=120)
    role = models.CharField(max_length=200, blank=True)
    image = models.ImageField(upload_to="businesses/team/", blank=True, null=True)
    name_style = models.JSONField(default=dict, blank=True)
    role_style = models.JSONField(default=dict, blank=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return f"{self.name} — {self.business.name}"


class AboutStoryImage(models.Model):
    """Ordered captioned images for Our Story page (and home teaser)."""

    page = models.ForeignKey(
        PageContent, related_name="story_gallery", on_delete=models.CASCADE
    )
    image = models.ImageField(upload_to="about/story/")
    caption = models.CharField(max_length=300)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return f"Story image #{self.pk} ({self.order})"


class AboutPerson(models.Model):
    """Leadership CEOs/managers and Board of Directors."""

    KIND_CHOICES = [
        ("leader", "CEO / Manager"),
        ("director", "Board of Directors"),
    ]

    kind = models.CharField(max_length=20, choices=KIND_CHOICES, default="leader")
    name = models.CharField(max_length=120)
    role = models.CharField(max_length=200, blank=True)
    message = models.TextField(blank=True)
    image = models.ImageField(upload_to="about/people/", blank=True, null=True)
    border_color = models.CharField(max_length=20, blank=True, default="#c8102e")
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["kind", "order", "id"]

    def __str__(self):
        return f"{self.name} ({self.kind})"


class ContactInquiry(models.Model):
    """Public contact form submissions from the navbar Contact popup."""

    first_name = models.CharField(max_length=80)
    last_name = models.CharField(max_length=80)
    email = models.EmailField()
    business = models.ForeignKey(
        Business,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="inquiries",
    )
    business_name = models.CharField(max_length=200, blank=True)
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "Contact inquiries"

    def __str__(self):
        return f"{self.first_name} {self.last_name} — {self.email}"
