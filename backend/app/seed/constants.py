"""Constants, archetypes, and configuration for deterministic synthetic data generation.

Seed: 42 (Guarantees bit-level reproducibility across environments)
"""

from decimal import Decimal

SEED = 42

TARGET_PARTNER_DISTRIBUTION = {
    "Tier 1": 18,
    "Tier 2": 45,
    "Tier 3": 112,
}

# Project portfolio templates (Pune micro-markets)
PROJECT_TEMPLATES = [
    {
        "id": "prj-101",
        "project_code": "PRJ-SOLARIS",
        "name": "Solaris Residences",
        "project_type": "Residential",
        "location": "Kharadi",
        "city": "Pune",
        "status": "Active",
        "launch_date": "2025-06-01",
        "target_units": 450,
        "starting_price": Decimal("8500000.00"),
        "unit_types": ["2 BHK", "3 BHK Premium", "4 BHK Luxury"],
    },
    {
        "id": "prj-102",
        "project_code": "PRJ-AURORA",
        "name": "Aurora Heights",
        "project_type": "Residential",
        "location": "Wakad",
        "city": "Pune",
        "status": "Active",
        "launch_date": "2025-08-15",
        "target_units": 600,
        "starting_price": Decimal("6200000.00"),
        "unit_types": ["1 BHK Smart", "2 BHK", "3 BHK"],
    },
    {
        "id": "prj-103",
        "project_code": "PRJ-ZENITH",
        "name": "Zenith Business Park",
        "project_type": "Commercial",
        "location": "Baner",
        "city": "Pune",
        "status": "Active",
        "launch_date": "2025-03-10",
        "target_units": 200,
        "starting_price": Decimal("15000000.00"),
        "unit_types": ["Boutique Office", "Mid-size Floor", "Anchor Suite"],
    },
    {
        "id": "prj-104",
        "project_code": "PRJ-VANGUARD",
        "name": "Vanguard Estates",
        "project_type": "Plotted",
        "location": "Hinjawadi",
        "city": "Pune",
        "status": "Nearly Sold Out",
        "launch_date": "2024-11-01",
        "target_units": 300,
        "starting_price": Decimal("4800000.00"),
        "unit_types": ["1500 sqft Plot", "2400 sqft Plot", "Estate Plot"],
    },
    {
        "id": "prj-105",
        "project_code": "PRJ-URBAN-OASIS",
        "name": "Urban Oasis",
        "project_type": "Mixed-Use",
        "location": "Hadapsar",
        "city": "Pune",
        "status": "Upcoming",
        "launch_date": "2026-02-01",
        "target_units": 400,
        "starting_price": Decimal("7500000.00"),
        "unit_types": ["Studio", "2 BHK Urban", "High-street Retail"],
    },
]

# Salespeople list
SALESPEOPLE_TEMPLATES = [
    {
        "id": "sp-101",
        "name": "Rohit Deshmukh",
        "email": "rohit.deshmukh@hariwishwa.com",
        "phone": "+919822011001",
        "team": "East Pune Cluster",
    },
    {
        "id": "sp-102",
        "name": "Priya Kulkarni",
        "email": "priya.kulkarni@hariwishwa.com",
        "phone": "+919822011002",
        "team": "West Pune Cluster",
    },
    {
        "id": "sp-103",
        "name": "Amitabh Verma",
        "email": "amitabh.verma@hariwishwa.com",
        "phone": "+919822011003",
        "team": "Luxury Residential Team",
    },
    {
        "id": "sp-104",
        "name": "Sneha Patil",
        "email": "sneha.patil@hariwishwa.com",
        "phone": "+919822011004",
        "team": "Commercial Assets Team",
    },
    {
        "id": "sp-105",
        "name": "Rajesh Nair",
        "email": "rajesh.nair@hariwishwa.com",
        "phone": "+919822011005",
        "team": "East Pune Cluster",
    },
    {
        "id": "sp-106",
        "name": "Ananya Joshi",
        "email": "ananya.joshi@hariwishwa.com",
        "phone": "+919822011006",
        "team": "West Pune Cluster",
    },
    {
        "id": "sp-107",
        "name": "Vikram Rao",
        "email": "vikram.rao@hariwishwa.com",
        "phone": "+919822011007",
        "team": "Luxury Residential Team",
    },
    {
        "id": "sp-108",
        "name": "Pooja Shinde",
        "email": "pooja.shinde@hariwishwa.com",
        "phone": "+919822011008",
        "team": "Central Pune Cluster",
    },
    {
        "id": "sp-109",
        "name": "Karan Mehta",
        "email": "karan.mehta@hariwishwa.com",
        "phone": "+919822011009",
        "team": "Plotted & Land Division",
    },
    {
        "id": "sp-110",
        "name": "Meera Iyer",
        "email": "meera.iyer@hariwishwa.com",
        "phone": "+919822011010",
        "team": "Central Pune Cluster",
    },
]

# Brokerage and Agency Name Components
PARTNER_PREFIXES = [
    "Apex", "Prime", "Metro", "Summit", "Sterling", "Quantum", "Nexus", "Elite",
    "Bluebell", "Horizon", "Ascent", "Vanguard", "Silverline", "Prestige", "Galaxy",
    "Zenith", "Pinnacle", "Greenfield", "Imperial", "Skyline", "Trident", "Capital",
    "Mahalaxmi", "Paramount", "Landmark", "Heritage", "Omkar", "Shree", "Sai",
    "Fortune", "Marathon", "Regency", "Signature", "Urban", "Iconic", "Reliant",
]

PARTNER_SUFFIXES = [
    "Realty Partners", "Properties", "Real Estate Advisors", "Property Consultants",
    "Realtors Group", "Estate Management", "Property Solutions", "Channel Advisors",
    "Advisory LLP", "Realty Services", "Homes & Estates", "Asset Consultants",
]

PUNE_LOCALITIES = [
    "Baner", "Kharadi", "Wakad", "Hinjawadi", "Kothrud", "Kalyani Nagar",
    "Viman Nagar", "Hadapsar", "Bavdhan", "Aundh", "Magarpatta", "Koregaon Park",
    "Pimple Saudagar", "Balewadi", "Senapati Bapat Road", "Ravet",
]

FIRST_NAMES = [
    "Aarav", "Aditi", "Advait", "Akash", "Alok", "Anand", "Ananya", "Aniket", "Ankush",
    "Arjun", "Ashish", "Avinash", "Bhavna", "Chetan", "Deepak", "Devendra", "Divya",
    "Gaurav", "Harish", "Ishaan", "Jitendra", "Kalyani", "Karan", "Kavita", "Kiran",
    "Madhuri", "Manish", "Mayur", "Manoj", "Neha", "Nikhil", "Nilesh", "Nitin",
    "Pooja", "Pradeep", "Prakash", "Prashant", "Pratik", "Pravin", "Rahul", "Rajesh",
    "Ramesh", "Ravi", "Rohan", "Sachin", "Sameer", "Sandip", "Sanjay", "Santosh",
    "Saurabh", "Shailesh", "Shirish", "Shruti", "Siddharth", "Snehal", "Sudhir",
    "Sujata", "Sunil", "Suresh", "Swapnil", "Tanvi", "Tushar", "Umesh", "Vaibhav",
    "Varun", "Vikas", "Vikram", "Vinay", "Vinayak", "Vishal", "Vivek", "Yogesh",
]

LAST_NAMES = [
    "Agarwal", "Bapat", "Bhadale", "Bhosale", "Chavan", "Deshmukh", "Deshpande",
    "Gadgil", "Gaikwad", "Gokhale", "Gupta", "Jadhav", "Jagtap", "Jain", "Joshi",
    "Kadam", "Kale", "Kamble", "Kapoor", "Kashid", "Kharat", "Kothari", "Kulkarni",
    "Mahajan", "Malhotra", "Mane", "Marathe", "Mehta", "Mishra", "More", "Naik",
    "Nair", "Pandey", "Patel", "Pathak", "Patil", "Pawar", "Pillai", "Pradhan",
    "Ranade", "Rane", "Rathod", "Raut", "Reddy", "Salunkhe", "Sawant", "Shah",
    "Sharma", "Shinde", "Singh", "Soni", "Surve", "Tambe", "Thakur", "Upadhyay",
    "Varma", "Verma", "Wagh", "Yadav", "Zambre",
]

LOST_REASONS = [
    "Budget Mismatch",
    "Location Unsuitable",
    "Bought with Competitor",
    "Follow-up Expired",
    "Loan Eligibility Issue",
    "Unit Layout Mismatch",
    "Possession Timeline Too Long",
]

BUDGET_RANGES = [
    "45L - 65L",
    "65L - 90L",
    "90L - 1.25Cr",
    "1.25Cr - 1.75Cr",
    "1.75Cr - 2.5Cr",
    "2.5Cr - 4.0Cr",
    "4.0Cr+",
]

ACTIVITY_TYPES = [
    "lead_submitted",
    "site_visit_scheduled",
    "site_visit_completed",
    "booking_initiated",
    "booking_confirmed",
    "tier_updated",
    "review_logged",
    "follow_up",
    "meeting",
]
