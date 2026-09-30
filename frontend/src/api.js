// api.js — thin wrapper around the SemanticMatch backend REST API.
//
// Requests are sent to relative "/api/..." paths rather than an absolute
// URL. In development, Create React App's dev server proxies these to the
// backend via the "proxy" field in package.json. In the Docker/production
// build, nginx (see frontend/nginx.conf) proxies "/api/" to the backend
// container. Either way the browser only ever talks to its own origin.
import axios from "axios";

const client = axios.create({
  baseURL: "/api",
  timeout: 60000, // embedding a few hundred short items can take a little while on CPU
});

export async function checkHealth() {
  const { data } = await client.get("/health");
  return data;
}

/**
 * Computes pairwise semantic similarity between two lists of text items.
 * @param {string[]} itemsA
 * @param {string[]} itemsB
 * @returns {Promise<{items_a: string[], items_b: string[], matrix: number[][], pairs: object[], model_name: string, compute_time_ms: number}>}
 */
export async function matchItems(itemsA, itemsB) {
  const { data } = await client.post("/match", { items_a: itemsA, items_b: itemsB });
  return data;
}

export function extractErrorMessage(error) {
  if (error.response && error.response.data && error.response.data.detail) {
    const { detail } = error.response.data;
    if (Array.isArray(detail)) {
      // FastAPI/Pydantic validation error format
      return detail.map((d) => d.msg).join("; ");
    }
    return String(detail);
  }
  return error.message || "Something went wrong talking to the API.";
}
