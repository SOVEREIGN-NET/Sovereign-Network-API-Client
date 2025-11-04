/**
 * React Native specific configuration provider
 * Uses AsyncStorage for persistence
 */
import { ConfigProvider } from '../core/config-provider';
import { ApiConfig } from '../core/types';
export declare class ReactNativeConfigProvider implements ConfigProvider {
    private envVars;
    private cacheKey;
    private AsyncStorage;
    constructor(envVars?: Record<string, any>, asyncStorage?: any);
    getConfig(): Promise<ApiConfig>;
    /**
     * Update config dynamically (e.g., user changes node URL)
     */
    updateConfig(config: Partial<ApiConfig>): Promise<void>;
    /**
     * Clear cached config
     */
    clearCache(): Promise<void>;
}
//# sourceMappingURL=config-provider.d.ts.map