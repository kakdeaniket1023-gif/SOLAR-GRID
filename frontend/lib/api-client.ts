/**
 * SolarGrid Centralized API Client
 * Configured for decoupled frontend (Cloudflare Pages) -> backend (Render) architecture.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export function getApiUrl(endpoint: string): string {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (!API_BASE_URL) {
    return cleanEndpoint;
  }
  return `${API_BASE_URL.replace(/\/$/, '')}${cleanEndpoint}`;
}

export async function apiClient(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const url = getApiUrl(endpoint);
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  return fetch(url, {
    ...options,
    credentials: options.credentials || 'include',
    headers: {
      ...defaultHeaders,
      ...(options.headers as Record<string, string>),
    },
  });
}
