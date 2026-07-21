from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0012_investment_history"),
    ]

    operations = [
        migrations.AddField(
            model_name="sitesettings",
            name="footer_description",
            field=models.TextField(
                blank=True,
                default="Premium Energy. Trusted Service. Powering your journey with quality fuel and uncompromising service.",
            ),
        ),
        migrations.AddField(
            model_name="sitesettings",
            name="faqs",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="business",
            name="why_us",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="business",
            name="address",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="business",
            name="maps_query",
            field=models.CharField(blank=True, max_length=200),
        ),
    ]
