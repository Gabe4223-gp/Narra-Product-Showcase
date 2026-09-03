import { useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

/**
 * Returns fetch/axios-style helpers that attach a real Auth0 access token.
 *
 * Use this for any endpoint the backend protects with requireAuth: sending
 * mail, bulk deletes, and payment intents.
 *
 * Note: getAccessTokenSilently() is called with no arguments on purpose. The
 * audience and scope are already configured on Auth0Provider in index.js, and
 * auth0-react v2 expects them under authorizationParams rather than at the top
 * level -- passing them the old v1 way silently yields a token for the wrong
 * audience, which the API then rejects.
 */
export default function useAuthedRequest() {
  const { getAccessTokenSilently, isAuthenticated } = useAuth0();

  const getToken = useCallback(async () => {
    if (!isAuthenticated) {
      throw new Error('You need to be signed in to do that.');
    }
    return getAccessTokenSilently();
  }, [getAccessTokenSilently, isAuthenticated]);

  // Drop-in replacement for fetch() on protected endpoints.
  const authedFetch = useCallback(
    async (url, options = {}) => {
      const token = await getToken();
      return fetch(url, {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${token}`,
        },
      });
    },
    [getToken]
  );

  // For axios calls: await authHeaders() and spread into the config.
  const authHeaders = useCallback(async () => {
    const token = await getToken();
    return { headers: { Authorization: `Bearer ${token}` } };
  }, [getToken]);

  return { authedFetch, authHeaders, getToken };
}
