/**
 * Resolves an image URL or path into a fully accessible URL.
 * Handles:
 * - Local blob URLs (blob:http://...)
 * - Data URLs (data:image/...)
 * - Full HTTP/HTTPS URLs (http://...)
 * - Relative backend paths (/api/public/uploads/...)
 */
export const getAccessibleImageUrl = (url?: string): string => {
  if (!url) return '';
  const trimmed = url.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  // Ensure leading slash
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  // Get base API URL from environment, default to http://localhost:8080/api
  const apiBase = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:8080/api';
  // Remove trailing /api or /api/ to get the server origin
  const serverOrigin = apiBase.replace(/\/api\/?$/, '');

  return `${serverOrigin}${path}`;
};
