from django.db import models
from django.utils.text import slugify


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
        ("about", "About"),
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
