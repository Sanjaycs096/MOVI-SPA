import requests

# Test login
base_url = "http://localhost:8000"

# Step 1: Get captcha
print("Step 1: Getting captcha...")
captcha_resp = requests.post(f"{base_url}/auth/captcha")
print(f"Captcha status: {captcha_resp.status_code}")
captcha_data = captcha_resp.json()
captcha_id = captcha_data['captcha_id']
print(f"Captcha ID: {captcha_id}")
print(f"Image data starts with: {captcha_data['image_data'][:50]}...")

# For testing, we need to decode the image
# In real usage, user sees the image and types what they see
# Let's try to login - we'll need to solve captcha manually
print("\nPlease check the captcha image and enter the answer.")
print("(For automated testing, we'll try a direct approach)")

# Let's try a different approach - check if there's an admin user
print("\nChecking database for admin user...")
