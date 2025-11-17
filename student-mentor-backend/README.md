# Student Mentor Backend

Python FastAPI service hosting the Google ADK multi-agent team and Firestore data access layer.

## Local Setup

```powershell
cd student-mentor-backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create a `.env` file with:

```
GOOGLE_API_KEY=<gemini key>
GOOGLE_APPLICATION_CREDENTIALS=<absolute path to firestore service account json>
GEMINI_MODEL=gemini-1.5-flash
FIRESTORE_PROJECT_ID=<gcp project id>
FIREBASE_CREDENTIALS_FILE=<optional path if different from GOOGLE_APPLICATION_CREDENTIALS>
```

> The Firebase Admin SDK reuses `GOOGLE_APPLICATION_CREDENTIALS` when `FIREBASE_CREDENTIALS_FILE` is not provided. The service account must have Firebase Admin, Firestore, and IAM permissions.

## Run

```powershell
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Quick smoke commands

```powershell
.venv\Scripts\Activate.ps1
uvicorn main:app --reload --host 0.0.0.0 --port 8000
pytest -q
```

## Data Model (v2)

The FastAPI service now enforces Firebase Authentication on every endpoint and persists data in the following multi-tenant Firestore collections:

| Collection | Purpose |
| --- | --- |
| `users` | Canonical record for every authenticated user (`uid`, `email`, `role`). |
| `studentProfiles` | Extended student metadata such as goals, interests, onboarding answers. The document ID equals the student's `uid`. |
| `teacherProfiles` | Teacher-specific metadata keyed by their `uid`. |
| `assignments` | Tasks/tests created by teachers. Stores owner info, class identifiers, due dates, etc. |
| `studentSubmissions` | Join table linking students to assignments with `status`, `submittedAt`, etc. |
| `checkins` | Daily wellness/academic check-ins created by students and summarized for agents. |

Agents and HTTP APIs should only read/write through this schema going forward.
