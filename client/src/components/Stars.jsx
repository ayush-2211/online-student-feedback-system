// Read-only star display that supports fractions (e.g. 4.3 fills 86% of the row)
export default function Stars({ value }) {
  const v = Number(value) || 0;
  return (
    <span className="stars" style={{ '--pct': `${(v / 5) * 100}%` }} role="img" aria-label={`${v.toFixed(1)} out of 5`}>
      ★★★★★
    </span>
  );
}
