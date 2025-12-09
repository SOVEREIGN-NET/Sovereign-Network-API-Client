/**
 * Core ZHTP API functionality
 * Handles request/response, retry logic, and timeouts
 */
import { sanitizeError } from './security-utils.js';
export class ZhtpApiCore {
    constructor(fetchAdapter) {
        this.baseUrl = '';
        this.config = null;
        this.maxRetries = 3;
        this.requestTimeout = 10000;
        this.retryDelays = [1000, 2000, 4000]; // Exponential backoff
        this.isInitialized = false;
        this.fetchAdapter = fetchAdapter || ((url, options) => fetch(url, options));
    }
    /**
     * Generic request method with retry logic and timeout
     * SECURITY: Includes error sanitization, Content-Type validation, and configurable timeouts
     */
    async request(endpoint, options = {}, retryCount = 0, timeoutMs) {
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
            return data;
        }
        catch (error) {
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
                return this.request(endpoint, options, retryCount + 1, timeoutMs);
            }
            throw error;
        }
    }
    shouldRetry(error) {
        // Don't retry on HTTP 4xx errors (client errors)
        if (error?.message?.includes('HTTP 4')) {
            return false;
        }
        // Retry on network errors, timeouts, etc.
        return true;
    }
}
//# sourceMappingURL=zhtp-api-core.js.map