/**
 * Utility functions for URL handling with subdomain support
 */

/**
 * Get the base URL of the application
 * In production, this will be https://app.craftlyai.app
 * In development, this will be the current origin
 */
export const getBaseUrl = (): string => {
  if (typeof window === 'undefined') {
    // Server-side: use environment variable or default
    return process.env.VITE_APP_BASE_URL || 'https://app.craftlyai.app';
  }
  
  // Client-side: use current origin (will be app.craftlyai.app in production)
  return window.location.origin;
};

/**
 * Get the full app URL with hash route
 * @param route - The route path (e.g., '/dashboard', 'public/invoice/abc123')
 * @returns Full URL with hash route
 */
export const getAppUrl = (route: string): string => {
  const baseUrl = getBaseUrl();
  // Remove leading slash if present to avoid double slashes
  const cleanRoute = route.startsWith('/') ? route.slice(1) : route;
  return `${baseUrl}/#/${cleanRoute}`;
};

/**
 * Redirect to a specific route within the app
 * @param route - The route path (e.g., '/dashboard')
 */
export const redirectToApp = (route: string = '/dashboard'): void => {
  const url = getAppUrl(route);
  window.location.href = url;
};
