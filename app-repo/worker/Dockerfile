# ─── Stage 1: Install dependencies ───────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ─── Stage 2: Production ─────────────────────────────────────
FROM python:3.12-slim AS runner

WORKDIR /app

# Create non-root user
RUN groupadd --system --gid 1001 worker && \
    useradd --system --uid 1001 --gid worker worker

# Copy installed packages
COPY --from=builder /install /usr/local

# Copy application code
COPY src/ ./src/

RUN chown -R worker:worker /app

USER worker

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

CMD ["python", "-m", "src.main"]
