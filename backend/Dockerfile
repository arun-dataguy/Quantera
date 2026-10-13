FROM python:3.11-slim

# Build tools needed for bcrypt (C extension) and asyncpg (libpq)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libffi-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first so this layer is cached on code-only changes
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Non-root user for security
RUN adduser --disabled-password --gecos "" appuser && chown -R appuser /app
USER appuser

# Cloud Run injects PORT at runtime (default 8080)
ENV PORT=8080
EXPOSE 8080

# 2 workers — handles concurrent signal/backtest requests within one container
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 2
