/**
 * API client helper to handle authenticated requests with automatic token refresh.
 */

interface RequestOptions extends RequestInit {
  accessToken?: string | null;
  onTokenRefresh?: (newToken: string) => void;
  onLogout?: () => void;
}

export async function apiRequest(url: string, options: RequestOptions = {}) {
  const { accessToken, onTokenRefresh, onLogout, ...fetchOptions } = options;

  const headers = new Headers(fetchOptions.headers || {});
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  let response = await fetch(url, { ...fetchOptions, headers });

  // Handle 401 Unauthorized (Token expired)
  if (response.status === 401) {
    try {
      // Attempt silent refresh
      const refreshRes = await fetch("/api/auth/refresh", { method: "POST" });
      const refreshData = await refreshRes.json();
      
      if (refreshRes.ok && refreshData.accessToken) {
        const newAccessToken = refreshData.accessToken;
        
        // Notify context about the new token
        if (onTokenRefresh) onTokenRefresh(newAccessToken);

        // Retry the original request with the new token
        headers.set("Authorization", `Bearer ${newAccessToken}`);
        response = await fetch(url, { ...fetchOptions, headers });
      } else {
        // Refresh failed, logout
        if (onLogout) onLogout();
      }
    } catch (error) {
      console.error("API request refresh error:", error);
      if (onLogout) onLogout();
    }
  }

  return response;
}
