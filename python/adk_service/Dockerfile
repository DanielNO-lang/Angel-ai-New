FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
RUN pip install --no-cache-dir uv
COPY pyproject.toml ./
RUN uv sync --no-dev --no-cache
COPY main.py ./
ENV PORT=8080
EXPOSE 8080
CMD ["sh", "-c", "uv run uvicorn main:app --host 0.0.0.0 --port $PORT"]
