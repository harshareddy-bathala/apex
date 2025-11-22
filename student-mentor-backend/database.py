from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
import os

# MongoDB connection
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017/student_mentor")
DATABASE_NAME = os.getenv("DATABASE_NAME", "student_mentor")

# Global client instance
client: AsyncIOMotorClient = None
database = None

async def init_database():
    """Initialize MongoDB connection and Beanie ODM"""
    global client, database

    try:
        client = AsyncIOMotorClient(MONGODB_URL)
        database = client[DATABASE_NAME]

        # Test the connection
        await client.admin.command('ping')
        print("✅ MongoDB connection established successfully")
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        print("💡 Make sure MongoDB Atlas is running and MONGODB_URL is set correctly")
        print(f"Current MONGODB_URL: {MONGODB_URL}")
        # Don't raise the exception - allow the app to start without MongoDB for development
        client = None
        database = None

    return database

def get_database():
    """Get the database instance"""
    if database is None:
        raise RuntimeError("Database not initialized. MongoDB connection failed during startup.")
    return database

def get_client():
    """Get the MongoDB client instance"""
    if client is None:
        raise RuntimeError("Database not initialized. MongoDB connection failed during startup.")
    return client

def is_database_connected():
    """Check if MongoDB is connected"""
    return database is not None and client is not None
