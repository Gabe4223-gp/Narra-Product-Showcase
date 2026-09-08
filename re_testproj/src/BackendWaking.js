// src/BackendWaking.js
import React, { useState, useEffect } from 'react';
import './BackendWaking.css';

/**
 * Shown while the app waits on its first backend response.
 *
 * The API and database are on free tiers that suspend when idle: Render
 * sleeps a web service after ~15 minutes and takes ~30s to wake, and Neon
 * suspends compute after ~5 minutes. A silent spinner during that window
 * reads as a broken site, so this explains what is happening and keeps a
 * visible elapsed count.
 */
function BackendWaking({ message = 'Getting things ready' }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Stay quiet for the first few seconds: a warm server answers in well
  // under a second, and explaining a delay that never happened is noise.
  const isSlow = seconds >= 4;
  const isVerySlow = seconds >= 45;

  return (
    <div className="waking-container" role="status" aria-live="polite">
      <div className="waking-card">
        <div className="waking-spinner" aria-hidden="true" />

        <h1 className="waking-title">
          {isSlow ? 'Waking up the server' : message}
        </h1>

        {isSlow && (
          <p className="waking-detail">
            This demo runs on free hosting, which puts the server to sleep when
            nobody is using it. The first request after a quiet spell takes
            about a minute while it starts back up. Later pages load normally.
          </p>
        )}

        {isSlow && (
          <p className="waking-elapsed">
            Waiting {seconds}s
          </p>
        )}

        {isVerySlow && (
          <button
            type="button"
            className="waking-retry"
            onClick={() => window.location.reload()}
          >
            Reload the page
          </button>
        )}
      </div>
    </div>
  );
}

export default BackendWaking;
