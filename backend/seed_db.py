import os
from pymongo import MongoClient, ASCENDING, DESCENDING
from datetime import datetime, timedelta
import bcrypt
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGO_DB", "SPA")

def seed_database():
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        
        print(f"--- Initializing Database: {DB_NAME} ---")

        # 1. USERS COLLECTION
        print("Setting up 'users'...")
        db.users.drop()
        db.users.create_index([("email", ASCENDING)], unique=True)
        
        admin_password = os.getenv("ADMIN_PASSWORD", "Admin123").encode('utf-8')
        password_hash = bcrypt.hashpw(admin_password, bcrypt.gensalt()).decode('utf-8')
        
        db.users.insert_one({
            "email": os.getenv("ADMIN_EMAIL", "admin@spa.com"),
            "password_hash": password_hash,
            "role": "admin",
            "status": "active",
            "profile": {"name": "System Admin", "phone": "+1000000000"},
            "permissions": {"level": 10, "scopes": ["all"]},
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })

        # 2. CAPTCHAS
        print("Setting up 'captchas'...")
        db.captchas.drop()
        db.captchas.create_index([("created_at", ASCENDING)], expireAfterSeconds=300)

        # 3. SPA SETTINGS
        print("Setting up 'spa_settings'...")
        db.spa_settings.drop()
        db.spa_settings.insert_one({
            "spa_info": {
                "spa_name": "Movi Cloud Luxury Spa",
                "address": "123 Serenity Blvd, Coastal City",
                "contact_number": "+1 (555) SPA-RELAX",
                "email": "hello@movicloud.com",
                "logo_url": "https://example.com/logo.png"
            },
            "working_hours": {
                "opening_time": "09:00",
                "closing_time": "21:00",
                "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
            },
            "appointment_rules": {
                "slot_duration_min": 30,
                "max_per_day": 50,
                "buffer_min": 15,
                "auto_confirm": True
            },
            "notifications": {
                "email_notifications": True,
                "appointment_reminders": True
            },
            "payment": {
                "methods": ["cash", "upi", "card"],
                "tax_percent": 18.0,
                "discount_percent": 5.0
            },
            "updated_at": datetime.utcnow()
        })

        # 4. MEMBERSHIP TIERS
        print("Setting up 'membership_tiers'...")
        db.membership_tiers.drop()
        tiers = [
            {"name": "Silver", "benefits": ["5% discount", "Free tea"], "price_multiplier": 1.0, "status": "active"},
            {"name": "Gold", "benefits": ["10% discount", "Priority booking"], "price_multiplier": 0.9, "status": "active"},
            {"name": "Diamond", "benefits": ["20% discount", "Exclusive lounge", "Birthday gift"], "price_multiplier": 0.8, "status": "active"}
        ]
        db.membership_tiers.insert_many(tiers)
        diamond_tier_id = db.membership_tiers.find_one({"name": "Diamond"})["_id"]

        # 5. STAFF
        print("Setting up 'staff'...")
        db.staff.drop()
        db.staff.create_index([("status", ASCENDING)])
        staff_data = [
            {
                "full_name": "Elena Rodriguez",
                "role_title": "Head Esthetician",
                "department": "Skincare",
                "placement": "Therapy",
                "status": "Active Today",
                "contact": {"email": "elena@spa.com", "phone": "+1 (555) 111-2222"},
                "permissions": {"level": "Level 4", "label": "Executive"},
                "onboarding": {"status": "completed", "checklist": []},
                "is_therapist": True,
                "therapist_profile": {
                    "specialty": "Anti-aging Facials",
                    "bio": "15 years of experience in luxury skincare.",
                    "booking_priority": 1,
                    "availability_status": "available",
                    "image_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2"
                },
                "created_at": datetime.utcnow()
            },
            {
                "full_name": "Marcus Thorne",
                "role_title": "Massage Specialist",
                "department": "Bodywork",
                "placement": "Therapy",
                "status": "In Treatment",
                "contact": {"email": "marcus@spa.com", "phone": "+1 (555) 222-3333"},
                "permissions": {"level": "Level 2", "label": "Staff"},
                "onboarding": {"status": "completed", "checklist": []},
                "is_therapist": True,
                "therapist_profile": {
                    "specialty": "Deep Tissue",
                    "bio": "Certified sports massage therapist.",
                    "booking_priority": 2,
                    "availability_status": "busy",
                    "image_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e"
                },
                "created_at": datetime.utcnow()
            }
        ]
        db.staff.insert_many(staff_data)
        elena_id = db.staff.find_one({"full_name": "Elena Rodriguez"})["_id"]

        # 6. ROOMS
        print("Setting up 'rooms'...")
        db.rooms.drop()
        rooms_data = [
            {
                "name": "The Zen Suite",
                "type": "Oriental Therapy",
                "status": "Available",
                "capacity": 1,
                "environment": {"temperature_c": 24, "humidity_pct": 45},
                "notes": "Purified, Silent",
                "image_url": "https://images.unsplash.com/photo-1505691938895-1758d7feb511"
            },
            {
                "name": "Garden Alcove",
                "type": "Aromatherapy",
                "status": "Occupied",
                "capacity": 1,
                "environment": {"temperature_c": 22, "humidity_pct": 50},
                "notes": "Lavender Mist",
                "image_url": "https://images.unsplash.com/photo-1505691723518-36a5ac3be353"
            }
        ]
        db.rooms.insert_many(rooms_data)
        zen_room_id = db.rooms.find_one({"name": "The Zen Suite"})["_id"]

        # 7. SERVICES
        print("Setting up 'services'...")
        db.services.drop()
        services_data = [
            {
                "name": "Ocean Drift Massage",
                "description": "A rhythmic movement ritual using warm sea-shell infusions.",
                "category": "Bodywork",
                "duration_min": 60,
                "price": 185.00,
                "tags": ["Signature", "Relaxing"],
                "status": "active"
            },
            {
                "name": "Golden Hour Facial",
                "description": "Transformative treatment utilizing micro-currents.",
                "category": "Skincare",
                "duration_min": 75,
                "price": 220.00,
                "tags": ["Bestseller", "Luxury"],
                "status": "active"
            }
        ]
        db.services.insert_many(services_data)
        facial_id = db.services.find_one({"name": "Golden Hour Facial"})["_id"]

        # 8. CLIENTS
        print("Setting up 'clients'...")
        db.clients.drop()
        db.clients.create_index([("email", ASCENDING)], unique=True)
        db.clients.insert_one({
            "full_name": "Julianne Moore",
            "email": "julianne@example.com",
            "phone": "+1 (555) 123-4567",
            "address": "456 Hollywood Blvd, LA",
            "age": 45,
            "status": "Active",
            "contact_method": "email",
            "membership_tier_id": diamond_tier_id,
            "preferences": {"notes": "Allergic to nuts", "tags": ["VIP", "Frequent"]},
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        julianne_id = db.clients.find_one({"email": "julianne@example.com"})["_id"]

        # 9. APPOINTMENTS
        print("Setting up 'appointments'...")
        db.appointments.drop()
        db.appointments.create_index([("start_at", DESCENDING)])
        db.appointments.insert_one({
            "client_id": julianne_id,
            "therapist_id": elena_id,
            "room_id": zen_room_id,
            "service_id": facial_id,
            "status": "confirmed",
            "start_at": datetime.utcnow() + timedelta(days=1, hours=10),
            "end_at": datetime.utcnow() + timedelta(days=1, hours=11, minutes=15),
            "duration_min": 75,
            "notes": "Special occasion",
            "created_by": "system",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "notification_state": {"sms_sent": False, "email_sent": True}
        })
        apt_id = db.appointments.find_one()["_id"]

        # 10. PAYMENTS
        print("Setting up 'payments'...")
        db.payments.drop()
        db.payments.insert_one({
            "appointment_id": apt_id,
            "client_id": julianne_id,
            "amount": 220.00,
            "tax_amount": 39.60,
            "discount_amount": 44.00,
            "method": "card",
            "status": "pending",
            "line_items": [{"service_id": facial_id, "name": "Golden Hour Facial", "qty": 1, "price": 220.00}],
            "created_at": datetime.utcnow()
        })

        # 11. OFFERS
        print("Setting up 'offers'...")
        db.offers.drop()
        db.offers.insert_one({
            "title": "Summer Glow Package",
            "description": "Facial + Body Wrap + complimentary tea.",
            "price": 350.00,
            "original_price": 450.00,
            "status": "active",
            "starts_at": datetime.utcnow(),
            "ends_at": datetime.utcnow() + timedelta(days=30),
            "tags": ["Summer", "Package"]
        })

        # 12. LOYALTY ACCOUNTS
        print("Setting up 'loyalty_accounts'...")
        db.loyalty_accounts.drop()
        db.loyalty_accounts.insert_one({
            "client_id": julianne_id,
            "points_balance": 1500,
            "tier": "Diamond",
            "updated_at": datetime.utcnow()
        })

        # 13. ANALYTICS SNAPSHOTS
        print("Setting up 'analytics_snapshots'...")
        db.analytics_snapshots.drop()
        db.analytics_snapshots.insert_one({
            "period_start": datetime.utcnow() - timedelta(days=30),
            "period_end": datetime.utcnow(),
            "revenue": {"services": 15000.0, "retail": 2000.0, "total": 17000.0},
            "retention_rate": 85.5,
            "avg_ticket": 125.0,
            "active_memberships": 45,
            "popular_treatments": [{"service_id": facial_id, "percent": 40}],
            "lifecycle_heatmap": [10, 20, 15, 30, 25, 40, 50],
            "created_at": datetime.utcnow()
        })

        # 14. AI INSIGHTS
        print("Setting up 'ai_insights'...")
        db.ai_insights.drop()
        db.ai_insights.insert_one({
            "title": "Peak Demand Predicted",
            "summary": "High demand expected next Saturday for Bodywork services.",
            "priority": "high",
            "status": "new",
            "metrics": {"accuracy": 92.0, "uplift": 15.0, "impact": 1200.0},
            "actions": [{"label": "Increase Staffing", "action_type": "staff_roster", "payload": {}}],
            "created_at": datetime.utcnow()
        })

        # 15. NOTIFICATIONS
        print("Setting up 'notifications'...")
        db.notifications.drop()

        # 16. AUDIT LOGS
        print("Setting up 'audit_logs'...")
        db.audit_logs.drop()

        print("\n--- SCHEMA EXECUTED SUCCESSFULLY ---")
        print(f"Database '{DB_NAME}' has been fully initialized with sample data.")
        
    except Exception as e:
        print(f"Error seeding database: {e}")

if __name__ == "__main__":
    seed_database()
