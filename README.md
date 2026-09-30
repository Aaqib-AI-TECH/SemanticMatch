# SemanticMatch

**A Sentence-BERT powered tool for harmonising research variables across survey and questionnaire instruments.**

[![Python 3.11](https://img.shields.io/badge/python-3.11-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688.svg)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED.svg)](https://docs.docker.com/compose/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#license)

## Motivation

Researchers combining data across studies routinely face the same problem: two instruments measure
the same construct but word their items differently. "*Little interest or pleasure in doing
things*" (PHQ-9) and "*Anhedonia / loss of interest in activities*" (a paraphrased item pool) are
conceptually the same variable, but a keyword search or manual read-through won't reliably surface
that match across a 50+ item codebook — and doing it by hand across multiple datasets doesn't scale.

**SemanticMatch** uses a Sentence-BERT sentence embedding model to compute semantic similarity
between two lists of items and surfaces the strongest candidate matches, turning a tedious manual
harmonisation pass into a few seconds of embedding + cosine similarity.

This is a portfolio project demonstrating a complete, containerised full-stack ML application: a
Python/FastAPI backend serving a `sentence-transformers` model behind a REST API, and a React
front-end visualising the results interactively with Plotly.

## Architecture

```
┌──────────────────────┐       HTTP (JSON)        ┌───────────────────────────┐
│   React front-end     │  ───────────────────────▶ │   FastAPI back-end         │
│   (nginx in Docker)    │  POST /api/match          │   (uvicorn)                 │
│                        │  GET  /api/health          │                             │
│  • InputPanel × 2      │ ◀─────────────────────────│  • app.py   (routes)        │
│  • ThresholdSlider     │     similarity matrix      │  • model.py (Sentence-BERT) │
│  • HeatmapChart        │     + ranked pairs         │                             │
│  • MatchList           │                            │  sentence-transformers      │
└──────────────────────┘                             │  all-MiniLM-L6-v2 (384-dim) │
                                                        └───────────────────────────┘

   docker-compose.yml wires both containers together on one network;
   nginx proxies /api/* from the frontend container to the backend container.
```

**Request flow for a comparison:**
1. User pastes Instrument A items and Instrument B items (one per line) and clicks **Compare**.
2. The front-end POSTs both lists to `/api/match`.
3. The backend encodes every item with `all-MiniLM-L6-v2`, L2-normalises the embeddings, and
   computes the full pairwise cosine similarity matrix (`len(A) × len(B)`).
4. The API returns the matrix plus every pair pre-sorted by score, descending.
5. The front-end renders the matrix as a Plotly heatmap and the sorted pairs as a ranked list,
   both filterable live by a similarity-threshold slider (client-side only — no re-computation).

## Tech stack

| Layer | Technology |
|---|---|
| NLP / embeddings | [sentence-transformers](https://www.sbert.net/) (`all-MiniLM-L6-v2`), PyTorch |
| Backend API | FastAPI, Pydantic, Uvicorn |
| Frontend | React 18, [react-plotly.js](https://github.com/plotly/react-plotly.js) / Plotly.js, Axios |
| Containerisation | Docker, Docker Compose, nginx (serving the production React build + API proxy) |

## Project structure

```
semantic-match/
├── README.md
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app.py              # FastAPI application (routes, request/response models)
│   └── model.py             # Sentence-BERT model wrapper (singleton, similarity computation)
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf           # Production reverse proxy config (/api → backend container)
│   ├── package.json
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.jsx                # Main app component / state management
│       ├── components/
│       │   ├── InputPanel.jsx      # Text input area for one instrument
│       │   ├── HeatmapChart.jsx    # Plotly similarity heatmap
│       │   ├── MatchList.jsx       # Ranked match results
│       │   └── ThresholdSlider.jsx # Client-side score filter
│       ├── api.js           # API calls to backend (axios)
│       ├── index.js
│       └── App.css
└── examples/
    └── sample_data.json     # Example PHQ-9 vs. paraphrased-items demo data
```

## Setup

### Option 1 — Docker (recommended)

Requires [Docker](https://www.docker.com/) and Docker Compose.

```bash
cd semantic-match
docker compose up --build
```

- Frontend: **http://localhost:3000**
- Backend API docs (Swagger UI): **http://localhost:8000/docs**

The first build bakes the `all-MiniLM-L6-v2` model into the backend image, so subsequent
`docker compose up` runs start instantly with no network dependency.

### Option 2 — Manual (local dev)

**Backend:**
```bash
cd semantic-match/backend
python -m venv .venv
.venv\Scripts\activate        # Windows PowerShell
# source .venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```
The first request downloads `all-MiniLM-L6-v2` (~90MB) from Hugging Face Hub and caches it locally.

**Frontend** (separate terminal):
```bash
cd semantic-match/frontend
npm install
npm start
```
Create React App's dev server proxies `/api/*` requests to `http://localhost:8000` automatically
(see the `"proxy"` field in `package.json`) — no CORS configuration needed for local dev.

Open **http://localhost:3000**.

## Example usage

1. Click **Load example** to populate both panels with PHQ-9 items (Instrument A) vs. a
   paraphrased depression/anxiety item pool (Instrument B) — see [`examples/sample_data.json`](examples/sample_data.json)
   for the same data in raw form.
2. Click **Compare**. Within a few seconds you'll see:
   - A 9×9 heatmap, with the diagonal-ish band of bright cells showing the true conceptual
     matches (e.g. *"Little interest or pleasure..."* ↔ *"Anhedonia / loss of interest..."*
     scoring ~0.7-0.8+).
   - A ranked list of every pair above the threshold, highest similarity first.
3. Drag the **threshold slider** to tighten or loosen what counts as a "match" — this re-filters
   instantly without calling the API again.
4. Try it with your own instruments: paste any two item lists, one item per line, and click
   **Compare**.

You can also call the API directly:
```bash
curl -X POST http://localhost:8000/api/match \
  -H "Content-Type: application/json" \
  -d '{
        "items_a": ["Little interest or pleasure in doing things"],
        "items_b": ["Anhedonia / loss of interest in activities", "Trouble sleeping"]
      }'
```

## Screenshots

> _Add screenshots after your first run — suggested shots below._

| Input screen | Heatmap + ranked matches |
|---|---|
| `docs/screenshot-input.png` | `docs/screenshot-results.png` |

## Notes on the model

`all-MiniLM-L6-v2` is a compact (384-dimension) general-purpose sentence embedding model — a good
default for a demo: fast on CPU, ~90MB, no GPU required. For production research use, consider a
domain-tuned biomedical/clinical sentence embedding model (e.g. a PubMedBERT- or SciBERT-based
sentence encoder) for better separation between clinically-distinct-but-lexically-similar items.
The backend accepts an optional `model_name` field in `/api/match` if you want to experiment with
swapping models without changing code.

## License

MIT — see [LICENSE](LICENSE).
