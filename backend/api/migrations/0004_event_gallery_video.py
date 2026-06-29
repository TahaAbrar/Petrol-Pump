from django.db import migrations, models
import django.db.models.deletion


def migrate_event_images(apps, schema_editor):
    EventItem = apps.get_model("api", "EventItem")
    EventImage = apps.get_model("api", "EventImage")
    for event in EventItem.objects.all():
        if event.image and not EventImage.objects.filter(event=event).exists():
            EventImage.objects.create(event=event, image=event.image, order=0)


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0003_text_colors_and_remove_contact"),
    ]

    operations = [
        migrations.CreateModel(
            name="EventImage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("image", models.ImageField(upload_to="events/gallery/")),
                ("order", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "event",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="images",
                        to="api.eventitem",
                    ),
                ),
            ],
            options={
                "ordering": ["order", "id"],
            },
        ),
        migrations.AddField(
            model_name="eventitem",
            name="video",
            field=models.FileField(blank=True, null=True, upload_to="events/videos/"),
        ),
        migrations.RemoveField(
            model_name="eventitem",
            name="video_url",
        ),
        migrations.RunPython(migrate_event_images, migrations.RunPython.noop),
    ]
