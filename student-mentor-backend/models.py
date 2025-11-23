from beanie import Document
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime
from bson import ObjectId

class Profile(BaseModel):
    """Embedded profile document"""
    name: Optional[str] = None
    grade: Optional[str] = None
    studentId: Optional[str] = None
    dateOfBirth: Optional[str] = None
    phoneNumber: Optional[str] = None
    interests: Optional[List[str]] = None
    bio: Optional[str] = None
    hobbies: Optional[List[str]] = None
    followers: Optional[int] = 0
    notesShared: Optional[int] = 0
    onboardingComplete: Optional[bool] = False

class User(Document):
    """User model"""
    id: str = Field(..., alias="_id")  # Firebase UID
    email: str
    role: Literal["student", "teacher"] = "student"
    profile: Optional[Profile] = None
    followers: List[str] = Field(default_factory=list)  # List of user IDs
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"
        indexes = [
            "email",
            "role",
        ]

class Habit(Document):
    """Habit model"""
    id: str = Field(default_factory=lambda: str(ObjectId()))
    user_email: str  # Reference to user
    title: str
    completed_dates: List[str] = Field(default_factory=list)  # ISO date strings
    timeOfDay: Literal["morning", "afternoon", "evening"] = "morning"
    targetTimeMinutes: int = 5  # Target time in minutes for this habit
    archived: bool = False
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    lastCompletedAt: Optional[str] = None

    class Settings:
        name = "habits"
        indexes = [
            "user_email",
            "archived",
        ]

class CommunityPost(Document):
    """Community post model"""
    id: str = Field(default_factory=lambda: str(ObjectId()))
    author: str  # User ID
    authorName: str
    authorRole: Literal["student", "teacher"] = "student"
    content: str
    subject: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    upvotes: List[str] = Field(default_factory=list)  # List of user IDs who upvoted
    upvoteCount: int = 0
    replies: List[str] = Field(default_factory=list)  # List of reply post IDs
    replyCount: int = 0
    parentId: Optional[str] = None  # For threaded replies
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "communityPosts"
        indexes = [
            "author",
            "subject",
            "parentId",
            "createdAt",
        ]

class Resource(Document):
    """Resource model"""
    id: str = Field(default_factory=lambda: str(ObjectId()))
    title: str
    subject: str
    topic: Optional[str] = None
    chapter: Optional[str] = None
    url: str
    description: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    grade: Optional[str] = None
    uploaded_by: str  # User ID
    createdByName: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "resources"
        indexes = [
            "subject",
            "topic",
            "chapter",
            "uploaded_by",
            "createdAt",
        ]

class Assignment(Document):
    """Assignment model"""
    id: str = Field(default_factory=lambda: str(ObjectId()))
    title: str
    subject: Optional[str] = None
    type: Literal["homework", "test"] = "homework"
    dueDate: Optional[str] = None  # ISO date string
    description: Optional[str] = None
    instructions: Optional[str] = None
    attachments: Optional[List[str]] = None
    studentIds: Optional[List[str]] = None  # List of assigned student IDs
    priority: Literal["low", "medium", "high"] = "medium"
    estimatedTime: Optional[int] = None  # minutes
    teacherId: str  # User ID of teacher
    classId: str
    status: Literal["active", "completed", "cancelled"] = "active"
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "assignments"
        indexes = [
            "teacherId",
            "classId",
            "type",
            "status",
            "dueDate",
        ]

# Additional models for existing functionality
class CheckIn(Document):
    """Daily check-in model"""
    id: str = Field(default_factory=lambda: str(ObjectId()))
    studentId: str
    date: str  # ISO date string (YYYY-MM-DD)
    mood: str
    stressLevel: int
    sleepHours: float
    energyLevel: int
    studyHours: float
    classesAttended: int
    win: Optional[str] = None
    blocker: Optional[str] = None
    mainMistake: Optional[str] = None
    criticalObservation: Optional[str] = None
    mainAchievement: Optional[str] = None
    planForTomorrow: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "checkins"
        indexes = [
            "studentId",
            "timestamp",
        ]

class Attendance(Document):
    """Attendance record model"""
    id: str = Field(default_factory=lambda: str(ObjectId()))
    teacherId: str
    classId: str
    date: str  # ISO date string
    records: List[dict]  # List of attendance records
    notes: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "attendance"
        indexes = [
            "teacherId",
            "classId",
            "date",
        ]

class Timetable(Document):
    """Timetable model"""
    id: str = Field(default_factory=lambda: str(ObjectId()))
    teacherId: str
    classId: str
    weekOf: str  # ISO date string for Monday of the week
    entries: List[dict]  # List of timetable entries
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "timetables"
        indexes = [
            "teacherId",
            "classId",
            "weekOf",
        ]

class PeerMessage(Document):
    """Peer messaging model"""
    id: str = Field(default_factory=lambda: str(ObjectId()))
    conversationId: str
    senderId: str
    senderName: str
    receiverId: str
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    read: bool = False
    type: str = "text"

    class Settings:
        name = "peerMessages"
        indexes = [
            "conversationId",
            "senderId",
            "receiverId",
            "timestamp",
        ]

class StudentSubmission(Document):
    """Student submission model"""
    id: str = Field(default_factory=lambda: str(ObjectId()))
    assignmentId: str
    studentId: str
    status: Literal["pending", "submitted", "completed", "late"] = "pending"
    submittedAt: Optional[datetime] = None
    grade: Optional[str] = None
    feedback: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "studentSubmissions"
        indexes = [
            "assignmentId",
            "studentId",
            "status",
        ]
