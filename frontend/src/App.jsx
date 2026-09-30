import React, { useMemo, useState } from "react";
import InputPanel from "./components/InputPanel";
import ThresholdSlider from "./components/ThresholdSlider";
import HeatmapChart from "./components/HeatmapChart";
import MatchList from "./components/MatchList";
import { matchItems, extractErrorMessage } from "./api";

// A small built-in example so first-time visitors can see the tool working
// without hunting for their own data. Mirrors examples/sample_data.json.
const SAMPLE_A = ["Little interest or pleasure in doing things", "Feeling down, depressed, or hopeless", "Trouble falling or staying asleep, or sleeping too much", "Feeling tired or having little energy", "Poor appetite or overeating"];
const SAMPLE_B = ["Anhedonia / loss of interest in activities", "Depressed mood most of the day", "Insomnia or hypersomnia nearly every day", "Fatigue or loss of energy", "Feeling nervous, anxious, or on edge"];

function parseItems(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export default function App() {
  const [textA, setTextA] = useState("");
  const [textB, setTextB] = useState("");
  const [threshold, setThreshold] = useState(0.5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const itemsA = useMemo(() => parseItems(textA), [textA]);
  const itemsB = useMemo(() => parseItems(textB), [textB]);

  const canCompare = itemsA.length > 0 && itemsB.length > 0 && !loading;

  const filteredPairs = useMemo(() => {
    if (!result) return [];
    return result.pairs.filter((p) => p.score >= threshold);
  }, [result, threshold]);

  async function handleCompare() {
    setLoading(true);
    setError(null);
    try {
      const data = await matchItems(itemsA, itemsB);
      setResult(data);
    } catch (err) {
      setError(extractErrorMessage(err));
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  function loadSample() {
    setTextA(SAMPLE_A.join("\n"));
    setTextB(SAMPLE_B.join("\n"));
    setResult(null);
    setError(null);
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>SemanticMatch</h1>
        <p>
          Paste two lists of survey or questionnaire items and find conceptually equivalent variables
          using Sentence-BERT semantic similarity.
        </p>
      </header>

      <main className="app__main">
        <section className="app__inputs">
          <InputPanel
            title="Instrument A"
            placeholder="Little interest or pleasure in doing things&#10;Feeling down, depressed, or hopeless&#10;..."
            value={textA}
            onChange={setTextA}
            itemCount={itemsA.length}
          />
          <InputPanel
            title="Instrument B"
            placeholder="Anhedonia / loss of interest in activities&#10;Depressed mood most of the day&#10;..."
            value={textB}
            onChange={setTextB}
            itemCount={itemsB.length}
          />
        </section>

        <div className="app__actions">
          <button className="btn btn--secondary" type="button" onClick={loadSample} disabled={loading}>
            Load example
          </button>
          <button className="btn btn--primary" type="button" onClick={handleCompare} disabled={!canCompare}>
            {loading ? "Comparing…" : "Compare"}
          </button>
        </div>

        {loading && (
          <div className="app__loading">
            <div className="spinner" />
            <p>Encoding {itemsA.length + itemsB.length} items and computing similarity…</p>
          </div>
        )}

        {error && <div className="app__error">⚠ {error}</div>}

        {result && !loading && (
          <section className="app__results">
            <div className="app__results-meta">
              Model: <code>{result.model_name}</code> · Computed in {result.compute_time_ms} ms ·{" "}
              {result.items_a.length} × {result.items_b.length} pairs
            </div>

            <HeatmapChart itemsA={result.items_a} itemsB={result.items_b} matrix={result.matrix} />

            <ThresholdSlider
              value={threshold}
              onChange={setThreshold}
              matchCount={filteredPairs.length}
              totalCount={result.pairs.length}
            />

            <MatchList pairs={filteredPairs} />
          </section>
        )}
      </main>

      <footer className="app__footer">
        <p>
          SemanticMatch — built with FastAPI, Sentence-BERT (<code>all-MiniLM-L6-v2</code>), React &amp; Plotly.
        </p>
      </footer>
    </div>
  );
}
