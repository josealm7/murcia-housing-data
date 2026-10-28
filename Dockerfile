FROM python:3.12.16-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

COPY requirements-pipeline.txt ./requirements-pipeline.txt
RUN python -m pip install --no-cache-dir -r requirements-pipeline.txt

COPY src ./src

# Compose maps this UID to the workspace owner for writable bind mounts.
USER 1000:1000

ENTRYPOINT ["python", "-m", "src.pipeline.runner"]
CMD ["all"]
