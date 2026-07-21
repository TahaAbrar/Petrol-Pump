# Generated manually for Business.phone + ContactInquiry

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0014_about_pages_story_leadership"),
    ]

    operations = [
        migrations.AddField(
            model_name="business",
            name="phone",
            field=models.CharField(blank=True, default="", max_length=40),
        ),
        migrations.CreateModel(
            name="ContactInquiry",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("first_name", models.CharField(max_length=80)),
                ("last_name", models.CharField(max_length=80)),
                ("email", models.EmailField(max_length=254)),
                ("business_name", models.CharField(blank=True, max_length=200)),
                ("comment", models.TextField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "business",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="inquiries",
                        to="api.business",
                    ),
                ),
            ],
            options={
                "verbose_name_plural": "Contact inquiries",
                "ordering": ["-created_at"],
            },
        ),
    ]
