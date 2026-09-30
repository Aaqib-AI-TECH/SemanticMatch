"""
app.py — SemanticMatch FastAPI application.

Exposes two endpoints:
  GET  /api/health  — liveness/readiness check
  POST /api/match    — pairwise semantic similarity between two item lists

Run directly with:
    uvicorn app:app --reload --port 8000
"""
from __future__ import annotations

import logging
import time
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from model import DEFAULT_MODEL_NAME, get_matcher

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s — %(message)s")
logger = logging.getLogger("semanticmatch.api")

app = FastAPI(
    title="SemanticMatch API",
    description="Sentence-BERT powered semantic similarity matching for research variable harmonisation.",
    version="1.0.0",
)

# CORS is wide-open here because this is a portfolio/demo project meant to be
# run locally or in a single docker-compose network. Lock this down to
# specific origins before deploying anywhere public.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_ITEMS_PER_LIST = 200


class MatchRequest(BaseModel):
    items_a: List[str] = Field(..., description="First list of text items (e.g. Instrument A questions).")
    items_b: List[str] = Field(..., description="Second list of text items (e.g. Instrument B questions).")
    model_name: Optional[str] = Field(
        default=None, description=f"Sentence-transformers model to use (defaults to {DEFAULT_MODEL_NAME})."
    )

    @field_validator("items_a", "items_b")
    @classmethod
    def _non_empty_items(cls, value: List[str]) -> List[str]:
        cleaned = [v.strip() for v in value if v is not None and v.strip()]
        if not cleaned:
            raise ValueError("list must contain at least one non-empty text item")
        if len(cleaned) > MAX_ITEMS_PER_LIST:
            raise ValueError(f"list must contain at most {MAX_ITEMS_PER_LIST} items")
        return cleaned


class MatchPair(BaseModel):
    a_index: int
    b_index: int
    a_text: str
    b_text: str
    score: float


class MatchResponse(BaseModel):
    items_a: List[str]
    items_b: List[str]
    matrix: List[List[float]]
    pairs: List[MatchPair]
    model_name: str
    compute_time_ms: float


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "semanticmatch-api"}


@app.post("/api/match", response_model=MatchResponse)
async def match_items(payload: MatchRequest):
    model_name = payload.model_name or DEFAULT_MODEL_NAME

    try:
        matcher = get_matcher(model_name)
    except Exception as exc:  # noqa: BLE001 — surface model load failures as a clean 500, not a stack trace
        logger.exception("Failed to load model '%s'", model_name)
        raise HTTPException(status_code=500, detail=f"Failed to load model '{model_name}': {exc}") from exc

    start = time.perf_counter()
    try:
        matrix = matcher.similarity_matrix(payload.items_a, payload.items_b)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Similarity computation failed")
        raise HTTPException(status_code=500, detail=f"Similarity computation failed: {exc}") from exc
    elapsed_ms = (time.perf_counter() - start) * 1000

    pairs = [
        MatchPair(
            a_index=i,
            b_index=j,
            a_text=payload.items_a[i],
            b_text=payload.items_b[j],
            score=float(matrix[i][j]),
        )
        for i in range(len(payload.items_a))
        for j in range(len(payload.items_b))
    ]
    pairs.sort(key=lambda p: p.score, reverse=True)

    return MatchResponse(
        items_a=payload.items_a,
        items_b=payload.items_b,
        matrix=matrix.tolist(),
        pairs=pairs,
        model_name=model_name,
        compute_time_ms=round(elapsed_ms, 2),
    )
