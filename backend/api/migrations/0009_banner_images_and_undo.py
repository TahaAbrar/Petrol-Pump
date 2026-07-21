import uuid

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0008_site_logo"),
    ]

    operations = [
        migrations.CreateModel(
            name="BannerImage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("image", models.ImageField(upload_to="banners/")),
                ("order", models.PositiveIntegerField(default=0)),
                ("archived", models.BooleanField(default=False)),
                ("undo_token", models.UUIDField(blank=True, db_index=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "page",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="banner_images",
                        to="api.pagecontent",
                    ),
                ),
            ],
            options={
                "ordering": ["order", "id"],
            },
        ),
        migrations.CreateModel(
            name="UndoSnapshot",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("scope", models.CharField(max_length=80)),
                ("token", models.UUIDField(db_index=True, default=uuid.uuid4, unique=True)),
                ("previous_data", models.JSONField(default=dict)),
                ("expires_at", models.DateTimeField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "page",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="undo_snapshots",
                        to="api.pagecontent",
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="undosnapshot",
            index=models.Index(fields=["page", "scope"], name="api_undosna_page_id_scope_idx"),
        ),
    ]
