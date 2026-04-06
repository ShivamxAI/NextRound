# Use official Python image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your backend code
COPY . .

# Run FastAPI using uvicorn, pointing to the app module
CMD exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}