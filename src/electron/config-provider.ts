/**
 * Electron specific configuration provider
 * Uses Electron IPC to get config from main process
 */

import { ConfigProvider } from '../core/config-provider';
import { ApiConfig } from '../core/types';

/**
 * Validate config structure and types (P2-6: Electron IPC security)
 */
function validateConfig(config: any): config is ApiConfig {
  if (!config || typeof config !== 'object') {
    throw new Error('Invalid config: must be an object');
  }

  if (typeof config.zhtpNodeUrl !== 'string' || !config.zhtpNodeUrl) {
    throw new Error('Invalid config: zhtpNodeUrl must be a non-empty string');
  }

  if (!['testnet', 'mainnet'].includes(config.networkType)) {
    throw new Error('Invalid config: networkType must be "testnet" or "mainnet"');
  }

  if (typeof config.debugMode !== 'boolean') {
    throw new Error('Invalid config: debugMode must be a boolean');
  }

  if (typeof config.enableBiometrics !== 'boolean') {
    throw new Error('Invalid config: enableBiometrics must be a boolean');
  }

  // Validate URL format
  try {
    new URL(config.zhtpNodeUrl);
  } catch {
    throw new Error(`Invalid config: zhtpNodeUrl is not a valid URL: ${config.zhtpNodeUrl}`);
  }

  return true;
}

export class ElectronConfigProvider implements ConfigProvider {
  private ipcRenderer: any;
  private cacheKey = 'zhtp_config';
  private cache: ApiConfig | null = null;

  constructor(ipcRenderer?: any) {
    // Accept injected ipcRenderer for testing
    if (ipcRenderer) {
      this.ipcRenderer = ipcRenderer;
    } else if (typeof window !== 'undefined' && typeof require !== 'undefined') {
      try {
        // Try modern electronAPI (with preload script)
        const win = window as any;
        if (win.electronAPI) {
          this.ipcRenderer = win.electronAPI;
        } else {
          // Fall back to direct require
          this.ipcRenderer = require('electron').ipcRenderer;
        }
      } catch (e) {
        console.error('Failed to load Electron IPC:', e);
      }
    }
  }

  async getConfig(): Promise<ApiConfig> {
    // Return cached config if available
    if (this.cache) {
      return this.cache;
    }

    if (!this.ipcRenderer) {
      throw new Error(
        'Electron IPC not available. Make sure this is running in Electron.'
      );
    }

    try {
      // Try modern electronAPI.getConfig()
      if (this.ipcRenderer.getConfig) {
        this.cache = await this.ipcRenderer.getConfig();
      }
      // Fall back to ipcRenderer.invoke
      else if (this.ipcRenderer.invoke) {
        this.cache = await this.ipcRenderer.invoke('get-config');
      } else {
        throw new Error('No compatible IPC method found');
      }

      if (!this.cache) {
        throw new Error('No config returned from IPC');
      }

      // P2-6: Validate config structure before using it
      validateConfig(this.cache);

      return this.cache;
    } catch (error) {
      console.error('Failed to get config from Electron main process:', error);
      throw error;
    }
  }

  /**
   * Clear cached config to force reload from IPC
   */
  clearCache(): void {
    this.cache = null;
  }
}
