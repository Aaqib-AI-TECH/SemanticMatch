import React, { useMemo } from "react";
import Plot from "react-plotly.js";

// Truncates long item text for axis tick labels so the chart stays legible;
// the full text is still available in the hover tooltip.
function truncate(text, maxLen = 40) {
  if (!text) return "";
  return text.length > maxLen ? `${text.slice(0, maxLen - 1)}…` : text;
}

/**
 * Renders the full items_a x items_b similarity matrix as an interactive
 * Plotly heatmap. Rows = Instrument A items, columns = Instrument B items.
 */
export default function HeatmapChart({ itemsA, itemsB, matrix }) {
  const { xLabels, yLabels, hoverText } = useMemo(() => {
    const x = itemsB.map((t) => truncate(t));
    const y = itemsA.map((t) => truncate(t));
    const hover = itemsA.map((a) =>
      itemsB.map((b) => `A: ${a}<br>B: ${b}`)
    );
    return { xLabels: x, yLabels: y, hoverText: hover };
  }, [itemsA, itemsB]);

  if (!matrix || matrix.length === 0) return null;

  return (
    <div className="heatmap-chart">
      <Plot
        data={[
          {
            z: matrix,
            x: xLabels,
            y: yLabels,
            type: "heatmap",
            colorscale: "Viridis",
            zmin: 0,
            zmax: 1,
            text: hoverText,
            hovertemplate: "%{text}<br>Similarity: %{z:.3f}<extra></extra>",
            colorbar: { title: "Similarity" },
          },
        ]}
        layout={{
          title: "Similarity Heatmap",
          autosize: true,
          margin: { l: 160, r: 40, t: 50, b: 120 },
          xaxis: { title: "Instrument B", tickangle: -45, automargin: true },
          yaxis: { title: "Instrument A", automargin: true },
          paper_bgcolor: "transparent",
          plot_bgcolor: "transparent",
          font: { color: "#1a202c" },
        }}
        style={{ width: "100%", height: "480px" }}
        useResizeHandler
        config={{ responsive: true, displaylogo: false }}
      />
    </div>
  );
}
