import React from "react";

function scoreColor(score) {
  if (score >= 0.8) return "#2f855a"; // strong match — green
  if (score >= 0.6) return "#d69e2e"; // moderate — amber
  return "#a0aec0"; // weak — grey
}

/**
 * Ranked list of item pairs, already filtered to the current threshold and
 * sorted by score (the API returns them pre-sorted descending).
 */
export default function MatchList({ pairs }) {
  if (pairs.length === 0) {
    return <p className="match-list__empty">No pairs meet the current threshold. Try lowering it.</p>;
  }

  return (
    <ol className="match-list">
      {pairs.map((pair, idx) => (
        <li key={`${pair.a_index}-${pair.b_index}`} className="match-list__item">
          <div className="match-list__rank">#{idx + 1}</div>
          <div className="match-list__texts">
            <div className="match-list__text">
              <span className="match-list__label">A</span> {pair.a_text}
            </div>
            <div className="match-list__text">
              <span className="match-list__label">B</span> {pair.b_text}
            </div>
          </div>
          <div className="match-list__score-wrap">
            <div
              className="match-list__score-bar"
              style={{ width: `${pair.score * 100}%`, backgroundColor: scoreColor(pair.score) }}
            />
            <span className="match-list__score-text">{pair.score.toFixed(3)}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}
