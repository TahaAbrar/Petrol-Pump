from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0011_business_banner_and_sections"),
    ]

    operations = [
        migrations.AddField(
            model_name="business",
            name="investment_history_html",
            field=models.TextField(blank=True),
        ),
        migrations.AlterField(
            model_name="businessgalleryimage",
            name="section",
            field=models.CharField(
                choices=[
                    ("background", "Background"),
                    ("investment", "Investment History"),
                    ("overview", "Overview"),
                ],
                max_length=20,
            ),
        ),
    ]
