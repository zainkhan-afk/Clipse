import requests

BASE_URL = "http://localhost:8000/clipboard"

# ------------------------------
# Step 1: Register a new user
# ------------------------------
email = "testuser@example.com"
password = "test123"

print("Registering user...")
register_resp = requests.post(f"{BASE_URL}/auth/register", params={"email": email, "password": password})
register_data = register_resp.json()
print("Register response:", register_data)

# Grab the verification link from the response
verification_link = register_data.get("verification_link")
if not verification_link:
    raise Exception("No verification link returned")

# ------------------------------
# Step 2: Verify email
# ------------------------------
print("Verifying email...")
verify_resp = requests.get(verification_link)
print("Verification response:", verify_resp.json())

# ------------------------------
# Step 3: Login
# ------------------------------
print("Logging in...")
login_resp = requests.post(f"{BASE_URL}/auth/login", params={"email": email, "password": password})
login_data = login_resp.json()
print("Login response:", login_data)

access_token = login_data.get("access_token")
if not access_token:
    raise Exception("Login failed, no access token returned")

# ------------------------------
# Step 4: Access protected route
# ------------------------------
print("Accessing protected route /auth/me...")
headers = {"Authorization": f"Bearer {access_token}"}
me_resp = requests.get(f"{BASE_URL}/auth/me", headers=headers)
print("Protected route response:", me_resp.json())
