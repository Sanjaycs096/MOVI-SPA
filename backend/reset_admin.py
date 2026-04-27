from pymongo import MongoClient
import bcrypt

client = MongoClient('mongodb://localhost:27017')
db = client['movicloud']

password = 'Admin123'
password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

result = db.users.update_one(
    {'email': 'admin@spa.com'},
    {'$set': {'password_hash': password_hash, 'role': 'admin'}},
    upsert=True
)

print('Admin user updated successfully!')
print(f'Password hash: {password_hash[:20]}...')
