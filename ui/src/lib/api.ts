// API utility functions for backend communication
// This provides centralized API calls with proper error handling and logging

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  error_type?: string;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded';
  timestamp: string;
  services: {
    earth_engine: {
      configured: boolean;
      initialized: boolean;
      project_id: string;
    };
  };
  environment: {
    debug: boolean;
    backend_port: number;
    frontend_port: number;
  };
}

class ApiClient {
  private baseUrl: string;
  private configLoaded: boolean = false;

  constructor() {
    this.baseUrl = 'http://localhost:8000'; // Default for development
    this.initializeConfig();
  }

  private async initializeConfig() {
    if (this.configLoaded) return;

    try {
      // Fetch runtime configuration from our own API endpoint
      const response = await fetch('/api/config');
      if (response.ok) {
        const config = await response.json();
        this.baseUrl = config.backendUrl;
        console.log(`🔗 API Client configured with runtime baseUrl: ${this.baseUrl}`);
      } else {
        console.warn('⚠️ Could not fetch runtime config, using default URL');
      }
    } catch (error) {
      console.warn('⚠️ Error fetching runtime config:', error);
    }

    this.configLoaded = true;
  }

  async ensureConfigured() {
    if (!this.configLoaded) {
      await this.initializeConfig();
    }
  }

  async healthCheck(): Promise<{ data?: HealthStatus; error?: string }> {
    await this.ensureConfigured();

    try {
      console.log('🏥 Checking backend health...');

      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout for health checks
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      console.log(`📡 Health check response status: ${response.status}`);

      if (!response.ok) {
        console.error(`❌ Health check failed with status: ${response.status}`);
        return {
          error: `Health check failed with status ${response.status}`,
        };
      }

      const data = await response.json();
      console.log('✅ Health check successful:', data);
      return { data };

    } catch (error) {
      console.error('❌ Health check error:', error);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return { error: 'Health check timed out - backend may be unreachable' };
        }
        return { error: `Network error: ${error.message}` };
      }

      return { error: 'Unknown error during health check' };
    }
  }

  async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data?: T; error?: string }> {
    await this.ensureConfigured();

    const maxRetries = 2;
    let lastError: string = '';

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const url = `${this.baseUrl}${endpoint}`;

        // Progressive timeout: start with reasonable timeout, increase on retries
        const baseTimeout = 30000; // 30 seconds base
        const timeout = baseTimeout + (attempt * 15000); // Add 15s per retry

        console.log(`🔄 API request (attempt ${attempt + 1}/${maxRetries + 1}): ${endpoint}`);
        console.log(`⏱️ Timeout: ${timeout/1000}s`);

        // Create timeout signal if not provided
        let signal = options.signal;
        let timeoutController: AbortController | undefined;

        if (!signal) {
          timeoutController = new AbortController();
          signal = timeoutController.signal;
          setTimeout(() => timeoutController!.abort(), timeout);
        }

        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          ...options,
          signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ API error (${response.status}):`, errorText);

          // Don't retry client errors (4xx), only server errors (5xx) and network issues
          if (response.status >= 400 && response.status < 500) {
            try {
              const errorJson = JSON.parse(errorText);
              return {
                error: errorJson.message || errorJson.error || `HTTP ${response.status}`,
              };
            } catch {
              return {
                error: `HTTP ${response.status}: ${errorText}`,
              };
            }
          }

          lastError = `HTTP ${response.status}: ${errorText}`;
          if (attempt === maxRetries) {
            return { error: lastError };
          }
          console.log(`🔄 Retrying after server error (attempt ${attempt + 1})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Progressive delay
          continue;
        }

        const data = await response.json();
        console.log(`✅ API request successful (attempt ${attempt + 1})`);
        return { data };

      } catch (error) {
        console.error(`❌ API request error (attempt ${attempt + 1}):`, error);

        if (error instanceof Error) {
          // Handle different error types
          if (error.name === 'AbortError') {
            lastError = 'Request timed out - Earth Engine processing is taking longer than expected';
          } else if (error.message.includes('fetch')) {
            lastError = `Network connection error: ${error.message}`;
          } else {
            lastError = `Network error: ${error.message}`;
          }
        } else {
          lastError = 'Unknown network error';
        }

        // Don't retry if request was manually cancelled
        if (error instanceof Error && error.name === 'AbortError' && options.signal?.aborted) {
          console.log('🚫 Request was manually cancelled');
          return { error: 'Request cancelled' };
        }

        // Retry on network/timeout errors
        if (attempt === maxRetries) {
          break;
        }

        console.log(`🔄 Retrying after error (attempt ${attempt + 1})... ${lastError}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // Progressive delay
      }
    }

    return { error: `Failed after ${maxRetries + 1} attempts: ${lastError}` };
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Helper function to check if backend is reachable
export async function checkBackendConnection(): Promise<boolean> {
  const result = await apiClient.healthCheck();
  return !result.error && result.data?.status === 'healthy';
}
