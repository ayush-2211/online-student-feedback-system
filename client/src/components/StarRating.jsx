import { useState } from 'react';

export const RATING_LABELS = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

// Interactive 1-5 star input (radio group, so it is usable with a keyboard and screen readers)
export default function StarRating({ value, onChange, labelledBy }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div className="star-input" role="radiogroup" aria-labelledby={labelledBy}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} out of 5, ${RATING_LABELS[n - 1]}`}
          className={n <= shown ? 'on' : ''}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
        >
          ★
        </button>
      ))}
      <span className="star-label">{shown ? `${shown}/5 ${RATING_LABELS[shown - 1]}` : 'Not rated yet'}</span>
    </div>
  );
}
