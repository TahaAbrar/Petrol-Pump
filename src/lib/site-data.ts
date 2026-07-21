import emp1 from "@/assets/emp-1.jpg";
import emp2 from "@/assets/emp-2.jpg";
import emp3 from "@/assets/emp-3.jpg";
import emp4 from "@/assets/emp-4.jpg";
import event1 from "@/assets/event-1.jpg";
import event2 from "@/assets/event-2.jpg";
import event3 from "@/assets/event-3.jpg";

export const SITE = {
  name: "Total Fuel Station",
  tagline: "Premium Energy. Trusted Service.",
  phone: "+91 98765 43210",
  email: "info@totalstation.com",
  address: "123 National Highway, Sector 12, Mumbai, India 400001",
  hours: "Open 24 / 7",
  mapsQuery: "Total+Fuel+Station+Mumbai",
  footerDescription:
    "Premium Energy. Trusted Service. Powering your journey with quality fuel and uncompromising service.",
  faqs: [] as { question: string; answer: string }[],
  socials: {
    instagram: "#",
    facebook: "#",
    twitter: "#",
    linkedin: "#",
  },
};

export type Employee = {
  id: string;
  name: string;
  role: string;
  image: string;
  experience: string;
  bio: string;
  responsibilities: string[];
  email: string;
};

export const employees: Employee[] = [
  {
    id: "rohit-sharma",
    name: "Rohit Sharma",
    role: "Station Manager",
    image: emp1,
    experience: "12 years in fuel retail operations",
    bio: "Rohit leads day-to-day operations with a relentless focus on safety, cleanliness and customer experience. He has built our station into one of the highest-rated in the region.",
    responsibilities: [
      "Overall station operations & SOPs",
      "Team leadership and training",
      "Vendor and supply coordination",
      "Compliance, safety and audits",
    ],
    email: "rohit@totalstation.com",
  },
  {
    id: "priya-nair",
    name: "Priya Nair",
    role: "Customer Experience Lead",
    image: emp2,
    experience: "7 years in hospitality & service",
    bio: "Priya makes every guest feel at home. She runs our loyalty program and ensures every interaction reflects the premium standards of our brand.",
    responsibilities: [
      "Customer service & feedback",
      "Loyalty program management",
      "Front-desk and forecourt courtesy",
      "Complaint resolution",
    ],
    email: "priya@totalstation.com",
  },
  {
    id: "arjun-mehta",
    name: "Arjun Mehta",
    role: "Senior Fuel Technician",
    image: emp3,
    experience: "15 years in petroleum equipment",
    bio: "Arjun keeps every pump, nozzle and tank in perfect health. His preventive maintenance program has kept our uptime above 99.9% for three years straight.",
    responsibilities: [
      "Pump calibration & maintenance",
      "Fuel quality testing",
      "Tank inspection & safety checks",
      "Equipment upgrades",
    ],
    email: "arjun@totalstation.com",
  },
  {
    id: "kabir-singh",
    name: "Kabir Singh",
    role: "Forecourt Attendant",
    image: emp4,
    experience: "3 years on the forecourt",
    bio: "Kabir is the smiling face you meet first. Fast, accurate and always courteous — he embodies the speed and warmth our customers love.",
    responsibilities: [
      "Fast, accurate fueling",
      "Windshield & tyre courtesy checks",
      "Cash and digital payment handling",
      "Forecourt cleanliness",
    ],
    email: "kabir@totalstation.com",
  },
];

export type EventItem = {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  date: string;
  image: string;
  images: string[];
  videoUrl: string;
};

export const events: EventItem[] = [
  {
    id: "grand-opening-2026",
    title: "Grand Opening of New Forecourt",
    description: "Unveiling our new ultra-modern forecourt with premium fuel dispensers and EV charging.",
    longDescription:
      "We celebrated the launch of our newly upgraded forecourt featuring six new high-flow dispensers, two ultra-fast EV charging bays, and a redesigned customer lounge. Hundreds of customers joined us for live music, refreshments and exclusive fuel discounts.",
    date: "March 14, 2026",
    image: event1,
    images: [event1],
    videoUrl: "",
  },
  {
    id: "diwali-celebration-2025",
    title: "Diwali Night with our Community",
    description: "Lighting up the station with diyas, sweets and a warm thank you to our loyal customers.",
    longDescription:
      "Our annual Diwali celebration brought together hundreds of families. We lit up the entire station with diyas, distributed sweets, and ran a special Diwali fuel cashback for every customer that evening.",
    date: "November 1, 2025",
    image: event2,
    images: [event2],
    videoUrl: "",
  },
  {
    id: "green-drive-2025",
    title: "Green Drive — 500 Trees Planted",
    description: "A community-wide tree plantation drive to offset our annual carbon footprint.",
    longDescription:
      "Our Green Drive initiative saw employees, customers and local NGOs come together to plant 500 native saplings around the station and along the highway. We commit to caring for every tree for the next 5 years.",
    date: "June 5, 2025",
    image: event3,
    images: [event3],
    videoUrl: "",
  },
];

export type ServiceItem = {
  id: string;
  title: string;
  category: string;
  description: string;
  longDescription: string;
  availability: string;
  quantity: string;
  price: string;
  highlights: string[];
  image: string;
  images: string[];
};

export const services: ServiceItem[] = [
  {
    id: "premium-petrol",
    title: "Premium Petrol",
    category: "Fuel",
    description: "High-octane petrol for smoother drives and cleaner engines.",
    longDescription:
      "Our Premium Petrol is formulated for modern engines that demand higher octane. Every delivery is quality-checked on arrival so you get consistent performance, better mileage, and fewer deposits over time.",
    availability: "Available 24/7",
    quantity: "On-site tank capacity · continuous refill",
    price: "Ask at pump / display board",
    highlights: [
      "Higher octane for turbo & premium cars",
      "Quality tested on every tanker delivery",
      "Dedicated high-flow dispensers",
      "Digital & cash payments accepted",
    ],
    image: event1,
    images: [event1, event2],
  },
  {
    id: "diesel",
    title: "Diesel",
    category: "Fuel",
    description: "Reliable diesel for cars, SUVs, and commercial fleets.",
    longDescription:
      "Clean, calibrated diesel for daily drivers and fleet operators. Our pumps are regularly audited so dispensed volume matches what you pay for.",
    availability: "Available 24/7",
    quantity: "High-volume underground storage",
    price: "Ask at pump / display board",
    highlights: [
      "Fleet-friendly high-flow nozzles",
      "Calibrated meters & transparent billing",
      "Suitable for cars, SUVs & light commercial",
      "Night-time service with full lighting",
    ],
    image: event2,
    images: [event2, event3],
  },
  {
    id: "ev-fast-charging",
    title: "EV Fast Charging",
    category: "EV & Charging",
    description: "Ultra-fast DC charging bays while you grab a coffee.",
    longDescription:
      "Two dedicated EV charging bays with CCS connectors. Ideal for highway top-ups or a quick charge while you visit the lounge.",
    availability: "Available · 2 bays",
    quantity: "2 charging bays",
    price: "Per kWh · see bay screen",
    highlights: [
      "CCS DC fast charging",
      "Covered bay with lighting",
      "Pay via UPI / card at bay",
      "Staff assistance on request",
    ],
    image: event1,
    images: [event1, event3],
  },
  {
    id: "air-tyre-care",
    title: "Air & Tyre Care",
    category: "Forecourt Care",
    description: "Free air check and pressure top-up for every visitor.",
    longDescription:
      "Maintain correct tyre pressure for safety and mileage. Our digital air points are free for customers — attendants can help set the PSI for your vehicle type.",
    availability: "Available",
    quantity: "2 air points",
    price: "Complimentary",
    highlights: [
      "Digital PSI display",
      "Free for station customers",
      "Attendant help available",
      "Open with station hours (24/7)",
    ],
    image: event3,
    images: [event3, event2],
  },
];

export const reviews = [
  { name: "Aanya Kapoor", rating: 5, text: "Cleanest station I've ever visited. The staff is incredibly friendly and the fuel quality is top-notch.", role: "Daily Commuter" },
  { name: "Vikram Bose", rating: 5, text: "Fast service, no queues even on weekends. Card payments and UPI work flawlessly. Highly recommended.", role: "Fleet Owner" },
  { name: "Sneha Iyer", rating: 5, text: "Love the premium feel — feels like an Apple Store for fuel. Air checks and washroom are always spotless.", role: "Long-distance Traveller" },
  { name: "Rahul Khanna", rating: 5, text: "Trusted this station for 6 years. Mileage of my car genuinely improved after switching here.", role: "Regular Customer" },
];
