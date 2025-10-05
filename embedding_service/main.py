from typing import List

import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS
from pydantic import BaseModel, ValidationError, validator
from sentence_transformers import SentenceTransformer

MODEL_NAME = "all-MiniLM-L6-v2"
VECTOR_DIMENSION = 384

app = Flask(__name__)
CORS(
    app,
    origins=["http://localhost:4000", "http://127.0.0.1:4000"],
    supports_credentials=True,
)


class TextItem(BaseModel):
    name: str | None = None
    description: str | None = None

    @validator("name", "description", pre=True)
    def _normalize_field(cls, value):
        if value is None:
            return None
        if isinstance(value, str):
            return value
        if isinstance(value, (int, float, bool)):
            return str(value)
        if isinstance(value, bytes):
            try:
                return value.decode("utf-8")
            except UnicodeDecodeError:
                return value.decode("utf-8", errors="ignore")
        return str(value)

    @property
    def combined_text(self) -> str:
        name = (self.name or "").strip()
        description = (self.description or "").strip()
        parts = [text for text in (name, description) if text]
        return "\n\n".join(parts)


class EmbedRequest(BaseModel):
    items: List[TextItem]

    @validator("items", pre=True)
    def _coerce_items(cls, value):
        if value is None:
            raise ValueError("items payload is required")
        if isinstance(value, dict) or isinstance(value, TextItem):
            value = [value]
        elif not isinstance(value, list):
            raise ValueError("items must be an object or a list of objects")
        if not value:
            raise ValueError("items must not be an empty list")
        return value


class EmbeddingResult(BaseModel):
    embedding: List[float]
    dim: int


class EmbedResponse(BaseModel):
    results: List[EmbeddingResult]


# Load the embedding model once at startup
model = SentenceTransformer(MODEL_NAME)


@app.route("/ping", methods=["GET"])
def ping():
    """Simple health-check endpoint."""
    return jsonify({"status": "ok", "model": MODEL_NAME})


@app.route("/embed", methods=["POST"])
def embed_text():
    raw_payload = request.get_json(silent=True)
    if raw_payload is None:
        return jsonify({"detail": "Invalid or missing JSON payload"}), 400

    try:
        payload = EmbedRequest.parse_obj(raw_payload)
    except ValidationError as exc:
        return jsonify({"detail": exc.errors()}), 400

    items: List[TextItem] = payload.items
    texts: List[str] = []

    print("PAYLOAD:", payload)
    print("ITEMS:", items)

    for item in items:
        combined = item.combined_text
        if not combined:
            return (
                jsonify({"detail": "Each item must contain at least one non-empty field"}),
                400,
            )
        texts.append(combined)

    embeddings = model.encode(
        texts,
        convert_to_numpy=True,
        show_progress_bar=False,
        normalize_embeddings=False,
    )
    if embeddings.ndim == 1:
        embeddings = np.expand_dims(embeddings, axis=0)

    results: List[EmbeddingResult] = []
    for vector in embeddings:
        vector = vector.astype(np.float32, copy=False)
        dimension = vector.shape[0]
        if dimension != VECTOR_DIMENSION:
            dimension = int(dimension)
        results.append(
            EmbeddingResult(
                embedding=vector.tolist(),
                dim=dimension,
            )
        )

    response = EmbedResponse(results=results)
    return jsonify(response.dict())


@app.route("/", methods=["GET"])
def root():
    return jsonify({"message": "Embedding service is running", "model": MODEL_NAME})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
