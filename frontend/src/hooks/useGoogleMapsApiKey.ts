import { useEffect, useState } from 'react';
import { resolveBackendBaseUrl } from '../services/serviceConfig';

interface GoogleMapsApiKeyState {
  apiKey?: string;
  loading: boolean;
  error?: string;
}

const backendBaseUrl = resolveBackendBaseUrl();
let cachedApiKey: string | null | undefined = undefined;
let pendingRequest: Promise<string | null> | null = null;

const fetchApiKey = async (): Promise<string | null> => {
  if (cachedApiKey !== undefined) {
    return cachedApiKey;
  }

  if (!pendingRequest) {
    pendingRequest = fetch(`${backendBaseUrl}/api/config/google-maps`)
      .then(async (response) => {
        if (!response.ok) {
          if (response.status === 404) {
            return null;
          }
          const message = await response.text();
          throw new Error(message || 'Failed to fetch Google Maps API key');
        }
        const data = await response.json();
        return data?.apiKey ?? null;
      })
      .then((apiKey) => {
        cachedApiKey = apiKey;
        return apiKey;
      })
      .catch((error) => {
        cachedApiKey = null;
        throw error;
      })
      .finally(() => {
        pendingRequest = null;
      });
  }

  return pendingRequest;
};

const buildInitialState = (): GoogleMapsApiKeyState => {
  if (cachedApiKey !== undefined) {
    return {
      apiKey: cachedApiKey ?? undefined,
      loading: false,
      error: cachedApiKey ? undefined : 'Google Maps API key is not configured',
    };
  }
  return { loading: true };
};

export const useGoogleMapsApiKey = (): GoogleMapsApiKeyState => {
  const [state, setState] = useState<GoogleMapsApiKeyState>(buildInitialState);

  useEffect(() => {
    if (cachedApiKey !== undefined) {
      return;
    }

    let cancelled = false;

    fetchApiKey()
      .then((apiKey) => {
        if (cancelled) {
          return;
        }
        setState({
          apiKey: apiKey ?? undefined,
          loading: false,
          error: apiKey ? undefined : 'Google Maps API key is not configured',
        });
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        setState({
          apiKey: undefined,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load Google Maps API key',
        });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
};

