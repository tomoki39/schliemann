export const resolveBackendBaseUrl = (): string => {
  const maybeImportMeta = typeof import.meta !== 'undefined' ? (import.meta as any) : undefined;
  const envUrl: string | undefined = maybeImportMeta?.env?.VITE_BACKEND_URL;

  if (envUrl && envUrl.trim().length > 0) {
    return envUrl;
  }

  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }

  return 'http://localhost:8000';
};

