FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    poppler-utils \
    libpq-dev \
    gcc \
    antiword \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY app/ app/
COPY static/ static/

# Environment settings
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Use gunicorn with uvicorn workers for better production performance and stability
# It handles process management and multiple workers better than raw uvicorn.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "1"]
