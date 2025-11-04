/**
 * Tests for ReactNativeConfigProvider
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReactNativeConfigProvider } from './config-provider';
import { ApiConfig } from '../core/types';

describe('ReactNativeConfigProvider', () => {
  let provider: ReactNativeConfigProvider;
  const mockConfig: ApiConfig = {
    zhtpNodeUrl: 'http://192.168.1.31:8000',
    networkType: 'testnet',
    debugMode: true,
    enableBiometrics: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getConfig()', () => {
    it('should load config from AsyncStorage if available', async () => {
      const mockAsyncStorage = {
        getItem: vi.fn().mockResolvedValue(JSON.stringify(mockConfig)),
        setItem: vi.fn().mockResolvedValue(undefined),
      };

      provider = new ReactNativeConfigProvider(undefined, mockAsyncStorage);
      const result = await provider.getConfig();

      expect(result).toEqual(mockConfig);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('zhtp_config');
    });

    it('should use environment variables if provided', async () => {
      const envVars = {
        ZHTP_NODE_URL: 'http://custom-api:9000',
        NETWORK_TYPE: 'mainnet',
        DEBUG_MODE: 'true',
        ENABLE_BIOMETRICS: 'false',
      };

      provider = new ReactNativeConfigProvider(envVars);
      const result = await provider.getConfig();

      expect(result.zhtpNodeUrl).toBe('http://custom-api:9000');
      expect(result.networkType).toBe('mainnet');
      expect(result.debugMode).toBe(true);
      expect(result.enableBiometrics).toBe(false);
    });

    it('should prioritize AsyncStorage over environment variables', async () => {
      const mockAsyncStorage = {
        getItem: vi.fn().mockResolvedValue(JSON.stringify(mockConfig)),
        setItem: vi.fn().mockResolvedValue(undefined),
      };

      const envVars = {
        ZHTP_NODE_URL: 'http://different-api:8000',
      };

      provider = new ReactNativeConfigProvider(envVars, mockAsyncStorage);
      const result = await provider.getConfig();

      // Should return cached config from AsyncStorage, not env var
      expect(result.zhtpNodeUrl).toBe('http://192.168.1.31:8000');
    });

    it('should use environment variables if AsyncStorage is not available', async () => {
      const envVars = {
        ZHTP_NODE_URL: 'http://env-api:8000',
        NETWORK_TYPE: 'mainnet',
      };

      provider = new ReactNativeConfigProvider(envVars);
      const result = await provider.getConfig();

      expect(result.zhtpNodeUrl).toBe('http://env-api:8000');
      expect(result.networkType).toBe('mainnet');
    });

    it('should return defaults if no config source available', async () => {
      provider = new ReactNativeConfigProvider();
      const result = await provider.getConfig();

      expect(result.zhtpNodeUrl).toBe('http://localhost:8000');
      expect(result.networkType).toBe('testnet');
      expect(result.debugMode).toBeFalsy();
      expect(result.enableBiometrics).toBe(true);
    });

    it('should parse DEBUG_MODE string "true" as boolean true', async () => {
      const envVars = { DEBUG_MODE: 'true' };
      provider = new ReactNativeConfigProvider(envVars);
      const result = await provider.getConfig();

      expect(result.debugMode).toBe(true);
      expect(typeof result.debugMode).toBe('boolean');
    });

    it('should parse DEBUG_MODE boolean true correctly', async () => {
      const envVars = { DEBUG_MODE: true };
      provider = new ReactNativeConfigProvider(envVars);
      const result = await provider.getConfig();

      expect(result.debugMode).toBe(true);
    });

    it('should parse ENABLE_BIOMETRICS false correctly', async () => {
      const envVars = { ENABLE_BIOMETRICS: false };
      provider = new ReactNativeConfigProvider(envVars);
      const result = await provider.getConfig();

      expect(result.enableBiometrics).toBe(false);
    });

    it('should parse ENABLE_BIOMETRICS string "false" correctly', async () => {
      const envVars = { ENABLE_BIOMETRICS: 'false' };
      provider = new ReactNativeConfigProvider(envVars);
      const result = await provider.getConfig();

      expect(result.enableBiometrics).toBe(false);
    });

    it('should default enableBiometrics to true if not specified', async () => {
      provider = new ReactNativeConfigProvider();
      const result = await provider.getConfig();

      expect(result.enableBiometrics).toBe(true);
    });

    it('should cache config in AsyncStorage after loading from env', async () => {
      const mockAsyncStorage = {
        getItem: vi.fn().mockResolvedValue(null),
        setItem: vi.fn().mockResolvedValue(undefined),
      };

      const envVars = {
        ZHTP_NODE_URL: 'http://test-api:8000',
      };

      provider = new ReactNativeConfigProvider(envVars, mockAsyncStorage);
      await provider.getConfig();

      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
      const callArg = (mockAsyncStorage.setItem as any).mock.calls[0][1];
      const cached = JSON.parse(callArg);
      expect(cached.zhtpNodeUrl).toBe('http://test-api:8000');
    });

    it('should handle AsyncStorage.getItem returning null', async () => {
      const mockAsyncStorage = {
        getItem: vi.fn().mockResolvedValue(null),
        setItem: vi.fn().mockResolvedValue(undefined),
      };

      const envVars = {
        ZHTP_NODE_URL: 'http://fallback-api:8000',
      };

      provider = new ReactNativeConfigProvider(envVars, mockAsyncStorage);
      const result = await provider.getConfig();

      expect(result.zhtpNodeUrl).toBe('http://fallback-api:8000');
    });

    it('should handle invalid JSON in AsyncStorage', async () => {
      const mockAsyncStorage = {
        getItem: vi.fn().mockResolvedValue('invalid json'),
        setItem: vi.fn().mockResolvedValue(undefined),
      };

      const envVars = {
        ZHTP_NODE_URL: 'http://fallback-api:8000',
      };

      provider = new ReactNativeConfigProvider(envVars, mockAsyncStorage);
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await provider.getConfig();

      expect(result.zhtpNodeUrl).toBe('http://fallback-api:8000');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle AsyncStorage.getItem error', async () => {
      const mockAsyncStorage = {
        getItem: vi
          .fn()
          .mockRejectedValue(new Error('AsyncStorage error')),
        setItem: vi.fn().mockResolvedValue(undefined),
      };

      const envVars = {
        ZHTP_NODE_URL: 'http://fallback-api:8000',
      };

      provider = new ReactNativeConfigProvider(envVars, mockAsyncStorage);
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await provider.getConfig();

      expect(result.zhtpNodeUrl).toBe('http://fallback-api:8000');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle AsyncStorage.setItem error silently', async () => {
      const mockAsyncStorage = {
        getItem: vi.fn().mockResolvedValue(null),
        setItem: vi
          .fn()
          .mockRejectedValue(new Error('Storage full')),
      };

      const envVars = { ZHTP_NODE_URL: 'http://test:8000' };

      provider = new ReactNativeConfigProvider(envVars, mockAsyncStorage);
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await provider.getConfig();

      expect(result.zhtpNodeUrl).toBe('http://test:8000');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('updateConfig()', () => {
    it('should update config and persist to AsyncStorage', async () => {
      const mockAsyncStorage = {
        getItem: vi.fn().mockResolvedValue(JSON.stringify(mockConfig)),
        setItem: vi.fn().mockResolvedValue(undefined),
      };

      provider = new ReactNativeConfigProvider(undefined, mockAsyncStorage);

      const updates = { debugMode: false };
      await provider.updateConfig(updates);

      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
      const callArg = (mockAsyncStorage.setItem as any).mock.calls[
        (mockAsyncStorage.setItem as any).mock.calls.length - 1
      ][1];
      const updated = JSON.parse(callArg);
      expect(updated.debugMode).toBe(false);
    });

    it('should merge partial updates with existing config', async () => {
      const mockAsyncStorage = {
        getItem: vi.fn().mockResolvedValue(JSON.stringify(mockConfig)),
        setItem: vi.fn().mockResolvedValue(undefined),
      };

      provider = new ReactNativeConfigProvider(undefined, mockAsyncStorage);

      await provider.updateConfig({ networkType: 'mainnet' });

      const callArg = (mockAsyncStorage.setItem as any).mock.calls[
        (mockAsyncStorage.setItem as any).mock.calls.length - 1
      ][1];
      const updated = JSON.parse(callArg);
      expect(updated.networkType).toBe('mainnet');
      expect(updated.zhtpNodeUrl).toBe(mockConfig.zhtpNodeUrl);
    });

    it('should throw error if AsyncStorage not available', async () => {
      provider = new ReactNativeConfigProvider();

      await expect(provider.updateConfig({ debugMode: false })).rejects.toThrow(
        'AsyncStorage not available'
      );
    });

    it('should handle AsyncStorage.setItem error', async () => {
      const mockAsyncStorage = {
        getItem: vi.fn().mockResolvedValue(JSON.stringify(mockConfig)),
        setItem: vi
          .fn()
          .mockRejectedValue(new Error('Storage error')),
      };

      provider = new ReactNativeConfigProvider(undefined, mockAsyncStorage);

      await expect(
        provider.updateConfig({ debugMode: false })
      ).rejects.toThrow('Storage error');
    });
  });

  describe('clearCache()', () => {
    it('should clear AsyncStorage cache', async () => {
      const mockAsyncStorage = {
        removeItem: vi.fn().mockResolvedValue(undefined),
      };

      provider = new ReactNativeConfigProvider(undefined, mockAsyncStorage);
      await provider.clearCache();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('zhtp_config');
    });

    it('should handle AsyncStorage.removeItem error', async () => {
      const mockAsyncStorage = {
        removeItem: vi
          .fn()
          .mockRejectedValue(new Error('Remove failed')),
      };

      provider = new ReactNativeConfigProvider(undefined, mockAsyncStorage);
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await provider.clearCache();

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should do nothing if AsyncStorage not available', async () => {
      provider = new ReactNativeConfigProvider();

      // Should not throw
      await expect(provider.clearCache()).resolves.toBeUndefined();
    });
  });

  describe('Constructor', () => {
    it('should accept environment variables', () => {
      const envVars = { ZHTP_NODE_URL: 'http://test:8000' };
      provider = new ReactNativeConfigProvider(envVars);

      expect((provider as any).envVars).toEqual(envVars);
    });

    it('should accept AsyncStorage instance', () => {
      const mockAsyncStorage = { getItem: vi.fn() };
      provider = new ReactNativeConfigProvider(undefined, mockAsyncStorage);

      expect((provider as any).AsyncStorage).toBe(mockAsyncStorage);
    });

    it('should initialize empty envVars if none provided', () => {
      provider = new ReactNativeConfigProvider();

      expect((provider as any).envVars).toEqual({});
    });

    it('should initialize cache key', () => {
      provider = new ReactNativeConfigProvider();

      expect((provider as any).cacheKey).toBe('zhtp_config');
    });
  });

  describe('Environment Variable Priority', () => {
    it('should check envVars first, then process.env', async () => {
      const envVars = {
        ZHTP_NODE_URL: 'http://from-envvars:8000',
      };

      provider = new ReactNativeConfigProvider(envVars);
      const result = await provider.getConfig();

      expect(result.zhtpNodeUrl).toBe('http://from-envvars:8000');
    });

    it('should fall back to defaults if neither envVars nor process.env set', async () => {
      provider = new ReactNativeConfigProvider({});
      const result = await provider.getConfig();

      expect(result.zhtpNodeUrl).toBe('http://localhost:8000');
      expect(result.networkType).toBe('testnet');
    });

    it('should handle NETWORK_TYPE as string', async () => {
      const envVars = {
        NETWORK_TYPE: 'mainnet',
      };

      provider = new ReactNativeConfigProvider(envVars);
      const result = await provider.getConfig();

      expect(result.networkType).toBe('mainnet');
    });

    it('should default NETWORK_TYPE to testnet', async () => {
      provider = new ReactNativeConfigProvider({});
      const result = await provider.getConfig();

      expect(result.networkType).toBe('testnet');
    });
  });

  describe('Boolean Flag Parsing', () => {
    it('should handle DEBUG_MODE as various truthy values', async () => {
      const testCases = [
        { DEBUG_MODE: true, expected: true },
        { DEBUG_MODE: 'true', expected: true },
        { DEBUG_MODE: false, expected: false },
        { DEBUG_MODE: 'false', expected: false },
      ];

      for (const testCase of testCases) {
        provider = new ReactNativeConfigProvider(testCase);
        const result = await provider.getConfig();
        expect(result.debugMode).toBe(testCase.expected);
      }
    });

    it('should handle ENABLE_BIOMETRICS as various values', async () => {
      const testCases = [
        { ENABLE_BIOMETRICS: true, expected: true },
        { ENABLE_BIOMETRICS: 'true', expected: true },
        { ENABLE_BIOMETRICS: false, expected: false },
        { ENABLE_BIOMETRICS: 'false', expected: false },
      ];

      for (const testCase of testCases) {
        provider = new ReactNativeConfigProvider(testCase);
        const result = await provider.getConfig();
        expect(result.enableBiometrics).toBe(testCase.expected);
      }
    });
  });

  describe('Full Config Objects', () => {
    it('should return complete config with all required fields', async () => {
      const envVars = {
        ZHTP_NODE_URL: 'http://api:8000',
        NETWORK_TYPE: 'testnet',
        DEBUG_MODE: false,
        ENABLE_BIOMETRICS: true,
      };

      provider = new ReactNativeConfigProvider(envVars);
      const result = await provider.getConfig();

      expect(result).toHaveProperty('zhtpNodeUrl');
      expect(result).toHaveProperty('networkType');
      expect(result).toHaveProperty('debugMode');
      expect(result).toHaveProperty('enableBiometrics');
      expect(Object.keys(result).length).toBe(4);
    });
  });
});
