"""Seed the database with the initial Total Fuel Station content.

Run:  python manage.py seed
Mirrors the data that used to live in the frontend's src/lib/site-data.ts so the
site looks identical once it reads from the API.
"""
import os
from pathlib import Path

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.files import File
from django.core.management.base import BaseCommand

from api.models import (
    SiteSettings,
    PageContent,
    Employee,
    EventItem,
    EventImage,
    Review,
    ServiceItem,
    ServiceImage,
)

ASSETS = settings.BASE_DIR.parent / "src" / "assets"

ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@totalstation.com")


def attach_image(instance, field, filename):
    """Copy an asset from src/assets into the model's ImageField (once)."""
    if getattr(instance, field):
        return
    path = ASSETS / filename
    if not path.exists():
        return
    with path.open("rb") as fh:
        getattr(instance, field).save(filename, File(fh), save=True)


class Command(BaseCommand):
    help = "Seed initial site content and create a default admin user."

    def handle(self, *args, **options):
        self.create_admin()
        self.seed_settings()
        self.seed_pages()
        self.seed_employees()
        self.seed_events()
        self.seed_services()
        self.seed_reviews()
        self.stdout.write(self.style.SUCCESS("\nSeed complete."))
        self.stdout.write(
            f"Admin login -> username: {ADMIN_USERNAME}  password: {ADMIN_PASSWORD}"
        )

    def create_admin(self):
        User = get_user_model()
        user, created = User.objects.get_or_create(
            username=ADMIN_USERNAME,
            defaults={"email": ADMIN_EMAIL, "is_staff": True, "is_superuser": True},
        )
        if created:
            user.set_password(ADMIN_PASSWORD)
            user.is_staff = True
            user.is_superuser = True
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Created admin user '{ADMIN_USERNAME}'"))
        else:
            self.stdout.write(f"Admin user '{ADMIN_USERNAME}' already exists")

    def seed_settings(self):
        s = SiteSettings.load()
        s.name = "Total Fuel Station"
        s.tagline = "Premium Energy. Trusted Service."
        s.phone = "+91 98765 43210"
        s.email = "info@totalstation.com"
        s.address = "123 National Highway, Sector 12, Mumbai, India 400001"
        s.hours = "Open 24 / 7"
        s.maps_query = "Total+Fuel+Station+Mumbai"
        s.save()
        self.stdout.write("Seeded site settings")

    def seed_pages(self):
        pages = [
            {
                "key": "home",
                "title": "Fuel your journey with uncompromising quality.",
                "subtitle": "Premium Energy. Trusted Service.",
                "body": "A modern, premium fuel station built around your time, your vehicle and your peace of mind.",
                "banner": "hero-station.jpg",
                "extra": {
                    "stats": [
                        {"v": "24/7", "l": "Always open"},
                        {"v": "99.9%", "l": "Uptime"},
                        {"v": "50k+", "l": "Happy customers"},
                    ],
                    "whyUs": [
                        "Trusted by 50,000+ regular customers",
                        "ISO-certified fuel quality control",
                        "Experienced & friendly service team",
                        "Modern, well-lit, secure infrastructure",
                        "Round-the-clock customer support",
                    ],
                },
            },
            {
                "key": "about",
                "title": "A family business built on trust.",
                "subtitle": "About Us",
                "body": "",
                "banner": "about-banner.jpg",
                "story_image": "about-fueling.jpg",
                "founder_image": "owner.jpg",
                "ceo2_image": "emp-2.jpg",
                "manager_image": "emp-1.jpg",
                "extra": {
                    "ourStory": {
                        "eyebrow": "Our story",
                        "title": "Three decades. One promise.",
                        "body": (
                            "Founded in 1994 as a single-pump roadside station, we grew by stubbornly "
                            "insisting on two things — pure fuel and warm service. Today we run one of "
                            "the most-recognised premium forecourts in the region, serving thousands "
                            "of vehicles every week."
                        ),
                        "mission": "Make every refuel feel premium, fast and worry-free.",
                        "vision": "Set the new global standard for the modern fuel station.",
                        "services": "Petrol, Diesel, Premium fuels, EV charging, Air & lounge.",
                    },
                    "leadership": {
                        "eyebrow": "Leadership",
                        "title": "The people steering our station.",
                        "people": [
                            {
                                "name": "Mr. Anil Verma",
                                "role": "CEO",
                                "quote": (
                                    "We're not just selling fuel — we're selling time, trust and the confidence "
                                    "that your vehicle is in safe hands."
                                ),
                            },
                            {
                                "name": "Ms. Priya Sharma",
                                "role": "CEO",
                                "quote": (
                                    "Growth means nothing without integrity. We build every partnership "
                                    "and every litre of fuel on that foundation."
                                ),
                            },
                            {
                                "name": "Mr. Rohit Khan",
                                "role": "Manager",
                                "quote": (
                                    "My job is to make every shift seamless — safe pumps, clean forecourt, "
                                    "and a team that greets every customer like family."
                                ),
                            },
                        ],
                        "stats": [
                            {"v": "30+", "l": "Years experience"},
                            {"v": "5", "l": "Awards won"},
                            {"v": "120", "l": "Team members"},
                        ],
                    },
                },
            },
            {
                "key": "events",
                "title": "Moments from our station & community.",
                "subtitle": "Events",
                "body": "From grand openings to community drives — here's what's happening at Total Fuel Station.",
                "banner": "events-banner.jpg",
                "extra": {},
            },
            {
                "key": "services",
                "title": "Everything your vehicle needs, under one canopy.",
                "subtitle": "Services",
                "body": "From premium fuels to EV charging, air, and convenience — see what is available at our station, with live stock and clear details.",
                "banner": "hero-station.jpg",
                "extra": {},
            },
        ]
        for data in pages:
            banner = data.pop("banner")
            story_image = data.pop("story_image", None)
            founder_image = data.pop("founder_image", None)
            ceo2_image = data.pop("ceo2_image", None)
            manager_image = data.pop("manager_image", None)
            obj, _ = PageContent.objects.update_or_create(key=data["key"], defaults=data)
            attach_image(obj, "banner", banner)
            if story_image:
                attach_image(obj, "story_image", story_image)
            if founder_image:
                attach_image(obj, "founder_image", founder_image)
            if ceo2_image:
                attach_image(obj, "ceo2_image", ceo2_image)
            if manager_image:
                attach_image(obj, "manager_image", manager_image)
        self.stdout.write("Seeded pages")

    def seed_employees(self):
        data = [
            {
                "name": "Rohit Sharma", "role": "Station Manager", "img": "emp-1.jpg",
                "experience": "12 years in fuel retail operations",
                "bio": "Rohit leads day-to-day operations with a relentless focus on safety, cleanliness and customer experience. He has built our station into one of the highest-rated in the region.",
                "responsibilities": ["Overall station operations & SOPs", "Team leadership and training", "Vendor and supply coordination", "Compliance, safety and audits"],
                "email": "rohit@totalstation.com",
            },
            {
                "name": "Priya Nair", "role": "Customer Experience Lead", "img": "emp-2.jpg",
                "experience": "7 years in hospitality & service",
                "bio": "Priya makes every guest feel at home. She runs our loyalty program and ensures every interaction reflects the premium standards of our brand.",
                "responsibilities": ["Customer service & feedback", "Loyalty program management", "Front-desk and forecourt courtesy", "Complaint resolution"],
                "email": "priya@totalstation.com",
            },
            {
                "name": "Arjun Mehta", "role": "Senior Fuel Technician", "img": "emp-3.jpg",
                "experience": "15 years in petroleum equipment",
                "bio": "Arjun keeps every pump, nozzle and tank in perfect health. His preventive maintenance program has kept our uptime above 99.9% for three years straight.",
                "responsibilities": ["Pump calibration & maintenance", "Fuel quality testing", "Tank inspection & safety checks", "Equipment upgrades"],
                "email": "arjun@totalstation.com",
            },
            {
                "name": "Kabir Singh", "role": "Forecourt Attendant", "img": "emp-4.jpg",
                "experience": "3 years on the forecourt",
                "bio": "Kabir is the smiling face you meet first. Fast, accurate and always courteous — he embodies the speed and warmth our customers love.",
                "responsibilities": ["Fast, accurate fueling", "Windshield & tyre courtesy checks", "Cash and digital payment handling", "Forecourt cleanliness"],
                "email": "kabir@totalstation.com",
            },
        ]
        for i, d in enumerate(data):
            img = d.pop("img")
            obj, _ = Employee.objects.update_or_create(
                email=d["email"], defaults={**d, "order": i}
            )
            attach_image(obj, "image", img)
        self.stdout.write("Seeded employees")

    def seed_events(self):
        data = [
            {
                "slug": "grand-opening-2026",
                "title": "Grand Opening of New Forecourt", "img": "event-1.jpg",
                "description": "Unveiling our new ultra-modern forecourt with premium fuel dispensers and EV charging.",
                "long_description": "We celebrated the launch of our newly upgraded forecourt featuring six new high-flow dispensers, two ultra-fast EV charging bays, and a redesigned customer lounge. Hundreds of customers joined us for live music, refreshments and exclusive fuel discounts.",
                "date": "March 14, 2026",
            },
            {
                "slug": "diwali-celebration-2025",
                "title": "Diwali Night with our Community", "img": "event-2.jpg",
                "description": "Lighting up the station with diyas, sweets and a warm thank you to our loyal customers.",
                "long_description": "Our annual Diwali celebration brought together hundreds of families. We lit up the entire station with diyas, distributed sweets, and ran a special Diwali fuel cashback for every customer that evening.",
                "date": "November 1, 2025",
            },
            {
                "slug": "green-drive-2025",
                "title": "Green Drive — 500 Trees Planted", "img": "event-3.jpg",
                "description": "A community-wide tree plantation drive to offset our annual carbon footprint.",
                "long_description": "Our Green Drive initiative saw employees, customers and local NGOs come together to plant 500 native saplings around the station and along the highway. We commit to caring for every tree for the next 5 years.",
                "date": "June 5, 2025",
            },
        ]
        for i, d in enumerate(data):
            img = d.pop("img")
            slug = d.pop("slug")
            obj, _ = EventItem.objects.update_or_create(
                slug=slug, defaults={**d, "order": i}
            )
            attach_image(obj, "image", img)
            if obj.image and not obj.images.exists():
                EventImage.objects.create(event=obj, image=obj.image, order=0)
        self.stdout.write("Seeded events")

    def seed_services(self):
        data = [
            {
                "slug": "premium-petrol",
                "title": "Premium Petrol",
                "category": "Fuel",
                "img": "hero-station.jpg",
                "gallery": ["hero-station.jpg", "about-fueling.jpg"],
                "description": "High-octane petrol for smoother drives and cleaner engines.",
                "long_description": (
                    "Our Premium Petrol is formulated for modern engines that demand higher octane. "
                    "Every delivery is quality-checked on arrival so you get consistent performance, "
                    "better mileage, and fewer deposits over time. Available 24/7 at dedicated high-flow pumps."
                ),
                "availability": "Available 24/7",
                "quantity": "On-site tank capacity · continuous refill",
                "price": "Ask at pump / display board",
                "highlights": [
                    "Higher octane for turbo & premium cars",
                    "Quality tested on every tanker delivery",
                    "Dedicated high-flow dispensers",
                    "Digital & cash payments accepted",
                ],
            },
            {
                "slug": "diesel",
                "title": "Diesel",
                "category": "Fuel",
                "img": "about-fueling.jpg",
                "gallery": ["about-fueling.jpg", "event-1.jpg"],
                "description": "Reliable diesel for cars, SUVs, and commercial fleets.",
                "long_description": (
                    "Clean, calibrated diesel for daily drivers and fleet operators. Our pumps are "
                    "regularly audited so dispensed volume matches what you pay for — trusted by "
                    "local taxis, logistics vans, and highway traffic alike."
                ),
                "availability": "Available 24/7",
                "quantity": "High-volume underground storage",
                "price": "Ask at pump / display board",
                "highlights": [
                    "Fleet-friendly high-flow nozzles",
                    "Calibrated meters & transparent billing",
                    "Suitable for cars, SUVs & light commercial",
                    "Night-time service with full lighting",
                ],
            },
            {
                "slug": "ev-fast-charging",
                "title": "EV Fast Charging",
                "category": "EV & Charging",
                "img": "event-1.jpg",
                "gallery": ["event-1.jpg", "hero-station.jpg"],
                "description": "Ultra-fast DC charging bays while you grab a coffee.",
                "long_description": (
                    "Two dedicated EV charging bays with CCS connectors. Ideal for highway top-ups "
                    "or a quick charge while you visit the lounge. Bay status is monitored by staff "
                    "so you are never left waiting without help."
                ),
                "availability": "Available · 2 bays",
                "quantity": "2 charging bays",
                "price": "Per kWh · see bay screen",
                "highlights": [
                    "CCS DC fast charging",
                    "Covered bay with lighting",
                    "Pay via UPI / card at bay",
                    "Staff assistance on request",
                ],
            },
            {
                "slug": "air-tyre-care",
                "title": "Air & Tyre Care",
                "category": "Forecourt Care",
                "img": "event-3.jpg",
                "gallery": ["event-3.jpg", "about-fueling.jpg"],
                "description": "Free air check and pressure top-up for every visitor.",
                "long_description": (
                    "Maintain correct tyre pressure for safety and mileage. Our digital air points "
                    "are free for customers — attendants can help set the PSI for your vehicle type."
                ),
                "availability": "Available",
                "quantity": "2 air points",
                "price": "Complimentary",
                "highlights": [
                    "Digital PSI display",
                    "Free for station customers",
                    "Attendant help available",
                    "Open with station hours (24/7)",
                ],
            },
        ]
        for i, d in enumerate(data):
            img = d.pop("img")
            gallery = d.pop("gallery", [])
            slug = d.pop("slug")
            obj, _ = ServiceItem.objects.update_or_create(
                slug=slug, defaults={**d, "order": i}
            )
            attach_image(obj, "image", img)
            if not obj.images.exists():
                for gi, gname in enumerate(gallery):
                    path = ASSETS / gname
                    if not path.exists():
                        continue
                    si = ServiceImage(service=obj, order=gi)
                    with path.open("rb") as fh:
                        si.image.save(gname, File(fh), save=True)
                if obj.image and not obj.images.exists():
                    ServiceImage.objects.create(service=obj, image=obj.image, order=0)
        self.stdout.write("Seeded services")

    def seed_reviews(self):
        data = [
            {"name": "Aanya Kapoor", "rating": 5, "text": "Cleanest station I've ever visited. The staff is incredibly friendly and the fuel quality is top-notch.", "role": "Daily Commuter"},
            {"name": "Vikram Bose", "rating": 5, "text": "Fast service, no queues even on weekends. Card payments and UPI work flawlessly. Highly recommended.", "role": "Fleet Owner"},
            {"name": "Sneha Iyer", "rating": 5, "text": "Love the premium feel — feels like an Apple Store for fuel. Air checks and washroom are always spotless.", "role": "Long-distance Traveller"},
            {"name": "Rahul Khanna", "rating": 5, "text": "Trusted this station for 6 years. Mileage of my car genuinely improved after switching here.", "role": "Regular Customer"},
        ]
        for i, d in enumerate(data):
            Review.objects.update_or_create(
                name=d["name"], text=d["text"], defaults={**d, "order": i, "approved": True}
            )
        self.stdout.write("Seeded reviews")
