from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0010_businesses"),
    ]

    operations = [
        migrations.AddField(
            model_name="business",
            name="banner_body",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="business",
            name="banner_subtitle",
            field=models.CharField(blank=True, default="Our Businesses", max_length=300),
        ),
        migrations.AddField(
            model_name="business",
            name="banner_title",
            field=models.CharField(blank=True, default="", max_length=240),
        ),
        migrations.AddField(
            model_name="business",
            name="section_meta",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name="businesshub",
            name="banner_body",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="businesshub",
            name="banner_fields",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name="businesshub",
            name="banner_subtitle",
            field=models.CharField(blank=True, default="Our Businesses", max_length=300),
        ),
        migrations.AddField(
            model_name="businesshub",
            name="banner_title",
            field=models.CharField(blank=True, default="Building trust across every venture.", max_length=240),
        ),
    ]
