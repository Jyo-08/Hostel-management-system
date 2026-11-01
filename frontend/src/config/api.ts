/**
 * Centralized API Configuration for HostelOS Frontend
 * Supports Vite environment variables (VITE_API_URL / VITE_API_BASE_URL)
 * and defaults to the deployed Render backend in production.
 */

export const PRODUCTION_API_URL = 'https://hostel-management-system-s821.onrender.com';

export const getApiBaseUrl = (): string => {
  // 1. Check custom override from localStorage if valid
  const saved = localStorage.getItem('hostelos_api_url');
  if (saved && saved.trim()) {
    const cleaned = saved.trim().replace(/\/+$/, '');
    // If saved value is an obsolete localhost URL in a production environment, ignore it
    const isLocalhost = cleaned.includes('localhost') || cleaned.includes('127.0.0.1');
    if (!import.meta.env.PROD || !isLocalhost) {
      return cleaned;
    }
  }

  // 2. Check Vite environment variable
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // 3. Fallback to deployed Render backend URL
  return PRODUCTION_API_URL;
};

export const setApiBaseUrl = (url: string): void => {
  const cleaned = url.trim().replace(/\/+$/, '');
  localStorage.setItem('hostelos_api_url', cleaned);
};

export const resetApiBaseUrl = (): void => {
  localStorage.removeItem('hostelos_api_url');
};
