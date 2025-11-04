/**
 * Tests for BrowserConfigProvider
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BrowserConfigProvider } from './config-provider';
import { ApiConfig } from '../core/types';

describe('BrowserConfigProvider', () => {
  let provider: BrowserConfigProvider;
  const mockConfig: ApiConfig = {
    zhtpNodeUrl: 'http://api.example.com:8000',
    networkType: 'mainnet',
    debugMode: true,
    enableBiometrics: true,
  };

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('getConfig()', () => {
    it('should return cached config if available', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch');
      provider = new BrowserConfigProvider();
      // Manually set cache
      (provider as any).cache = mockConfig;

      const result = await provider.getConfig();

      expect(result).toEqual(mockConfig);
      // Should not call fetch since cache exists
      expect(fetchSpy).not.toHaveBeenCalled();
      fetchSpy.mockRestore();
    });

    it('should load config from localStorage if available', async () => {
      localStorage.setItem('zhtp_config', JSON.stringify(mockConfig));
      provider = new BrowserConfigProvider();

      const result = await provider.getConfig();

      expect(result).toEqual(mockConfig);
    });

    it('should cache config in memory after loading from localStorage', async () => {
      localStorage.setItem('zhtp_config', JSON.stringify(mockConfig));
      provider = new BrowserConfigProvider();

      const result1 = await provider.getConfig();
      const result2 = await provider.getConfig();

      expect(result1).toEqual(mockConfig);
      expect(result2).toEqual(mockConfig);
      // Both should be same reference (cached)
      expect(result1).toBe(result2);
    });

    it('should fetch config from API if not in localStorage', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockConfig),
      });

      provider = new BrowserConfigProvider('/api/config');

      const result = await provider.getConfig();

      expect(result).toEqual(mockConfig);
      expect(global.fetch).toHaveBeenCalledWith('/api/config');
    });

    it('should cache config in localStorage after fetching from API', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockConfig),
      });

      provider = new BrowserConfigProvider('/api/config');
      await provider.getConfig();

      const cached = localStorage.getItem('zhtp_config');
      expect(cached).toEqual(JSON.stringify(mockConfig));
    });

    it('should cache config in memory after fetching from API', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockConfig),
      });

      provider = new BrowserConfigProvider('/api/config');
      const result1 = await provider.getConfig();
      const result2 = await provider.getConfig();

      expect(result1).toBe(result2);
      // fetch should only be called once
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should use default config URL if none provided', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockConfig),
      });

      provider = new BrowserConfigProvider();
      await provider.getConfig();

      expect(global.fetch).toHaveBeenCalledWith('/api/config');
    });

    it('should return default config if API fetch fails', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      provider = new BrowserConfigProvider('/api/config');
      const result = await provider.getConfig();

      expect(result).toEqual({
        zhtpNodeUrl: 'http://localhost:8000',
        networkType: 'testnet',
        debugMode: true,
        enableBiometrics: true,
      });
    });

    it('should handle API response that is not ok', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      provider = new BrowserConfigProvider('/api/config');
      const result = await provider.getConfig();

      expect(result).toEqual({
        zhtpNodeUrl: 'http://localhost:8000',
        networkType: 'testnet',
        debugMode: true,
        enableBiometrics: true,
      });
    });

    it('should return default config if localStorage has invalid JSON', async () => {
      localStorage.setItem('zhtp_config', 'invalid json');
      provider = new BrowserConfigProvider();

      const result = await provider.getConfig();

      expect(result).toEqual({
        zhtpNodeUrl: 'http://localhost:8000',
        networkType: 'testnet',
        debugMode: true,
        enableBiometrics: true,
      });
    });

    it('should handle missing localStorage gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockConfig),
      });

      provider = new BrowserConfigProvider('/api/config');
      // Simulate localStorage not available
      const localStorageBackup = global.localStorage;
      delete (global as any).localStorage;

      const result = await provider.getConfig();

      expect(result).toEqual(mockConfig);

      // Restore localStorage
      (global as any).localStorage = localStorageBackup;
    });

    it('should prioritize localStorage over API', async () => {
      const localConfig: ApiConfig = {
        zhtpNodeUrl: 'http://local:8000',
        networkType: 'testnet',
        debugMode: false,
        enableBiometrics: false,
      };

      localStorage.setItem('zhtp_config', JSON.stringify(localConfig));
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockConfig),
      });

      provider = new BrowserConfigProvider('/api/config');
      const result = await provider.getConfig();

      expect(result).toEqual(localConfig);
      // fetch should not be called
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('updateConfig()', () => {
    it('should update config in memory', async () => {
      provider = new BrowserConfigProvider();
      (provider as any).cache = mockConfig;

      const updates = { debugMode: false };
      await provider.updateConfig(updates);

      const result = await provider.getConfig();
      expect(result.debugMode).toBe(false);
      expect(result.zhtpNodeUrl).toBe(mockConfig.zhtpNodeUrl);
    });

    it('should merge partial updates with existing config', async () => {
      provider = new BrowserConfigProvider();
      (provider as any).cache = mockConfig;

      await provider.updateConfig({ networkType: 'testnet' });

      const result = await provider.getConfig();
      expect(result.networkType).toBe('testnet');
      expect(result.zhtpNodeUrl).toBe(mockConfig.zhtpNodeUrl);
      expect(result.debugMode).toBe(mockConfig.debugMode);
    });

    it('should persist updated config to localStorage', async () => {
      localStorage.setItem('zhtp_config', JSON.stringify(mockConfig));
      provider = new BrowserConfigProvider();
      await provider.getConfig();

      const updates = { zhtpNodeUrl: 'http://new-api:8000' };
      await provider.updateConfig(updates);

      const cached = localStorage.getItem('zhtp_config');
      const parsed = JSON.parse(cached!);
      expect(parsed.zhtpNodeUrl).toBe('http://new-api:8000');
    });

    it('should handle updateConfig when cache is null', async () => {
      provider = new BrowserConfigProvider();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockConfig),
      });

      // First call to populate cache from API
      await provider.getConfig();

      const updates = { debugMode: false };
      await provider.updateConfig(updates);

      const result = await provider.getConfig();
      expect(result.debugMode).toBe(false);
    });

    it('should handle localStorage write errors gracefully', async () => {
      provider = new BrowserConfigProvider();
      (provider as any).cache = mockConfig;

      // Mock localStorage.setItem to throw error
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      setItemSpy.mockImplementationOnce(() => {
        throw new Error('QuotaExceededError');
      });

      // Should not throw, just log warning
      await expect(provider.updateConfig({ debugMode: false })).resolves.toBeUndefined();

      setItemSpy.mockRestore();
    });
  });

  describe('clearCache()', () => {
    it('should clear in-memory cache', async () => {
      provider = new BrowserConfigProvider();
      (provider as any).cache = mockConfig;

      provider.clearCache();

      expect((provider as any).cache).toBeNull();
    });

    it('should clear localStorage', () => {
      localStorage.setItem('zhtp_config', JSON.stringify(mockConfig));
      provider = new BrowserConfigProvider();

      provider.clearCache();

      expect(localStorage.getItem('zhtp_config')).toBeNull();
    });

    it('should force reload from API on next getConfig()', async () => {
      localStorage.setItem('zhtp_config', JSON.stringify(mockConfig));
      provider = new BrowserConfigProvider('/api/config');

      // First call loads from localStorage
      const config1 = await provider.getConfig();
      expect(config1).toEqual(mockConfig);

      // Clear cache
      provider.clearCache();

      const newConfig: ApiConfig = {
        zhtpNodeUrl: 'http://new-api:8000',
        networkType: 'testnet',
        debugMode: false,
        enableBiometrics: false,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(newConfig),
      });

      // Next call should fetch from API
      const config2 = await provider.getConfig();
      expect(config2).toEqual(newConfig);
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should handle localStorage removal errors gracefully', () => {
      provider = new BrowserConfigProvider();

      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');
      removeItemSpy.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      // Should not throw
      expect(() => provider.clearCache()).not.toThrow();

      removeItemSpy.mockRestore();
    });
  });

  describe('Constructor', () => {
    it('should use custom config URL', () => {
      provider = new BrowserConfigProvider('http://custom-api/config');
      expect((provider as any).configUrl).toBe('http://custom-api/config');
    });

    it('should initialize with default config URL', () => {
      provider = new BrowserConfigProvider();
      expect((provider as any).configUrl).toBe('/api/config');
    });

    it('should initialize with null cache', () => {
      provider = new BrowserConfigProvider();
      expect((provider as any).cache).toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should log warning when localStorage read fails', async () => {
      provider = new BrowserConfigProvider();

      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
      getItemSpy.mockImplementationOnce(() => {
        throw new Error('Storage access denied');
      });

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockConfig),
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = await provider.getConfig();

      expect(consoleSpy).toHaveBeenCalled();
      expect(result).toBeTruthy();

      consoleSpy.mockRestore();
      getItemSpy.mockRestore();
    });

    it('should continue to API when localStorage is not available', async () => {
      const localStorageBackup = global.localStorage;
      delete (global as any).localStorage;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockConfig),
      });

      provider = new BrowserConfigProvider('/api/config');
      const result = await provider.getConfig();

      expect(result).toEqual(mockConfig);
      expect(global.fetch).toHaveBeenCalled();

      (global as any).localStorage = localStorageBackup;
    });
  });
});
