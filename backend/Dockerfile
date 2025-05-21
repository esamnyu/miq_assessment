# Try this updated Dockerfile that works in both contexts
FROM python:3.11-slim
WORKDIR /app

# Copy requirements - works whether building from root or backend dir
COPY requirements.txt /app/ 2>/dev/null || COPY ./backend/requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Install system dependencies
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy application code
COPY ./backend /app/

# Create a non-root user and switch to it
RUN adduser --disabled-password --gecos "" appuser
USER appuser

# Set environment variables
ENV PORT=8000
ENV PYTHONUNBUFFERED=1

# Command to run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]