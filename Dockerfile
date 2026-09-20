FROM python:3.11-slim

WORKDIR /app

# System dependencies skipped due to network 403 errors, using pre-built python wheels
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONPATH=/app
