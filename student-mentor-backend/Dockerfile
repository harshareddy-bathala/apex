FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8080
CMD bash -c 'echo "$GOOGLE_SERVICE_ACCOUNT" | base64 -d > /tmp/gcloud-key.json && export GOOGLE_APPLICATION_CREDENTIALS=/tmp/gcloud-key.json && uvicorn main:app --host 0.0.0.0 --port 8080'
