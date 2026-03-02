import os
import uuid
import time
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables from backend/.env
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=env_path)

def test_full_flow():
    url = os.getenv("SUPABASE_URL")
    anon_key = os.getenv("SUPABASE_ANON_KEY")

    if not url or not anon_key:
        print("Error: SUPABASE_URL or SUPABASE_ANON_KEY not found in .env")
        return

    # 1. Generate unique credentials (using a real-looking domain)
    random_id = str(uuid.uuid4())[:8]
    email = f"testuser_{random_id}@gmail.com"
    password = "SecurePassword123!"
    full_name = f"Test User {random_id}"

    print(f"--- STARTING AUTH FLOW TEST ---")
    print(f"Target: {url}")
    print(f"Test Email: {email}")

    supabase = create_client(url, anon_key)

    try:
        # 2. SIGN UP
        print("\nStep 1: Signing up...")
        signup_res = supabase.auth.sign_up({
            "email": email,
            "password": password,
            "options": {
                "data": {
                    "full_name": full_name
                }
            }
        })
        
        if signup_res.user:
            print(f"Signup SUCCESS! User ID: {signup_res.user.id}")
        else:
            print("Signup failed: No user returned.")
            return

        # 3. SIGN IN
        print("\nStep 2: Attempting to log in...")
        try:
            login_res = supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            
            if login_res.session:
                print("Login SUCCESS!")
                # Wait a bit for the trigger to finish
                time.sleep(2)
                
                # 4. CHECK PROFILE
                print("\nStep 3: Checking profiles table (Authenticated)...")
                profile_res = supabase.table("profiles").select("*").eq("id", login_res.user.id).execute()
                if profile_res.data:
                    print(f"Profile found: {profile_res.data}")
                else:
                    print("Profile not found. Did you create the table and trigger in Supabase?")
            else:
                print("Login failed: No session returned. (Email confirmation is likely required)")
                
                # 3b. AUTO-CONFIRM if Service Key is present
                service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
                if service_key and "REPLACE_WITH" not in service_key:
                    print("\nStep 2b: Service Role Key found. Auto-confirming user...")
                    admin_client = create_client(url, service_key)
                    admin_client.auth.admin.update_user_by_id(
                        signup_res.user.id,
                        {"email_confirm": True}
                    )
                    time.sleep(1)
                    login_res = admin_client.auth.sign_in_with_password({
                        "email": email,
                        "password": password
                    })
                    if login_res.session:
                        print("Login SUCCESS after auto-confirm!")
                        time.sleep(2)
                        print("\nStep 3: Checking profiles table (Authenticated)...")
                        profile_res = admin_client.table("profiles").select("*").eq("id", login_res.user.id).execute()
                        if profile_res.data:
                            print(f"Profile found: {profile_res.data}")
                        else:
                            print("Profile table is empty. Trigger may not be set up.")
                else:
                    print("\nTip: To test login without clicking an email, disable 'Confirm Email' in Supabase Auth Settings.")

        except Exception as inner_e:
            print(f"Login step failed: {inner_e}")

    except Exception as e:
        print(f"\nFlow failed with error: {e}")

if __name__ == "__main__":
    test_full_flow()
