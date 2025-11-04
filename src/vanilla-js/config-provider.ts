/**
 * Browser/Vanilla JS configuration provider
 * Uses localStorage or fetch from API
 */

import { ConfigProvider } from '../core/config-provider';
import { ApiConfig } from '../core/types';

export class BrowserConfigProvider implements ConfigProvider {
  private cacheKey = 'zhtp_config';
  private configUrl: string;
  private cache: ApiConfig | null = null;

  constructor(configUrl?: string) {
    this.configUrl = configUrl || '/api/config';
  }

  async getConfig(): Promise<ApiConfig> {
    // Return cached config if available
    if (this.cache) {
      return this.cache;
    }

    // Try to load from localStorage
    if (typeof localStorage !== 'undefined') {
      try {
        const cached = localStorage.getItem(this.cacheKey);
        if (cached) {
          this.cache = JSON.parse(cached) as ApiConfig;
          return this.cache;
        }
      } catch (error) {
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
          } catch (e) {
            console.warn('Failed to cache config in localStorage:', e);
          }
        }

        return config;
      }
    } catch (error) {
      console.warn('Failed to fetch config from API:', error);
    }

    // Use sensible defaults
    const defaultConfig: ApiConfig = {
      zhtpNodeUrl: 'http://localhost:8000',
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
  async updateConfig(config: Partial<ApiConfig>): Promise<void> {
    const current = await this.getConfig();
    const updated = { ...current, ...config };
    this.cache = updated;

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(this.cacheKey, JSON.stringify(updated));
      } catch (error) {
        console.warn('Failed to update config in localStorage:', error);
      }
    }
  }

  /**
   * Clear cached config
   */
  clearCache(): void {
    this.cache = null;
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(this.cacheKey);
      } catch (error) {
        console.warn('Failed to clear config from localStorage:', error);
      }
    }
  }
}
