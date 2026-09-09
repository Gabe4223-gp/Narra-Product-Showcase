import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PlannedFeature.css';

/**
 * Placeholder for modules that are scoped but not built.
 *
 * Deliberately plain: same page background, card, shadow and type scale as
 * Billings, so a visitor reads it as part of the same product rather than a
 * separate notice screen.
 */
function PlannedFeature({ title, items = [] }) {
  const navigate = useNavigate();

  return (
    <div className="planned-page">
      <h1>{title}</h1>

      <div className="planned-container">
        <p className="planned-lead">This section will give you:</p>

        <ul className="planned-list">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <div className="planned-actions">
          <button type="button" onClick={() => navigate('/homepage')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default PlannedFeature;
