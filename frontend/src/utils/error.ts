/**
 * Extracts a clear, user-friendly error message from an API or network error.
 * Handles Spring Boot validation errors (fieldErrors), custom API messages,
 * HTTP status errors, and network connection failures.
 */
export function extractErrorMessage(err: any, fallbackMessage: string = 'An unexpected error occurred'): string {
  if (!err) return fallbackMessage;

  // 1. Spring Boot MethodArgumentNotValidException field errors
  const fieldErrors = err.response?.data?.fieldErrors;
  if (fieldErrors && typeof fieldErrors === 'object' && Object.keys(fieldErrors).length > 0) {
    const errorDetails = Object.entries(fieldErrors)
      .map(([field, msg]) => {
        const formattedField = field.charAt(0).toUpperCase() + field.slice(1);
        return `${formattedField}: ${msg}`;
      })
      .join(', ');
    return errorDetails;
  }

  // 2. Explicit message returned from API response
  if (err.response?.data?.message && typeof err.response.data.message === 'string') {
    return err.response.data.message;
  }

  // 3. String response body (non-HTML)
  if (typeof err.response?.data === 'string' && err.response.data.trim() && !err.response.data.trim().startsWith('<')) {
    return err.response.data.trim();
  }

  // 4. Spring Boot generic 'error' field (e.g. "Bad Request", "Conflict")
  if (err.response?.data?.error && typeof err.response.data.error === 'string') {
    const statusText = err.response.status ? ` (Status ${err.response.status})` : '';
    return `${err.response.data.error}${statusText}`;
  }

  // 5. Network connection failures (backend server not running or unreachable)
  if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
    return 'Cannot connect to backend server. Please verify the backend is running on http://localhost:8080.';
  }

  if (err.code === 'ECONNABORTED' || err.message?.toLowerCase().includes('timeout')) {
    return 'Connection timed out. Please check your network and try again.';
  }

  // 6. Generic JS / Axios Error message
  if (err.message && typeof err.message === 'string') {
    return err.message;
  }

  return fallbackMessage;
}

