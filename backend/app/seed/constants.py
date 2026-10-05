"""Constants, archetypes, and configuration for deterministic synthetic data generation.

Seed: 42 (Guarantees bit-level reproducibility across environments)
"""

from decimal import Decimal

SEED = 42

TARGET_PARTNER_DISTRIBUTION = {
    "Tier 1": 6,
    "Tier 2": 10,
    "Tier 3": 20,
}

# Harivishva Project Portfolio (Skyfinia & Infinia in Tathawade, Pune)
PROJECT_TEMPLATES = [
    {
        "id": "prj-sky-p1",
        "project_code": "PRJ-SKY-P1",
        "name": "Skyfinia Phase 1",
        "project_type": "Residential",
        "location": "Tathawade",
        "city": "Pune",
        "status": "Active",
        "launch_date": "2025-04-01",
        "target_units": 320,
        "starting_price": Decimal("7500000.00"),
        "unit_types": ["2 BHK Luxury", "3 BHK Premium"],
    },
    {
        "id": "prj-sky-p2",
        "project_code": "PRJ-SKY-P2",
        "name": "Skyfinia Phase 2",
        "project_type": "Residential",
        "location": "Tathawade",
        "city": "Pune",
        "status": "Active",
        "launch_date": "2025-10-15",
        "target_units": 280,
        "starting_price": Decimal("8200000.00"),
        "unit_types": ["2 BHK Grande", "3 BHK Royale", "4 BHK Sky Suite"],
    },
    {
        "id": "prj-inf-p1",
        "project_code": "PRJ-INF-P1",
        "name": "Infinia Phase 1",
        "project_type": "Residential",
        "location": "Tathawade",
        "city": "Pune",
        "status": "Active",
        "launch_date": "2025-02-01",
        "target_units": 360,
        "starting_price": Decimal("6800000.00"),
        "unit_types": ["2 BHK Smart", "3 BHK Urban"],
    },
    {
        "id": "prj-inf-p2",
        "project_code": "PRJ-INF-P2",
        "name": "Infinia Phase 2",
        "project_type": "Residential",
        "location": "Tathawade",
        "city": "Pune",
        "status": "Active",
        "launch_date": "2025-08-01",
        "target_units": 340,
        "starting_price": Decimal("7400000.00"),
        "unit_types": ["2 BHK Prime", "3 BHK Elite", "3.5 BHK Signature"],
    },
]

# Sales / Relationship Managers (5 Dedicated Managers)
SALESPEOPLE_TEMPLATES = [
    {
        "id": "sp-101",
        "name": "Rohit Deshmukh",
        "email": "rohit.deshmukh@harivishva.com",
        "phone": "+919822011001",
        "team": "Tathawade Portfolio Desk",
    },
    {
        "id": "sp-102",
        "name": "Priya Kulkarni",
        "email": "priya.kulkarni@harivishva.com",
        "phone": "+919822011002",
        "team": "Skyfinia Relationship Desk",
    },
    {
        "id": "sp-103",
        "name": "Amitabh Verma",
        "email": "amitabh.verma@harivishva.com",
        "phone": "+919822011003",
        "team": "Infinia Relationship Desk",
    },
    {
        "id": "sp-104",
        "name": "Sneha Patil",
        "email": "sneha.patil@harivishva.com",
        "phone": "+919822011004",
        "team": "Key Partner Accounts",
    },
    {
        "id": "sp-105",
        "name": "Rajesh Nair",
        "email": "rajesh.nair@harivishva.com",
        "phone": "+919822011005",
        "team": "Channel Growth Desk",
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
    "Tathawade", "Wakad", "Hinjawadi", "Ravet", "Punawale", "Baner",
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
