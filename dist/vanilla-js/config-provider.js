/**
 * Browser/Vanilla JS configuration provider
 * Uses localStorage or fetch from API
 */
export class BrowserConfigProvider {
    constructor(configUrl) {
        this.cacheKey = 'zhtp_config';
        this.cache = null;
        this.configUrl = configUrl || '/api/config';
    }
    async getConfig() {
        // Return cached config if available
        if (this.cache) {
            return this.cache;
        }
        // Try to load from localStorage
        if (typeof localStorage !== 'undefined') {
            try {
                const cached = localStorage.getItem(this.cacheKey);
                if (cached) {
                    this.cache = JSON.parse(cached);
                    return this.cache;
                }
            }
            catch (error) {
                console.warn('Failed to load config from localStorage:', error);
            }
        }
        // Try to fetch from API
        try {
            const response = await fetch(this.configUrl);
            if (response.ok) {
                const config = await response.json();
                this.cache = config;
                // Cache in localStorage if available
                if (typeof localStorage !== 'undefined') {
                    try {
                        localStorage.setItem(this.cacheKey, JSON.stringify(config));
                    }
                    catch (e) {
                        console.warn('Failed to cache config in localStorage:', e);
                    }
                }
                return config;
            }
        }
        catch (error) {
            console.warn('Failed to fetch config from API:', error);
        }
        // Use sensible defaults
        // NOTE: ZHTP backend uses QUIC (UDP port 9334) but requires HTTP/3 gateway for browsers
        // For development, ensure you have either:
        // 1. HTTP-to-QUIC gateway running on port 8000, OR
        // 2. Direct QUIC connection (requires custom fetch adapter)
        const defaultConfig = {
            zhtpNodeUrl: 'http://localhost:8000', // Gateway to QUIC backend on :9334
            networkType: 'testnet',
            debugMode: true,
            enableBiometrics: true,
        };
        this.cache = defaultConfig;
        return defaultConfig;
    }
    /**
     * Update config and persist to localStorage
     */
    async updateConfig(config) {
        const current = await this.getConfig();
        const updated = { ...current, ...config };
        this.cache = updated;
        if (typeof localStorage !== 'undefined') {
            try {
                localStorage.setItem(this.cacheKey, JSON.stringify(updated));
            }
            catch (error) {
                console.warn('Failed to update config in localStorage:', error);
            }
        }
    }
    /**
     * Clear cached config
     */
    clearCache() {
        this.cache = null;
        if (typeof localStorage !== 'undefined') {
            try {
                localStorage.removeItem(this.cacheKey);
            }
            catch (error) {
                console.warn('Failed to clear config from localStorage:', error);
            }
        }
    }
}
//# sourceMappingURL=config-provider.js.map