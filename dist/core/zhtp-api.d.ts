/**
 * Platform-agnostic ZHTP API client
 * Uses fetch API (available in all environments)
 * Composes core infrastructure and all API methods
 */
import { ConfigProvider } from './config-provider';
import { ApiConfig } from './types';
import { ZhtpApiMethods } from './zhtp-api-methods';
import { FetchAdapter } from './zhtp-api-core';
export declare class ZhtpApi extends ZhtpApiMethods {
    private configProvider;
    private initPromise;
    /**
     * @param configProvider - Configuration provider for API settings
     * @param fetchAdapter - Optional custom fetch implementation (e.g., QUIC-based for React Native)
     */
    constructor(configProvider: ConfigProvider, fetchAdapter?: FetchAdapter);
    private initialize;
    /**
     * Ensure initialization is complete before making requests
     * Useful for applications that need to wait for config loading
     */
    ensureInitialized(): Promise<void>;
    getBaseUrl(): string;
    getConfig(): ApiConfig | null;
    isConnected(): boolean;
    ensureConnection(): Promise<boolean>;
}
//# sourceMappingURL=zhtp-api.d.ts.map