/**
 * Platform-agnostic ZHTP API client
 * Uses fetch API (available in all environments)
 * Composes core infrastructure and all API methods
 */
import { ZhtpApiMethods } from './zhtp-api-methods.js';
export class ZhtpApi extends ZhtpApiMethods {
    /**
     * @param configProvider - Configuration provider for API settings
     * @param fetchAdapter - Optional custom fetch implementation (e.g., QUIC-based for React Native)
     */
    constructor(configProvider, fetchAdapter) {
        super(fetchAdapter);
        this.configProvider = configProvider;
        this.initPromise = this.initialize();
    }
    async initialize() {
        try {
            this.config = await this.configProvider.getConfig();
            this.baseUrl = this.config.zhtpNodeUrl;
            if (this.config.debugMode) {
                console.log(`✅ ZHTP API initialized: ${this.baseUrl}`);
            }
        }
        catch (error) {
            console.error('❌ Failed to initialize ZHTP API:', error);
            throw error;
        }
    }
    /**
     * Ensure initialization is complete before making requests
     * Useful for applications that need to wait for config loading
     */
    async ensureInitialized() {
        await this.initPromise;
    }
    // ==================== Utility Methods ====================
    getBaseUrl() {
        return this.baseUrl;
    }
    getConfig() {
        return this.config;
    }
    isConnected() {
        return !!this.config;
    }
    async ensureConnection() {
        if (this.isConnected()) {
            return true;
        }
        // Try to reinitialize config
        try {
            this.config = await this.configProvider.getConfig();
            this.baseUrl = this.config.zhtpNodeUrl;
            return true;
        }
        catch (error) {
            console.error('❌ Failed to ensure connection:', error);
            return false;
        }
    }
}
//# sourceMappingURL=zhtp-api.js.map