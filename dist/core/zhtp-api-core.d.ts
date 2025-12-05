/**
 * Core ZHTP API functionality
 * Handles request/response, retry logic, and timeouts
 */
import { ApiConfig } from './types';
/**
 * Transport adapter for custom network implementations (e.g., QUIC)
 * React Native apps can provide their own fetch implementation using native QUIC
 */
export type FetchAdapter = (url: string, options?: RequestInit) => Promise<Response>;
export declare abstract class ZhtpApiCore {
    protected baseUrl: string;
    protected config: ApiConfig | null;
    protected maxRetries: number;
    protected requestTimeout: number;
    protected retryDelays: number[];
    /**
     * Custom fetch adapter (e.g., QUIC-based fetch for React Native)
     * Defaults to global fetch if not provided
     */
    protected fetchAdapter: FetchAdapter;
    constructor(fetchAdapter?: FetchAdapter);
    /**
     * Generic request method with retry logic and timeout
     */
    protected request<T>(endpoint: string, options?: RequestInit, retryCount?: number): Promise<T>;
    protected shouldRetry(error: any): boolean;
}
//# sourceMappingURL=zhtp-api-core.d.ts.map