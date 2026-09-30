"""
model.py — Sentence-BERT model wrapper.

Wraps a sentence-transformers model behind a small, testable interface so
app.py doesn't need to know anything about embeddings or PyTorch. The model
is loaded once (singleton) and reused across requests — loading it per
request would be far too slow for an interactive API.
"""
from __future__ import annotations

import logging
from functools import lru_cache
from typing import List

import numpy as np
from sentence_transformers import SentenceTransformer, util

logger = logging.getLogger("semanticmatch.model")

DEFAULT_MODEL_NAME = "all-MiniLM-L6-v2"


class SemanticMatcher:
    """Computes pairwise cosine similarity between two lists of text items
    using a Sentence-BERT sentence embedding model."""

    def __init__(self, model_name: str = DEFAULT_MODEL_NAME) -> None:
        self.model_name = model_name
        logger.info("Loading Sentence-BERT model '%s' (first load downloads ~90MB)...", model_name)
        self.model = SentenceTransformer(model_name)
        logger.info("Model '%s' loaded.", model_name)

    def embed(self, items: List[str]) -> np.ndarray:
        """Encodes a list of text items into normalized sentence embeddings."""
        return self.model.encode(items, convert_to_numpy=True, normalize_embeddings=True)

    def similarity_matrix(self, items_a: List[str], items_b: List[str]) -> np.ndarray:
        """Returns an (len(items_a) x len(items_b)) matrix of cosine similarity
        scores in [-1, 1] (in practice close to [0, 1] for natural language)."""
        embeddings_a = self.embed(items_a)
        embeddings_b = self.embed(items_b)
        # util.cos_sim handles the normalization-aware dot product efficiently
        # and returns a torch tensor; convert to a plain numpy array for the
        # rest of the app so it has no PyTorch-specific types to deal with.
        matrix = util.cos_sim(embeddings_a, embeddings_b).numpy()
        return matrix


@lru_cache(maxsize=1)
def get_matcher(model_name: str = DEFAULT_MODEL_NAME) -> SemanticMatcher:
    """Returns the process-wide singleton SemanticMatcher, loading it on
    first call. lru_cache makes this both a singleton and thread-safe-enough
    for FastAPI's default single-worker dev usage."""
    return SemanticMatcher(model_name)
