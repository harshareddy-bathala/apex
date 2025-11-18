FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/app/.venv/bin:$PATH"

WORKDIR /app

RUN apt-get update \
    && apt-get install --no-install-recommends -y curl \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd --system app && useradd --system --gid app --home /app app

COPY requirements.txt ./

RUN python -m venv /opt/app/.venv \
    && /opt/app/.venv/bin/pip install --upgrade pip \
    && /opt/app/.venv/bin/pip install --no-cache-dir -r requirements.txt

COPY . .

USER app

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://127.0.0.1:8080/health || exit 1

CMD bash -c 'echo "$GOOGLE_SERVICE_ACCOUNT" | base64 -d > /tmp/gcloud-key.json && export GOOGLE_APPLICATION_CREDENTIALS=/tmp/gcloud-key.json && uvicorn main:app --host 0.0.0.0 --port 8080'
