import os
import sys
from dotenv import load_dotenv
from supabase import create_client

# Add the backend directory to sys.path so we can import from app
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# Load environment variables from backend/.env
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=env_path)

def test_user_login():
    url = os.getenv("SUPABASE_URL")
    anon_key = os.getenv("SUPABASE_ANON_KEY")

    if not url or not anon_key:
        print("Error: SUPABASE_URL or SUPABASE_ANON_KEY not found in .env")
        return

    email = "wuyuhaoangus@gmail.com"
    # Note: I don't have the password, so I'll ask the user to provide it or run this themselves.
    # However, I can try to see if the user is ALREADY confirmed by checking if we can 
    # at least get to the login attempt.
    
    password = input("Please enter the password for wuyuhaoangus@gmail.com: ")

    print(f"Attempting to login to: {url}")
    supabase = create_client(url, anon_key)

    try:
        res = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        if res.user:
            print(f"Login SUCCESSFUL!")
            print(f"User ID: {res.user.id}")
            print(f"Email: {res.user.email}")
            print(f"Confirmed At: {res.user.email_confirmed_at}")
            
            # Now check the profile table with the authenticated session
            print("\n--- Checking public.profiles Table (Authenticated) ---")
            profile_res = supabase.table("profiles").select("*").eq("id", res.user.id).execute()
            if profile_res.data:
                print(f"Profile found: {profile_res.data[0]}")
            else:
                print("Profile NOT found. Did you run the SQL script to create the table and trigger?")
        else:
            print("Login failed: No user returned.")
    except Exception as e:
        print(f"Login failed: {e}")

if __name__ == "__main__":
    test_user_login()
