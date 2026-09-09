// src/BackendWaking.js
import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import './BackendWaking.css';

// Elapsed time is kept outside the component. If the parent flips between
// loading and not-loading, this component unmounts and remounts, and local
// state would reset to zero every time -- so the explanation and the escape
// hatch below would never appear no matter how long the user actually waited.
const WAIT_KEY = 'narra:waitingSince';

function waitedSeconds() {
  try {
    const started = Number(sessionStorage.getItem(WAIT_KEY));
    if (!started) {
      sessionStorage.setItem(WAIT_KEY, String(Date.now()));
      return 0;
    }
    return Math.floor((Date.now() - started) / 1000);
  } catch (_) {
    return 0;
  }
}

export function clearWaitTimer() {
  try {
    sessionStorage.removeItem(WAIT_KEY);
  } catch (_) {
    /* private mode */
  }
}

/**
 * Shown while the app waits on its first backend response.
 *
 * The API and database are on free tiers that suspend when idle: Render sleeps
 * a web service after ~15 minutes and takes ~30s to wake, and Neon suspends
 * compute after ~5 minutes. A silent spinner during that window reads as a
 * broken site, so this explains what is happening and always offers a way out.
 */
function BackendWaking({ message = 'Getting things ready' }) {
  const { logout } = useAuth0();
  const [seconds, setSeconds] = useState(waitedSeconds);

  useEffect(() => {
    const id = setInterval(() => setSeconds(waitedSeconds()), 1000);
    return () => clearInterval(id);
  }, []);

  // Stay quiet at first: a warm server answers in well under a second, and
  // explaining a delay that never happened is noise.
  const isSlow = seconds >= 4;
  const isStuck = seconds >= 20;

  const handleReset = () => {
    // Clear cached routing state as well as the timer, since a stuck session
    // is usually stale local state rather than a slow server.
    try {
      localStorage.removeItem('userRole');
      localStorage.removeItem('userProfile');
      sessionStorage.clear();
    } catch (_) {
      /* private mode */
    }
    window.location.reload();
  };

  const handleSignOut = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (_) {
      /* private mode */
    }
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  return (
    <div className="waking-container" role="status" aria-live="polite">
      <div className="waking-card">
        <div className="waking-spinner" aria-hidden="true" />

        <h1 className="waking-title">{isSlow ? 'Waking up the server' : message}</h1>

        {isSlow && (
          <p className="waking-detail">
            This demo runs on free hosting, which puts the server to sleep when
            nobody is using it. The first request after a quiet spell takes
            about a minute while it starts back up. Later pages load normally.
          </p>
        )}

        {isSlow && <p className="waking-elapsed">Waiting {seconds}s</p>}

        {isStuck && (
          <>
            <p className="waking-detail">
              This is taking longer than it should. Reloading usually clears it;
              signing out will always get you back to a working page.
            </p>
            <div className="waking-actions">
              <button type="button" className="waking-retry" onClick={handleReset}>
                Reload
              </button>
              <button type="button" className="waking-retry" onClick={handleSignOut}>
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default BackendWaking;
