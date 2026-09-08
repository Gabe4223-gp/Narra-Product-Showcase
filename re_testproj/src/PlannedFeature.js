import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PlannedFeature.css';

/**
 * Shared placeholder for modules that are designed but not built.
 *
 * The sidebar advertises Accountings, Tax Filing and General Ledger. Without a
 * route, those links fell through to the catch-all and silently returned the
 * user to the dashboard, which reads as a broken link rather than unfinished
 * work. This states the scope plainly instead.
 */
function PlannedFeature({ title, summary, planned = [], relatedLabel, relatedPath }) {
  const navigate = useNavigate();

  return (
    <div className="planned-feature">
      <div className="planned-card">
        <span className="planned-badge">Planned</span>

        <h1 className="planned-title">{title}</h1>
        <p className="planned-summary">{summary}</p>

        {planned.length > 0 && (
          <>
            <h2 className="planned-subhead">What this module will do</h2>
            <ul className="planned-list">
              {planned.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </>
        )}

        <p className="planned-note">
          This is a portfolio build. The property, tenant, billing, maintenance
          and work-portal modules are fully functional; the accounting suite is
          scoped but not yet implemented.
        </p>

        <div className="planned-actions">
          <button
            type="button"
            className="planned-btn-primary"
            onClick={() => navigate('/homepage')}
          >
            Back to dashboard
          </button>
          {relatedLabel && relatedPath && (
            <button
              type="button"
              className="planned-btn-secondary"
              onClick={() => navigate(relatedPath)}
            >
              {relatedLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default PlannedFeature;
