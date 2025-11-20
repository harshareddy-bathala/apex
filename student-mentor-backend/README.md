# Student Mentor Backend Service

FastAPI backend service providing Firestore database operations for the Student Mentor AI application.

## Features

- RESTful API endpoints for database operations
- Google Cloud Firestore integration
- Health check endpoint for monitoring
- CORS enabled for frontend integration
- Docker containerized deployment

## Prerequisites

- Python 3.11+
- Google Cloud Firestore project
- Service account credentials (for production)

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
FIRESTORE_PROJECT_ID=your-project-id
```

For production, also configure:
- Google Cloud service account credentials (mounted or environment-based)

## Local Development

### Setup Virtual Environment

```bash
python -m venv .venv
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Linux/Mac
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Run Development Server

```bash
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Health Check
```
GET /health
```
Returns service status and timestamp.

### Query Documents
```
POST /get
Content-Type: application/json

{
  "collection": "collection_name",
  "filters": [
    {"field": "field_name", "op": "==", "value": "value"}
  ]
}
```

### Upsert Document
```
POST /upsert
Content-Type: application/json

{
  "collection": "collection_name",
  "doc_id": "document_id",
  "data": {
    "field": "value"
  }
}
```

## Docker Deployment

### Build Image

```bash
docker build -t student-mentor-backend .
```

### Run Container

```bash
docker run -p 8000:8000 \
  -e FIRESTORE_PROJECT_ID=your-project-id \
  student-mentor-backend
```

## DigitalOcean Deployment

This service is configured for DigitalOcean App Platform:

1. Ensure `Dockerfile` is in the repository root for this service
2. Configure environment variables in DigitalOcean dashboard
3. Set port to 8000
4. Mount Google Cloud credentials if using service account authentication

## Dependencies

- **fastapi**: Modern web framework for building APIs
- **uvicorn**: ASGI server for running FastAPI
- **google-cloud-firestore**: Official Firestore client library
- **protobuf**: Protocol buffer serialization (required by Firestore)

## Development Notes

- Default Firestore authentication uses Application Default Credentials (ADC)
- For local development, run `gcloud auth application-default login`
- Production uses service account credentials configured via environment
- CORS is configured to allow requests from the frontend application

## Health Monitoring

The `/health` endpoint returns:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000000"
}
```

Use this for uptime monitoring and load balancer health checks.
