/**
 * Core ZHTP API functionality
 * Handles request/response, retry logic, and timeouts
 */

import { ApiConfig } from './types';
import { sanitizeError } from './security-utils';

/**
 * Transport adapter for custom network implementations (e.g., QUIC)
 * React Native apps can provide their own fetch implementation using native QUIC
 */
export type FetchAdapter = (url: string, options?: RequestInit) => Promise<Response>;

export abstract class ZhtpApiCore {
  protected baseUrl: string = '';
  protected config: ApiConfig | null = null;
  protected maxRetries = 3;
  protected requestTimeout = 10000;
  protected retryDelays = [1000, 2000, 4000]; // Exponential backoff
  protected isInitialized = false;

  /**
   * Custom fetch adapter (e.g., QUIC-based fetch for React Native)
   * Defaults to global fetch if not provided
   */
  protected fetchAdapter: FetchAdapter;

  constructor(fetchAdapter?: FetchAdapter) {
    this.fetchAdapter = fetchAdapter || ((url, options) => fetch(url, options));
  }

  /**
   * Generic request method with retry logic and timeout
   * SECURITY: Includes error sanitization, Content-Type validation, and configurable timeouts
   */
  protected async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0,
    timeoutMs?: number
  ): Promise<T> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const requestTimeoutMs = timeoutMs || this.requestTimeout;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

      const response = await this.fetchAdapter(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // P2-4: Validate Content-Type before parsing as JSON
      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.includes('application/json')) {
        throw new Error(`Unexpected Content-Type: ${contentType}. Expected application/json`);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      clearTimeout(0);

      // Retry on network errors (but not on 4xx errors)
      if (retryCount < this.maxRetries && this.shouldRetry(error)) {
        const delay = this.retryDelays[retryCount];
        if (this.config?.debugMode) {
          // P0-1: Sanitize error before logging
          const sanitized = sanitizeError(error);
          console.warn(`⚠️ Request failed, retrying in ${delay}ms...`, sanitized);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.request<T>(endpoint, options, retryCount + 1, timeoutMs);
      }

      throw error;
    }
  }

  protected shouldRetry(error: any): boolean {
    // Don't retry on HTTP 4xx errors (client errors)
    if (error?.message?.includes('HTTP 4')) {
      return false;
    }
    // Retry on network errors, timeouts, etc.
    return true;
  }
}
