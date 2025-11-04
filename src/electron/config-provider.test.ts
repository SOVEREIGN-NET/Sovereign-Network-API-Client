/**
 * Tests for ElectronConfigProvider
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ElectronConfigProvider } from './config-provider';
import { ApiConfig } from '../core/types';

describe('ElectronConfigProvider', () => {
  let provider: ElectronConfigProvider;
  const mockConfig: ApiConfig = {
    zhtpNodeUrl: 'http://localhost:8000',
    networkType: 'testnet',
    debugMode: true,
    enableBiometrics: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getConfig()', () => {
    it('should return cached config if available', async () => {
      const mockIpcRenderer = {
        getConfig: vi.fn().mockResolvedValue(mockConfig),
      };

      provider = new ElectronConfigProvider(mockIpcRenderer);
      // Trigger first call to populate cache
      await provider.getConfig();

      // Reset mock to verify cache is used
      mockIpcRenderer.getConfig.mockClear();

      const result = await provider.getConfig();

      expect(result).toEqual(mockConfig);
      expect(mockIpcRenderer.getConfig).not.toHaveBeenCalled();
    });

    it('should fetch config from electronAPI.getConfig() if available', async () => {
      const mockIpcRenderer = {
        getConfig: vi.fn().mockResolvedValue(mockConfig),
      };

      provider = new ElectronConfigProvider(mockIpcRenderer);
      const result = await provider.getConfig();

      expect(result).toEqual(mockConfig);
      expect(mockIpcRenderer.getConfig).toHaveBeenCalled();
    });

    it('should fallback to ipcRenderer.invoke() if getConfig not available', async () => {
      const mockIpcRenderer = {
        invoke: vi.fn().mockResolvedValue(mockConfig),
      };

      provider = new ElectronConfigProvider(mockIpcRenderer);
      const result = await provider.getConfig();

      expect(result).toEqual(mockConfig);
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('get-config');
    });

    it('should cache config after first fetch', async () => {
      const mockIpcRenderer = {
        invoke: vi.fn().mockResolvedValue(mockConfig),
      };

      provider = new ElectronConfigProvider(mockIpcRenderer);

      const result1 = await provider.getConfig();
      const result2 = await provider.getConfig();

      expect(result1).toBe(result2);
      expect(mockIpcRenderer.invoke).toHaveBeenCalledTimes(1);
    });

    it('should throw error if no IPC renderer available', async () => {
      provider = new ElectronConfigProvider(undefined);

      await expect(provider.getConfig()).rejects.toThrow(
        'Electron IPC not available'
      );
    });

    it('should throw error if IPC returns null', async () => {
      const mockIpcRenderer = {
        getConfig: vi.fn().mockResolvedValue(null),
      };

      provider = new ElectronConfigProvider(mockIpcRenderer);

      await expect(provider.getConfig()).rejects.toThrow('No config returned from IPC');
    });

    it('should throw error if IPC returns undefined', async () => {
      const mockIpcRenderer = {
        getConfig: vi.fn().mockResolvedValue(undefined),
      };

      provider = new ElectronConfigProvider(mockIpcRenderer);

      await expect(provider.getConfig()).rejects.toThrow('No config returned from IPC');
    });

    it('should throw error if IPC method call fails', async () => {
      const mockIpcRenderer = {
        getConfig: vi.fn().mockRejectedValue(new Error('IPC error')),
      };

      provider = new ElectronConfigProvider(mockIpcRenderer);

      await expect(provider.getConfig()).rejects.toThrow('IPC error');
    });

    it('should throw error if no compatible IPC method found', async () => {
      const mockIpcRenderer = {};

      provider = new ElectronConfigProvider(mockIpcRenderer);

      await expect(provider.getConfig()).rejects.toThrow('No compatible IPC method found');
    });

    it('should try getConfig before invoke', async () => {
      const mockIpcRenderer = {
        getConfig: vi.fn().mockResolvedValue(mockConfig),
        invoke: vi.fn(),
      };

      provider = new ElectronConfigProvider(mockIpcRenderer);
      await provider.getConfig();

      expect(mockIpcRenderer.getConfig).toHaveBeenCalled();
      expect(mockIpcRenderer.invoke).not.toHaveBeenCalled();
    });

    it('should fallback to invoke if getConfig is not a function', async () => {
      const mockIpcRenderer = {
        invoke: vi.fn().mockResolvedValue(mockConfig),
      };

      provider = new ElectronConfigProvider(mockIpcRenderer);
      const result = await provider.getConfig();

      expect(result).toEqual(mockConfig);
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('get-config');
    });

    it('should handle various config formats', async () => {
      const customConfig: ApiConfig = {
        zhtpNodeUrl: 'http://custom-api:9000',
        networkType: 'mainnet',
        debugMode: false,
        enableBiometrics: true,
      };

      const mockIpcRenderer = {
        getConfig: vi.fn().mockResolvedValue(customConfig),
      };

      provider = new ElectronConfigProvider(mockIpcRenderer);
      const result = await provider.getConfig();

      expect(result).toEqual(customConfig);
      expect(result.zhtpNodeUrl).toBe('http://custom-api:9000');
      expect(result.networkType).toBe('mainnet');
      expect(result.debugMode).toBe(false);
      expect(result.enableBiometrics).toBe(true);
    });
  });

  describe('clearCache()', () => {
    it('should clear cached config', async () => {
      const mockIpcRenderer = {
        getConfig: vi.fn().mockResolvedValue(mockConfig),
      };

      provider = new ElectronConfigProvider(mockIpcRenderer);

      // Load config
      const result1 = await provider.getConfig();
      expect(result1).toEqual(mockConfig);

      // Clear cache
      provider.clearCache();

      // Reset mock
      mockIpcRenderer.getConfig.mockClear();
      mockIpcRenderer.getConfig.mockResolvedValue(mockConfig);

      // Next call should fetch from IPC again
      await provider.getConfig();
      expect(mockIpcRenderer.getConfig).toHaveBeenCalled();
    });

    it('should allow config to be reloaded after clearing', async () => {
      const mockIpcRenderer = {
        getConfig: vi
          .fn()
          .mockResolvedValueOnce(mockConfig)
          .mockResolvedValueOnce({
            ...mockConfig,
            zhtpNodeUrl: 'http://new-api:8000',
          }),
      };

      provider = new ElectronConfigProvider(mockIpcRenderer);

      const config1 = await provider.getConfig();
      expect(config1.zhtpNodeUrl).toBe('http://localhost:8000');

      provider.clearCache();

      const config2 = await provider.getConfig();
      expect(config2.zhtpNodeUrl).toBe('http://new-api:8000');
    });
  });

  describe('Constructor', () => {
    it('should accept injected IPC renderer', () => {
      const mockIpcRenderer = { getConfig: vi.fn() };
      provider = new ElectronConfigProvider(mockIpcRenderer);

      expect((provider as any).ipcRenderer).toBe(mockIpcRenderer);
    });

    it('should initialize with undefined ipc renderer if none provided', () => {
      provider = new ElectronConfigProvider(undefined);

      expect((provider as any).ipcRenderer).toBeUndefined();
    });

    it('should initialize with null cache', () => {
      const mockIpcRenderer = { getConfig: vi.fn() };
      provider = new ElectronConfigProvider(mockIpcRenderer);

      expect((provider as any).cache).toBeNull();
    });

    it('should set cache key', () => {
      const mockIpcRenderer = { getConfig: vi.fn() };
      provider = new ElectronConfigProvider(mockIpcRenderer);

      expect((provider as any).cacheKey).toBe('zhtp_config');
    });
  });

  describe('IPC Method Fallback Chain', () => {
    it('should prioritize modern electronAPI.getConfig()', async () => {
      const mockIpcRenderer = {
        getConfig: vi.fn().mockResolvedValue(mockConfig),
        invoke: vi.fn(),
      };

      provider = new ElectronConfigProvider(mockIpcRenderer);
      await provider.getConfig();

      expect(mockIpcRenderer.getConfig).toHaveBeenCalled();
      expect(mockIpcRenderer.invoke).not.toHaveBeenCalled();
    });

    it('should fallback to ipcRenderer.invoke if getConfig not a function', async () => {
      const mockIpcRenderer = {
        // getConfig is not a function
        invoke: vi.fn().mockResolvedValue(mockConfig),
      };

      provider = new ElectronConfigProvider(mockIpcRenderer);
      const result = await provider.getConfig();

      expect(result).toEqual(mockConfig);
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('get-config');
    });

    it('should handle missing getConfig gracefully', async () => {
      const mockIpcRenderer = {
        invoke: vi.fn().mockResolvedValue(mockConfig),
      };

      provider = new ElectronConfigProvider(mockIpcRenderer);
      const result = await provider.getConfig();

      expect(result).toEqual(mockConfig);
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('get-config');
    });
  });

  describe('Error Scenarios', () => {
    it('should log error when IPC is not available', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Simulate window.electronAPI not being available
      provider = new ElectronConfigProvider(undefined);

      await expect(provider.getConfig()).rejects.toThrow();

      consoleSpy.mockRestore();
    });

    it('should handle IPC timeout gracefully', async () => {
      const mockIpcRenderer = {
        getConfig: vi
          .fn()
          .mockImplementation(
            () => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 100))
          ),
      };

      provider = new ElectronConfigProvider(mockIpcRenderer);

      await expect(provider.getConfig()).rejects.toThrow('Timeout');
    });

    it('should propagate IPC errors', async () => {
      const mockIpcRenderer = {
        invoke: vi.fn().mockRejectedValue(new Error('Channel not registered')),
      };

      provider = new ElectronConfigProvider(mockIpcRenderer);

      await expect(provider.getConfig()).rejects.toThrow('Channel not registered');
    });
  });

  describe('Multiple Calls', () => {
    it('should return same cached config on multiple sequential calls', async () => {
      const mockIpcRenderer = {
        getConfig: vi.fn().mockResolvedValue(mockConfig),
      };

      provider = new ElectronConfigProvider(mockIpcRenderer);

      const result1 = await provider.getConfig();
      const result2 = await provider.getConfig();
      const result3 = await provider.getConfig();

      expect(result1).toEqual(mockConfig);
      expect(result2).toEqual(mockConfig);
      expect(result3).toEqual(mockConfig);
      // Should only call IPC once due to caching
      expect(mockIpcRenderer.getConfig).toHaveBeenCalledTimes(1);
    });
  });

  describe('Config Validation', () => {
    it('should handle config with all required fields', async () => {
      const fullConfig: ApiConfig = {
        zhtpNodeUrl: 'http://localhost:8000',
        networkType: 'testnet',
        debugMode: true,
        enableBiometrics: true,
      };

      const mockIpcRenderer = {
        getConfig: vi.fn().mockResolvedValue(fullConfig),
      };

      provider = new ElectronConfigProvider(mockIpcRenderer);
      const result = await provider.getConfig();

      expect(result.zhtpNodeUrl).toBe('http://localhost:8000');
      expect(result.networkType).toBe('testnet');
      expect(result.debugMode).toBe(true);
      expect(result.enableBiometrics).toBe(true);
    });

    it('should handle config with minimal fields', async () => {
      const minimalConfig: ApiConfig = {
        zhtpNodeUrl: 'http://api:8000',
        networkType: 'testnet',
        debugMode: false,
        enableBiometrics: false,
      };

      const mockIpcRenderer = {
        getConfig: vi.fn().mockResolvedValue(minimalConfig),
      };

      provider = new ElectronConfigProvider(mockIpcRenderer);
      const result = await provider.getConfig();

      expect(result).toEqual(minimalConfig);
    });
  });
});
