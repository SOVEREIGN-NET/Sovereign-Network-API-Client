/**
 * Platform-agnostic ZHTP API client
 * Uses fetch API (available in all environments)
 * Composes core infrastructure and all API methods
 */

import { ConfigProvider } from './config-provider';
import { ApiConfig } from './types';
import { ZhtpApiMethods } from './zhtp-api-methods';

export class ZhtpApi extends ZhtpApiMethods {
  private configProvider: ConfigProvider;
  private initPromise: Promise<void>;

  constructor(configProvider: ConfigProvider) {
    super();
    this.configProvider = configProvider;
    this.initPromise = this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      this.config = await this.configProvider.getConfig();
      this.baseUrl = this.config.zhtpNodeUrl;
      if (this.config.debugMode) {
        console.log(`✅ ZHTP API initialized: ${this.baseUrl}`);
      }
    } catch (error) {
      console.error('❌ Failed to initialize ZHTP API:', error);
      throw error;
    }
  }

  /**
   * Ensure initialization is complete before making requests
   * Useful for applications that need to wait for config loading
   */
  async ensureInitialized(): Promise<void> {
    await this.initPromise;
  }

  // ==================== Utility Methods ====================

  getBaseUrl(): string {
    return this.baseUrl;
  }

  getConfig(): ApiConfig | null {
    return this.config;
  }

  isConnected(): boolean {
    return !!this.config;
  }

  async ensureConnection(): Promise<boolean> {
    if (this.isConnected()) {
      return true;
    }

    // Try to reinitialize config
    try {
      this.config = await this.configProvider.getConfig();
      this.baseUrl = this.config.zhtpNodeUrl;
      return true;
    } catch (error) {
      console.error('❌ Failed to ensure connection:', error);
      return false;
    }
  }
}
