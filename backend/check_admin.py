from pymongo import MongoClient
import bcrypt

client = MongoClient('mongodb://localhost:27017')
db = client['movicloud']

# Check if admin user exists
user = db.users.find_one({'email': 'admin@spa.com'})
if user:
    print("Admin user exists!")
    print(f"Email: {user['email']}")
    print(f"Role: {user.get('role', 'N/A')}")
    print(f"Password hash: {user.get('password_hash', 'N/A')[:30]}...")
    
    # Test if password matches
    test_password = 'Admin123'
    stored_hash = user.get('password_hash', '')
    matches = bcrypt.checkpw(test_password.encode('utf-8'), stored_hash.encode('utf-8'))
    print(f"\nPassword 'Admin123' matches: {matches}")
    
    if not matches:
        print("\nUpdating password...")
        new_hash = bcrypt.hashpw(test_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        db.users.update_one(
            {'email': 'admin@spa.com'},
            {'$set': {'password_hash': new_hash}}
        )
        print("Password updated successfully!")
        print(f"New hash: {new_hash[:30]}...")
        # Verify again
        user = db.users.find_one({'email': 'admin@spa.com'})
        matches = bcrypt.checkpw(test_password.encode('utf-8'), user['password_hash'].encode('utf-8'))
        print(f"Verification: {matches}")
else:
    print("Admin user does not exist!")
    # Create it
    password = 'Admin123'
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    db.users.insert_one({
        'email': 'admin@spa.com',
        'password_hash': password_hash,
        'role': 'admin'
    })
    print("Created admin user with password: Admin123")
