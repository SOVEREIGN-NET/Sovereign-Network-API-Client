/**
 * Browser/Vanilla JS configuration provider
 * Uses localStorage or fetch from API
 */
import { ConfigProvider } from '../core/config-provider';
import { ApiConfig } from '../core/types';
export declare class BrowserConfigProvider implements ConfigProvider {
    private cacheKey;
    private configUrl;
    private cache;
    constructor(configUrl?: string);
    getConfig(): Promise<ApiConfig>;
    /**
     * Update config and persist to localStorage
     */
    updateConfig(config: Partial<ApiConfig>): Promise<void>;
    /**
     * Clear cached config
     */
    clearCache(): void;
}
//# sourceMappingURL=config-provider.d.ts.map