FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy and install requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install requests pydantic-settings

# Copy app
COPY . .

# Expose HuggingFace Spaces port
EXPOSE 7860

# Start server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]