from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0013_footer_faqs_business_location"),
    ]

    operations = [
        migrations.AlterField(
            model_name="pagecontent",
            name="key",
            field=models.CharField(
                choices=[
                    ("home", "Home"),
                    ("about", "About Overview"),
                    ("about_story", "Our Story"),
                    ("about_leadership", "Leadership"),
                    ("events", "Events"),
                    ("services", "Services"),
                ],
                max_length=40,
                unique=True,
            ),
        ),
        migrations.AddField(
            model_name="business",
            name="icon_key",
            field=models.CharField(blank=True, default="Building2", max_length=40),
        ),
        migrations.AddField(
            model_name="business",
            name="accent_color",
            field=models.CharField(blank=True, default="#0ea5e9", max_length=20),
        ),
        migrations.CreateModel(
            name="AboutStoryImage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("image", models.ImageField(upload_to="about/story/")),
                ("caption", models.CharField(max_length=300)),
                ("order", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "page",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="story_gallery",
                        to="api.pagecontent",
                    ),
                ),
            ],
            options={"ordering": ["order", "id"]},
        ),
        migrations.CreateModel(
            name="AboutPerson",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "kind",
                    models.CharField(
                        choices=[("leader", "CEO / Manager"), ("director", "Board of Directors")],
                        default="leader",
                        max_length=20,
                    ),
                ),
                ("name", models.CharField(max_length=120)),
                ("role", models.CharField(blank=True, max_length=200)),
                ("message", models.TextField(blank=True)),
                ("image", models.ImageField(blank=True, null=True, upload_to="about/people/")),
                ("border_color", models.CharField(blank=True, default="#c8102e", max_length=20)),
                ("order", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"ordering": ["kind", "order", "id"]},
        ),
    ]
