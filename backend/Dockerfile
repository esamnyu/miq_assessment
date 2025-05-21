FROM python:3.11-slim
WORKDIR /app

# Copy requirements first, using the correct path
COPY ./backend/requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Install system dependencies
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy application code
COPY ./backend /app/

# Set environment variables
ENV PORT=8000
ENV PYTHONUNBUFFERED=1

# Command to run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]