FROM python:3.11-slim

# Instalar dependencias del sistema necesarias para compilar
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código fuente
COPY app/ ./app/

# Crear script de healthcheck
RUN echo '#!/bin/bash\npython -c "import httpx; httpx.get(\"http://localhost:8000/api/v1/health\")" || exit 1' > /healthcheck.sh \
    && chmod +x /healthcheck.sh

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/v1/health')" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
