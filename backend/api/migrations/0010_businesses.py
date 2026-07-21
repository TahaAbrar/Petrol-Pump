import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0009_banner_images_and_undo"),
    ]

    operations = [
        migrations.CreateModel(
            name="BusinessHub",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("overview_title", models.CharField(default="Overview", max_length=200)),
                ("overview_subtitle", models.CharField(blank=True, max_length=300)),
                ("overview_html", models.TextField(blank=True)),
                ("overview_image", models.ImageField(blank=True, null=True, upload_to="businesses/hub/")),
                ("businesses_title", models.CharField(default="Our Businesses", max_length=200)),
                ("businesses_subtitle", models.CharField(blank=True, max_length=400)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Business hub",
                "verbose_name_plural": "Business hub",
            },
        ),
        migrations.CreateModel(
            name="Business",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("slug", models.SlugField(max_length=120, unique=True)),
                ("name", models.CharField(max_length=200)),
                ("short_description", models.TextField(blank=True)),
                ("card_image", models.ImageField(blank=True, null=True, upload_to="businesses/cards/")),
                ("background_html", models.TextField(blank=True)),
                ("overview_html", models.TextField(blank=True)),
                ("order", models.PositiveIntegerField(default=0)),
                ("is_active", models.BooleanField(default=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "ordering": ["order", "id"],
                "verbose_name_plural": "Businesses",
            },
        ),
        migrations.CreateModel(
            name="BusinessBannerImage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("image", models.ImageField(upload_to="businesses/banners/")),
                ("order", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "business",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="banner_images", to="api.business"),
                ),
            ],
            options={
                "ordering": ["order", "id"],
            },
        ),
        migrations.CreateModel(
            name="BusinessGalleryImage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("section", models.CharField(choices=[("background", "Background"), ("overview", "Overview")], max_length=20)),
                ("image", models.ImageField(upload_to="businesses/gallery/")),
                ("order", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "business",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="gallery_images", to="api.business"),
                ),
            ],
            options={
                "ordering": ["order", "id"],
            },
        ),
        migrations.CreateModel(
            name="BusinessHubBannerImage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("image", models.ImageField(upload_to="businesses/hub/banners/")),
                ("order", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "hub",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="banner_images", to="api.businesshub"),
                ),
            ],
            options={
                "ordering": ["order", "id"],
            },
        ),
        migrations.CreateModel(
            name="BusinessTeamMember",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=120)),
                ("role", models.CharField(blank=True, max_length=200)),
                ("image", models.ImageField(blank=True, null=True, upload_to="businesses/team/")),
                ("name_style", models.JSONField(blank=True, default=dict)),
                ("role_style", models.JSONField(blank=True, default=dict)),
                ("order", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "business",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="team_members", to="api.business"),
                ),
            ],
            options={
                "ordering": ["order", "id"],
            },
        ),
    ]
