# --- SemanticMatch backend image -------------------------------------------
# Python 3.11 slim base keeps the image reasonably small; torch + sentence-
# transformers still make this a multi-hundred-MB image, which is normal for
# an ML-serving container.
FROM python:3.11-slim

WORKDIR /app

# Install CPU-only torch first via the dedicated index so the image doesn't
# pull down unnecessary CUDA wheels (large, and useless without a GPU in the
# container). Falls back gracefully to requirements.txt's pin either way.
COPY requirements.txt .
RUN pip install --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cpu -r requirements.txt

COPY . .

# Bake the Sentence-BERT model into the image at build time so the container
# doesn't need network access to Hugging Face Hub on every cold start.
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
