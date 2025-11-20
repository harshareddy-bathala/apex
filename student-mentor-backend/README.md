# Student Mentor Backend

FastAPI service hosting the Google ADK (Agent Development Kit) multi-agent team and Firestore data access layer. This backend powers the Student Mentor AI system with intelligent, context-aware responses and comprehensive student data management.

## 🏗️ Architecture

### Tech Stack
- **FastAPI**: High-performance Python web framework
- **Google ADK 0.3**: Agent Development Kit for multi-agent orchestration
- **Firebase Admin SDK**: Server-side authentication and Firestore access
- **Google Cloud Firestore**: NoSQL database for persistent storage
- **Gemini 1.5 Flash**: Primary language model for AI agents

### Key Components
- `main.py` - FastAPI application with endpoints
- `agents.py` - ADK agent definitions and configurations
- `agent_team.py` - Multi-agent team orchestration
- `auth.py` - Firebase authentication middleware
- `db_fire_proxy.py` - Firestore data access layer
- `tools.py` - ADK tool definitions for agent capabilities
- `memory.py` - Agent memory and session management

## 🚀 Local Setup

### Prerequisites
- Python 3.11+
- Google Cloud Project with:
  - Firestore database (native mode)
  - Firebase Authentication enabled
  - Service account with Firestore and Firebase Admin permissions
- Gemini API key (from Google AI Studio or Vertex AI)

### Installation

```powershell
# Navigate to backend directory
cd student-mentor-backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
.\.venv\Scripts\Activate.ps1  # Windows PowerShell
# OR
source .venv/bin/activate      # Linux/Mac

# Install dependencies
pip install -r requirements.txt
```

### Configuration

Create a `.env` file in the `student-mentor-backend` directory:

```env
# Required: Gemini API Key
GOOGLE_API_KEY=<your-gemini-api-key>

# Required: Google Cloud credentials
GOOGLE_APPLICATION_CREDENTIALS=<absolute-path-to-service-account.json>

# Required: Firestore project
FIRESTORE_PROJECT_ID=<your-gcp-project-id>

# Optional: Gemini model selection
GEMINI_MODEL=gemini-1.5-flash

# Optional: Firebase credentials (if different from GOOGLE_APPLICATION_CREDENTIALS)
FIREBASE_CREDENTIALS_FILE=<optional-path-to-firebase-service-account.json>

# Optional: ADK configuration
ADK_TEMPERATURE=0.0
```

> **Note**: The Firebase Admin SDK reuses `GOOGLE_APPLICATION_CREDENTIALS` when `FIREBASE_CREDENTIALS_FILE` is not provided. The service account must have Firebase Admin, Firestore, and IAM permissions.

## 🎯 Running the Server

### Development Mode

```powershell
# Ensure virtual environment is activated
.\.venv\Scripts\Activate.ps1

# Start with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **Base URL**: `http://localhost:8000`
- **API Docs**: `http://localhost:8000/docs` (Swagger UI)
- **Alternative Docs**: `http://localhost:8000/redoc`

### Production Mode

```powershell
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## 🧪 Testing

### Run Tests

```powershell
# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_agents.py

# Run with coverage report
pytest --cov=. --cov-report=html
```

### Quick Smoke Test

```powershell
.venv\Scripts\Activate.ps1
pytest -q
```

## 📊 Data Model (v2)

The FastAPI service enforces Firebase Authentication on every endpoint and persists data in the following multi-tenant Firestore collections:

### Collections

| Collection | Document ID | Purpose |
| --- | --- | --- |
| `users` | `{uid}` | Canonical record for every authenticated user (`uid`, `email`, `role`). |
| `studentProfiles` | `{uid}` | Extended student metadata: goals, interests, onboarding answers. Document ID equals student's `uid`. |
| `teacherProfiles` | `{uid}` | Teacher-specific metadata and preferences, keyed by their `uid`. |
| `assignments` | Auto-generated | Tasks/tests created by teachers with owner info, class identifiers, due dates, etc. |
| `studentSubmissions` | Auto-generated | Join table linking students to assignments with `status`, `submittedAt`, completion tracking. |
| `checkins` | Auto-generated | Daily wellness/academic check-ins with mood, sleep, study time, physical activity, achievements. |

### Data Access

- All database operations go through `db_fire_proxy.py`
- Authentication enforced via `auth.py` middleware
- Multi-tenant data isolation by user `uid`
- Role-based access control (student vs teacher)

## 🔌 API Endpoints

### Authentication
- All endpoints require Firebase ID token in `Authorization` header
- Format: `Authorization: Bearer <firebase-id-token>`

### Main Endpoints
- `POST /chat` - AI agent chat with context awareness
- `GET /student/profile` - Get student profile
- `PUT /student/profile` - Update student profile
- `POST /checkin` - Submit daily check-in
- `GET /assignments` - List assignments
- `GET /submissions` - List student submissions

See `/docs` for complete API documentation.

## 🤖 AI Agents

The backend uses Google ADK to orchestrate multiple specialized agents:

### Agent Types
- **Student Mentor Agent**: Primary conversational agent
- **Academic Advisor**: Specialized in study strategies
- **Wellness Coach**: Mental health and stress management
- **Career Guide**: Long-term goal setting and planning

### Agent Configuration
- Defined in `agents.py`
- Uses Gemini 1.5 Flash model
- Context-aware with student profile and history
- Streaming responses for better UX

## 🔒 Security

### Authentication
- Firebase ID tokens validated on every request
- Service account permissions for Firestore access
- Environment variables for sensitive credentials

### Data Protection
- Multi-tenant isolation by user ID
- Role-based access control
- Firestore security rules (configured in GCP)
- No student data in logs or error messages

## 🚀 Deployment

### Docker

Build and run with Docker:

```bash
# Build image
docker build -t student-mentor-backend .

# Run container
docker run -p 8000:8000 \
  -e GOOGLE_API_KEY=<key> \
  -e GOOGLE_APPLICATION_CREDENTIALS=/app/service-account.json \
  -e FIRESTORE_PROJECT_ID=<project-id> \
  -v /path/to/service-account.json:/app/service-account.json \
  student-mentor-backend
```

### Google Cloud Run

1. Build and push to Container Registry:
```bash
gcloud builds submit --tag gcr.io/<project-id>/student-mentor-backend
```

2. Deploy to Cloud Run:
```bash
gcloud run deploy student-mentor-backend \
  --image gcr.io/<project-id>/student-mentor-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_API_KEY=<key>,FIRESTORE_PROJECT_ID=<project-id>
```

3. Set up service account for Firestore access

## 🛠️ Development

### Code Style
- Follow PEP 8 guidelines
- Use type hints
- Document functions with docstrings
- Keep functions focused and small

### Adding New Endpoints
1. Define route in `main.py`
2. Add authentication decorator
3. Implement business logic
4. Update Firestore schema if needed
5. Write tests in `tests/`

### Adding New Agents
1. Define agent in `agents.py`
2. Configure tools in `tools.py`
3. Update agent team orchestration
4. Test with sample conversations

## 📚 Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Google ADK Documentation](https://cloud.google.com/vertex-ai/docs/agent-builder)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Firestore Documentation](https://cloud.google.com/firestore/docs)

## 🐛 Troubleshooting

### Issue: ImportError for google.adk
**Solution**: Verify ADK installation
```bash
pip install google-adk==0.3.0
python -c "import google.adk; print(google.adk.__version__)"
```

### Issue: Firestore authentication failed
**Solution**: Check service account credentials
```bash
python -c "from google.cloud import firestore; client = firestore.Client(); print('Connected!')"
```

### Issue: Firebase token validation fails
**Solution**: Verify Firebase project ID matches in `.env` and frontend config

---

**Built with ❤️ to power intelligent student mentoring**
