/**
 * Core ZHTP API functionality
 * Handles request/response, retry logic, and timeouts
 */
import { ApiConfig } from './types';
export declare abstract class ZhtpApiCore {
    protected baseUrl: string;
    protected config: ApiConfig | null;
    protected maxRetries: number;
    protected requestTimeout: number;
    protected retryDelays: number[];
    /**
     * Generic request method with retry logic and timeout
     */
    protected request<T>(endpoint: string, options?: RequestInit, retryCount?: number): Promise<T>;
    protected shouldRetry(error: any): boolean;
}
//# sourceMappingURL=zhtp-api-core.d.ts.map