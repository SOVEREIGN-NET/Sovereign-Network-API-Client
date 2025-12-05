/**
 * Core ZHTP API functionality
 * Handles request/response, retry logic, and timeouts
 */
export class ZhtpApiCore {
    constructor(fetchAdapter) {
        this.baseUrl = '';
        this.config = null;
        this.maxRetries = 3;
        this.requestTimeout = 10000;
        this.retryDelays = [1000, 2000, 4000]; // Exponential backoff
        this.fetchAdapter = fetchAdapter || ((url, options) => fetch(url, options));
    }
    /**
     * Generic request method with retry logic and timeout
     */
    async request(endpoint, options = {}, retryCount = 0) {
        try {
            const url = `${this.baseUrl}${endpoint}`;
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), this.requestTimeout);
            const response = await this.fetchAdapter(url, {
                ...options,
                signal: controller.signal,
            });
            clearTimeout(timeout);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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
                    console.warn(`⚠️ Request failed, retrying in ${delay}ms...`, error);
                }
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.request(endpoint, options, retryCount + 1);
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