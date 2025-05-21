FROM --platform=linux/amd64 python:3.11-slim

WORKDIR /app

# Copy requirements
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . /app/

# Create a non-root user and switch to it
RUN adduser --disabled-password --gecos "" appuser
RUN chown -R appuser:appuser /app
USER appuser

# Set environment variables
ENV PORT=8000
ENV PYTHONUNBUFFERED=1

# Command to run the application - Fixed to handle case sensitivity in log level
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]