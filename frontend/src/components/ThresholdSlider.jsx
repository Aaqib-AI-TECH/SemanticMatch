import React from "react";

/**
 * Controls the minimum similarity score (0-1) a pair must have to show up
 * in the MatchList. Purely a filter on already-computed results — it never
 * triggers a new API call.
 */
export default function ThresholdSlider({ value, onChange, matchCount, totalCount }) {
  return (
    <div className="threshold-slider">
      <div className="threshold-slider__header">
        <label htmlFor="threshold">Similarity threshold</label>
        <span className="threshold-slider__value">{value.toFixed(2)}</span>
      </div>
      <input
        id="threshold"
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <p className="threshold-slider__hint">
        Showing {matchCount} of {totalCount} pairs at or above this threshold.
      </p>
    </div>
  );
}
