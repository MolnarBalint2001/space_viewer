from typing import List, Union

import numpy as np
from fastapi import Body, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
from sentence_transformers import SentenceTransformer

MODEL_NAME = "all-MiniLM-L6-v2"
VECTOR_DIMENSION = 384

app = FastAPI(title="Embedding Microservice", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4000", "http://127.0.0.1:4000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TextItem(BaseModel):
    name: str | None = None
    description: str | None = None

    @property
    def combined_text(self) -> str:
        name = (self.name or "").strip()
        description = (self.description or "").strip()
        parts = [text for text in (name, description) if text]
        return "\n\n".join(parts)


class EmbedRequest(BaseModel):
    items: Union[TextItem, List[TextItem]]

    @validator("items")
    def validate_items(cls, value: Union[TextItem, List[TextItem]]) -> List[TextItem]:
        if isinstance(value, list):
            if not value:
                raise ValueError("items must not be an empty list")
            return value
        if isinstance(value, TextItem):
            return [value]
        raise ValueError("Invalid items payload")


class EmbeddingResult(BaseModel):
    embedding: List[float]
    dim: int


class EmbedResponse(BaseModel):
    results: List[EmbeddingResult]


# Load the embedding model once at startup
model = SentenceTransformer(MODEL_NAME)


@app.get("/ping")
def ping() -> dict[str, str]:
    """Simple health-check endpoint."""
    return {"status": "ok", "model": MODEL_NAME}


@app.post("/embed", response_model=EmbedResponse)
def embed_text(payload: EmbedRequest = Body(...)) -> EmbedResponse:
    items: List[TextItem] = payload.items  # validated to list by model
    print("Hossz: " + len(items))
    texts: List[str] = []
    for item in items:
        combined = item.combined_text
        print("combined" + combined)
        if not combined:
            raise HTTPException(status_code=400, detail="Each item must contain at least one non-empty field")
        texts.append(combined)

    embeddings = model.encode(texts, convert_to_numpy=True, show_progress_bar=False, normalize_embeddings=False)
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

    return EmbedResponse(results=results)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Embedding service is running", "model": MODEL_NAME}
