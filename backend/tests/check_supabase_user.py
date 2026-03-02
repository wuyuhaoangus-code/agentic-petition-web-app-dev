import os
import sys
from dotenv import load_dotenv
from supabase import create_client

# Add the backend directory to sys.path so we can import from app
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# Load environment variables from backend/.env
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=env_path)

def check_supabase():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    anon_key = os.getenv("SUPABASE_ANON_KEY")

    if not url:
        print("Error: SUPABASE_URL not found in .env")
        return

    print(f"Connecting to Supabase at: {url}")
    
    # Use service role key if available and not a placeholder
    use_service_key = key and "REPLACE_WITH" not in key
    client_key = key if use_service_key else anon_key
    
    if not client_key:
        print("Error: No Supabase key found (ANON or SERVICE_ROLE)")
        return

    supabase = create_client(url, client_key)

    if use_service_key:
        try:
            print("\n--- Checking Auth Users (using Service Role Key) ---")
            users_response = supabase.auth.admin.list_users()
            users = getattr(users_response, 'users', []) or getattr(users_response, 'data', [])
            
            if not users:
                print("No users found in Supabase Auth.")
            for user in users:
                print(f"Email: {user.email}, ID: {user.id}, Confirmed At: {user.email_confirmed_at}")
        except Exception as e:
            print(f"Auth check failed: {e}")
    else:
        print("\nSkipping Auth check (Service Role Key is missing or placeholder).")

    try:
        print("\n--- Checking public.profiles Table ---")
        # This might fail if RLS is enabled and we are using the ANON key without a session
        res = supabase.table("profiles").select("*").execute()
        if res.data:
            print(f"Found {len(res.data)} profiles:")
            for profile in res.data:
                print(profile)
        else:
            print("No profiles found in public.profiles table (or RLS is blocking access).")
    except Exception as e:
        print(f"Profiles table check failed: {e}")
        if "PGRST301" in str(e) or "JWT" in str(e):
            print("Tip: This usually means RLS is enabled and you're using an Anon key without a valid user session.")

if __name__ == "__main__":
    check_supabase()
