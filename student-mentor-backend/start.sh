#!/bin/bash
set -e

# Decode and write the service account JSON
if [ -n "$GOOGLE_SERVICE_ACCOUNT" ]; then
    echo "$GOOGLE_SERVICE_ACCOUNT" | base64 -d > /tmp/gcloud-key.json
    export GOOGLE_APPLICATION_CREDENTIALS=/tmp/gcloud-key.json
    echo "✓ Service account credentials configured"
else
    echo "⚠ Warning: GOOGLE_SERVICE_ACCOUNT not set"
fi

# Start the application
exec uvicorn main:app --host 0.0.0.0 --port 8080
