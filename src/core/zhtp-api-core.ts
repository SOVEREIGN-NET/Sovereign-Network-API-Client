/**
 * Core ZHTP API functionality
 * Handles request/response, retry logic, and timeouts
 */

import { ApiConfig } from './types';

export abstract class ZhtpApiCore {
  protected baseUrl: string = '';
  protected config: ApiConfig | null = null;
  protected maxRetries = 3;
  protected requestTimeout = 10000;
  protected retryDelays = [1000, 2000, 4000]; // Exponential backoff

  /**
   * Generic request method with retry logic and timeout
   */
  protected async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    try {
      const url = `${this.baseUrl}${endpoint}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.requestTimeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      clearTimeout(0);

      // Retry on network errors (but not on 4xx errors)
      if (retryCount < this.maxRetries && this.shouldRetry(error)) {
        const delay = this.retryDelays[retryCount];
        if (this.config?.debugMode) {
          console.warn(`⚠️ Request failed, retrying in ${delay}ms...`, error);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.request<T>(endpoint, options, retryCount + 1);
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
