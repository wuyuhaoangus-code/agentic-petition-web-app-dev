import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('backend/.env')
url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_ANON_KEY')

s = create_client(url, key)

print(f"Pinging Supabase Auth at: {url}")

try:
    # Attempting to sign up will tell us if the user exists
    res = s.auth.sign_up({
        "email": "wuyuhaoangus@gmail.com",
        "password": "temporary_password_123"
    })
    print("\n--- Result ---")
    print(res)
except Exception as e:
    print("\n--- Result ---")
    print(f"Error: {e}")
