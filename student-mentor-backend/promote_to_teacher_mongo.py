import argparse
import asyncio
import os
import sys
from typing import Any

# Add current directory to path to allow imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from database import init_database, get_database
    from models import User
except ImportError as e:
    print(f"Error: Could not import required modules: {e}")
    print("Make sure you are running this script from the backend directory.")
    sys.exit(1)

async def promote_user(email: str):
    """Promote a user to teacher role in MongoDB"""
    print(f"Searching for user with email: {email}")

    # Initialize database connection
    database = await init_database()
    if database is None:
        print("Error: Could not connect to MongoDB. Check your MONGODB_URL environment variable.")
        return

    # Initialize Beanie ODM
    try:
        from beanie import init_beanie
        await init_beanie(database=database, document_models=[User])
        print("✅ Beanie ODM initialized successfully")
    except Exception as e:
        print(f"Error initializing Beanie ODM: {e}")
        return

    # Find user by email
    user = await User.find_one(User.email == email)

    if not user:
        print(f"❌ Error: No user found with email {email}")
        print("💡 Make sure the user has signed up first before promoting them.")
        return

    print(f"✅ Found user: {user.id} (Current Role: {user.role})")

    if user.role == "teacher":
        print("ℹ️  User is already a teacher.")
        return

    # Update role
    print("🔄 Promoting to teacher...")
    user.role = "teacher"

    try:
        await user.save()
        print(f"✅ Success! User {email} is now a teacher.")
        print(f"📧 Email: {user.email}")
        print(f"🆔 User ID: {user.id}")
        print(f"👤 Role: {user.role}")
    except Exception as e:
        print(f"❌ Error updating user role: {e}")

async def main():
    parser = argparse.ArgumentParser(description="Promote a user to teacher role in MongoDB.")
    parser.add_argument("email", help="The email address of the user to promote")

    args = parser.parse_args()

    # Check for required environment variables
    mongodb_url = os.getenv("MONGODB_URL")
    if not mongodb_url:
        print("⚠️  Warning: MONGODB_URL environment variable is not set.")
        print("   Defaulting to: mongodb://localhost:27017/student_mentor")
        print("   Make sure your MongoDB is running or set MONGODB_URL for MongoDB Atlas.")

    try:
        await promote_user(args.email)
    except Exception as e:
        print(f"❌ An error occurred: {e}")
    finally:
        # Close any open connections
        from database import get_client
        try:
            client = get_client()
            client.close()
        except:
            pass

if __name__ == "__main__":
    asyncio.run(main())
