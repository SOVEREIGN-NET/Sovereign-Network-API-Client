/**
 * React Native specific configuration provider
 * Uses AsyncStorage for persistence
 */
export class ReactNativeConfigProvider {
    constructor(envVars, asyncStorage) {
        this.cacheKey = 'zhtp_config';
        this.envVars = envVars || {};
        // Try to detect AsyncStorage in environment
        if (asyncStorage) {
            this.AsyncStorage = asyncStorage;
        }
        else if (typeof require !== 'undefined') {
            try {
                this.AsyncStorage = require('@react-native-async-storage/async-storage').default;
            }
            catch (e) {
                // AsyncStorage not available
            }
        }
    }
    async getConfig() {
        // Try to load cached config if AsyncStorage available
        if (this.AsyncStorage) {
            try {
                const cached = await this.AsyncStorage.getItem(this.cacheKey);
                if (cached) {
                    return JSON.parse(cached);
                }
            }
            catch (error) {
                console.warn('Failed to load cached config:', error);
            }
        }
        // Fall back to environment variables
        // Check for __DEV__ variable (React Native specific)
        let isDevMode = false;
        try {
            // @ts-ignore - __DEV__ is a React Native global
            isDevMode = typeof __DEV__ !== 'undefined' ? __DEV__ : false;
        }
        catch (e) {
            isDevMode = false;
        }
        const config = {
            zhtpNodeUrl: this.envVars.ZHTP_NODE_URL ||
                (typeof process !== 'undefined' && process.env?.ZHTP_NODE_URL) ||
                'http://localhost:8000',
            networkType: this.envVars.NETWORK_TYPE ||
                (typeof process !== 'undefined' && process.env?.NETWORK_TYPE) ||
                'testnet',
            debugMode: this.envVars.DEBUG_MODE === true ||
                this.envVars.DEBUG_MODE === 'true' ||
                isDevMode,
            enableBiometrics: this.envVars.ENABLE_BIOMETRICS !== false &&
                this.envVars.ENABLE_BIOMETRICS !== 'false',
        };
        // Cache for next time if AsyncStorage available
        if (this.AsyncStorage) {
            try {
                await this.AsyncStorage.setItem(this.cacheKey, JSON.stringify(config));
            }
            catch (error) {
                console.warn('Failed to cache config:', error);
            }
        }
        return config;
    }
    /**
     * Update config dynamically (e.g., user changes node URL)
     */
    async updateConfig(config) {
        if (!this.AsyncStorage) {
            throw new Error('AsyncStorage not available for config persistence');
        }
        const current = await this.getConfig();
        const updated = { ...current, ...config };
        await this.AsyncStorage.setItem(this.cacheKey, JSON.stringify(updated));
    }
    /**
     * Clear cached config
     */
    async clearCache() {
        if (!this.AsyncStorage) {
            return;
        }
        try {
            await this.AsyncStorage.removeItem(this.cacheKey);
        }
        catch (error) {
            console.warn('Failed to clear config cache:', error);
        }
    }
}
//# sourceMappingURL=config-provider.js.map