import os
import sys
import uuid
import httpx
import json
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=env_path)

BASE_URL = "http://localhost:8080/api/v1"

def test_pipeline():
    url = os.getenv("SUPABASE_URL")
    anon_key = os.getenv("SUPABASE_ANON_KEY")
    email = "wuyuhaoangus@gmail.com"
    
    print("\n--- AI Pipeline Test (Bouncer -> Drafter -> Builder) ---")
    print("1. Password Login")
    print("2. Use existing JWT Token (from Browser)")
    choice = input("Select login method (1/2): ")

    if choice == "1":
        password = input(f"Enter Supabase password for {email}: ")
        supabase = create_client(url, anon_key)
        res = supabase.auth.sign_in_with_password({"email": email, "password": password})
        token = res.session.access_token
    else:
        token = input("Paste your Supabase Access Token (JWT): ")

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Check for evidence
    print("\n[2/5] Checking for evidence...")
    get_res = httpx.get(f"{BASE_URL}/documents/description", headers=headers)
    if get_res.status_code != 200:
        print(f"Error fetching evidence: {get_res.text}")
        return
        
    has_awards = any("awards" in item.get("criteria", "") for item in get_res.json())
    
    if not has_awards:
        print("No 'awards' evidence found. Creating a sample manual entry...")
        desc_payload = {
            "title": "Forbes 30 Under 30 Selection",
            "content": "I was selected for the Forbes 30 Under 30 list in the Science category for my work on quantum computing. This award is highly selective, recognizing only 30 individuals from thousands of nominees.",
            "criteria": json.dumps(["awards"])
        }
        httpx.post(f"{BASE_URL}/documents/description", json=desc_payload, headers=headers)
    else:
        print("Found existing 'awards' evidence.")

    # 3. Generate Exhibits (Bouncer)
    print("\n[3/5] Running Bouncer (Grouping Evidence into Exhibits)...")
    bouncer_res = httpx.post(f"{BASE_URL}/petitions/generate-exhibits", params={"criteria_id": "awards"}, headers=headers)
    if bouncer_res.status_code != 200:
        print(f"Bouncer Error: {bouncer_res.text}")
        return
    
    exhibits = bouncer_res.json().get("exhibits", [])
    print(f"Bouncer generated {len(exhibits)} exhibits.")
    for ex in exhibits:
        print(f" - EXHIBIT {ex['exhibit_number']}: {ex['title']}")

    if not exhibits:
        return

    # 4. Draft Section (Drafter)
    ex_id = exhibits[0]["id"]
    print(f"\n[4/5] Running Drafter with Google Search for: {exhibits[0]['title']}...")
    draft_res = httpx.post(f"{BASE_URL}/petitions/draft-petition-section", params={"exhibit_id": ex_id}, headers=headers)
    if draft_res.status_code != 200:
        print(f"Drafter Error: {draft_res.text}")
        return
    
    print("Draft generated successfully.")
    print("\n--- DRAFT PREVIEW ---")
    print(draft_res.json().get("draft", {}).get("draft_content", "")[:500] + "...")
    print("--------------------")

    # 5. Download .docx (Builder)
    print("\n[5/5] Assembling final .docx...")
    download_res = httpx.get(f"{BASE_URL}/petitions/download-petition-section", params={"criteria_id": "awards"}, headers=headers)
    
    if download_res.status_code == 200:
        output_path = "test_awards_petition.docx"
        with open(output_path, "wb") as f:
            f.write(download_res.content)
        print(f"\nSUCCESS! Your EB-1A petition section has been generated.")
        print(f"File saved to: {os.path.abspath(output_path)}")
    else:
        print(f"Builder Error: {download_res.text}")

if __name__ == "__main__":
    test_pipeline()
