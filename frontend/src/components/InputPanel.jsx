import React from "react";

/**
 * A single labelled textarea for pasting one instrument's items, one per
 * line. Parsing (splitting into a clean array) is left to the parent so the
 * parent always has a single source of truth for "how many items".
 */
export default function InputPanel({ title, placeholder, value, onChange, itemCount }) {
  return (
    <div className="input-panel">
      <div className="input-panel__header">
        <h3>{title}</h3>
        <span className="input-panel__count">{itemCount} item{itemCount === 1 ? "" : "s"}</span>
      </div>
      <textarea
        className="input-panel__textarea"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
      />
      <p className="input-panel__hint">One item per line.</p>
    </div>
  );
}
