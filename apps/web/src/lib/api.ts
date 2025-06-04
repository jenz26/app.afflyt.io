/**
 * API Client for Afflyt.io Frontend
 * Handles communication between Next.js frontend and Express backend
 * 
 * @version 1.5.0
 * @phase Frontend-Backend Integration
 */

// Types for API responses and requests
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

class AfflytApiError extends Error {
  public status: number;
  public code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'AfflytApiError';
    this.status = status;
    this.code = code;
  }
}

interface RequestOptions {
  token?: string;
  headers?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor() {
    // Use environment variable for API URL, fallback to localhost for development
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  /**
   * Build complete URL for API endpoint
   */
  private buildUrl(endpoint: string): string {
    // Remove leading slash if present to avoid double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${this.baseUrl}/${cleanEndpoint}`;
  }

  /**
   * Build headers for the request
   */
  private buildHeaders(options?: RequestOptions): Record<string, string> {
    const headers = { ...this.defaultHeaders };

    // Add authorization header if token is provided
    if (options?.token) {
      headers.Authorization = `Bearer ${options.token}`;
    }

    // Add any additional headers
    if (options?.headers) {
      Object.assign(headers, options.headers);
    }

    return headers;
  }

  /**
   * Handle API response and errors
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    let responseData: any;

    // Try to parse JSON response
    try {
      responseData = await response.json();
    } catch (error) {
      // If JSON parsing fails, create a generic error response
      responseData = {
        success: false,
        message: 'Invalid response format from server',
      };
    }

    // Handle non-2xx status codes
    if (!response.ok) {
      const errorMessage = responseData?.message || responseData?.error || 'An error occurred';
      const errorCode = responseData?.code;
      
      throw new AfflytApiError(errorMessage, response.status, errorCode);
    }

    // For successful responses, return the data if available, otherwise the full response
    return responseData?.data !== undefined ? responseData.data : responseData;
  }

  /**
   * Generic HTTP GET request
   */
  async get<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    try {
      const url = this.buildUrl(endpoint);
      const headers = this.buildHeaders(options);

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      // Re-throw AfflytApiError as-is
      if (error instanceof AfflytApiError) {
        throw error;
      }

      // Handle network errors or other fetch errors
      throw new AfflytApiError(
        error instanceof Error ? error.message : 'Network error occurred',
        0
      );
    }
  }

  /**
   * Generic HTTP POST request
   */
  async post<T = any>(
    endpoint: string, 
    data?: any, 
    options?: RequestOptions
  ): Promise<T> {
    try {
      const url = this.buildUrl(endpoint);
      const headers = this.buildHeaders(options);

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      // Re-throw AfflytApiError as-is
      if (error instanceof AfflytApiError) {
        throw error;
      }

      // Handle network errors or other fetch errors
      throw new AfflytApiError(
        error instanceof Error ? error.message : 'Network error occurred',
        0
      );
    }
  }

  /**
   * Generic HTTP PUT request
   */
  async put<T = any>(
    endpoint: string, 
    data?: any, 
    options?: RequestOptions
  ): Promise<T> {
    try {
      const url = this.buildUrl(endpoint);
      const headers = this.buildHeaders(options);

      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof AfflytApiError) {
        throw error;
      }

      throw new AfflytApiError(
        error instanceof Error ? error.message : 'Network error occurred',
        0
      );
    }
  }

  /**
   * Generic HTTP PATCH request
   */
  async patch<T = any>(
    endpoint: string, 
    data?: any, 
    options?: RequestOptions
  ): Promise<T> {
    try {
      const url = this.buildUrl(endpoint);
      const headers = this.buildHeaders(options);

      const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof AfflytApiError) {
        throw error;
      }

      throw new AfflytApiError(
        error instanceof Error ? error.message : 'Network error occurred',
        0
      );
    }
  }

  /**
   * Generic HTTP DELETE request
   */
  async delete<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    try {
      const url = this.buildUrl(endpoint);
      const headers = this.buildHeaders(options);

      const response = await fetch(url, {
        method: 'DELETE',
        headers,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof AfflytApiError) {
        throw error;
      }

      throw new AfflytApiError(
        error instanceof Error ? error.message : 'Network error occurred',
        0
      );
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.get('/health');
  }

  /**
   * Get API version info
   */
  async getApiInfo(): Promise<{ version: string; environment: string }> {
    return this.get('/api/v1');
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();

// Export the class and error class for external use
export { ApiClient, AfflytApiError };

/**
 * Convenience function for making authenticated requests
 * This will be used by hooks and components that need to include auth token
 */
export const createAuthenticatedApiClient = (token: string) => {
  return {
    get: <T = any>(endpoint: string, headers?: Record<string, string>) => 
      apiClient.get<T>(endpoint, { token, headers }),
    
    post: <T = any>(endpoint: string, data?: any, headers?: Record<string, string>) => 
      apiClient.post<T>(endpoint, data, { token, headers }),
    
    put: <T = any>(endpoint: string, data?: any, headers?: Record<string, string>) => 
      apiClient.put<T>(endpoint, data, { token, headers }),
    
    patch: <T = any>(endpoint: string, data?: any, headers?: Record<string, string>) => 
      apiClient.patch<T>(endpoint, data, { token, headers }),
    
    delete: <T = any>(endpoint: string, headers?: Record<string, string>) => 
      apiClient.delete<T>(endpoint, { token, headers }),
  };
};