import argparse
import os
import sys
from typing import Any

# Add current directory to path to allow imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from db_direct import query_collection, upsert_document
except ImportError:
    print("Error: Could not import db_direct. Make sure you are running this script from the backend directory.")
    sys.exit(1)

def promote_user(email: str):
    print(f"Searching for user with email: {email}")
    
    # Find user by email
    users = query_collection("users", filters=[("email", "==", email)])
    
    if not users:
        print(f"Error: No user found with email {email}")
        return

    if len(users) > 1:
        print(f"Warning: Multiple users found with email {email}. Promoting the first one.")

    user_doc = users[0]
    user_id = user_doc.id
    current_data = user_doc.data
    
    print(f"Found user: {user_id} (Current Role: {current_data.get('role', 'unknown')})")
    
    if current_data.get("role") == "teacher":
        print("User is already a teacher.")
        return

    # Update role
    print("Promoting to teacher...")
    upsert_document("users", {"role": "teacher"}, document_id=user_id, merge=True)
    
    print(f"Success! User {email} is now a teacher.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Promote a user to teacher role.")
    parser.add_argument("email", help="The email address of the user to promote")
    
    args = parser.parse_args()
    
    if not os.getenv("FIRESTORE_PROJECT_ID"):
        print("Warning: FIRESTORE_PROJECT_ID environment variable is not set.")
        # You might want to set a default or exit here depending on your setup
        # os.environ["FIRESTORE_PROJECT_ID"] = "your-project-id"

    try:
        promote_user(args.email)
    except Exception as e:
        print(f"An error occurred: {e}")
