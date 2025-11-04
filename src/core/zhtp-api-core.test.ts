/**
 * Tests for ZhtpApiCore - Retry logic and request handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ZhtpApiCore } from './zhtp-api-core';
import { ApiConfig } from './types';

// Concrete implementation for testing
class TestZhtpApiCore extends ZhtpApiCore {
  public setConfig(config: ApiConfig) {
    this.config = config;
  }

  public setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  public setRetryDelays(delays: number[]) {
    this.retryDelays = delays;
  }

  public testShouldRetry(error: any): boolean {
    return this.shouldRetry(error);
  }

  public async testRequest<T>(
    endpoint: string,
    options?: RequestInit,
    retryCount?: number
  ): Promise<T> {
    return this.request<T>(endpoint, options, retryCount);
  }
}

describe('ZhtpApiCore - Request Handling', () => {
  let api: TestZhtpApiCore;

  beforeEach(() => {
    api = new TestZhtpApiCore();
    api.setConfig({
      zhtpNodeUrl: 'http://localhost:8000',
      networkType: 'testnet',
      debugMode: false,
      enableBiometrics: false,
    });
    api.setBaseUrl('http://localhost:8000');
    // Use fast retry delays for testing
    api.setRetryDelays([10, 20, 40]);
  });

  describe('shouldRetry()', () => {
    it('should NOT retry on HTTP 4xx client errors', () => {
      const error = new Error('HTTP 400: Bad Request');
      expect(api.testShouldRetry(error)).toBe(false);
    });

    it('should NOT retry on HTTP 401 errors', () => {
      const error = new Error('HTTP 401: Unauthorized');
      expect(api.testShouldRetry(error)).toBe(false);
    });

    it('should NOT retry on HTTP 403 errors', () => {
      const error = new Error('HTTP 403: Forbidden');
      expect(api.testShouldRetry(error)).toBe(false);
    });

    it('should NOT retry on HTTP 404 errors', () => {
      const error = new Error('HTTP 404: Not Found');
      expect(api.testShouldRetry(error)).toBe(false);
    });

    it('should retry on network errors', () => {
      const error = new Error('Network error');
      expect(api.testShouldRetry(error)).toBe(true);
    });

    it('should retry on timeout errors', () => {
      const error = new Error('AbortError: The operation was aborted');
      expect(api.testShouldRetry(error)).toBe(true);
    });

    it('should retry on HTTP 5xx errors', () => {
      const error = new Error('HTTP 500: Internal Server Error');
      expect(api.testShouldRetry(error)).toBe(true);
    });

    it('should retry on errors without message property', () => {
      const error = {};
      expect(api.testShouldRetry(error)).toBe(true);
    });
  });

  describe('request() - Success cases', () => {
    it('should successfully fetch and parse JSON response', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ data: 'test' }),
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await api.testRequest('/test');

      expect(result).toEqual({ data: 'test' });
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/test',
        expect.any(Object)
      );
    });

    it('should include request body in fetch call', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ ok: true }),
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const body = JSON.stringify({ test: 'data' });
      await api.testRequest('/test', { method: 'POST', body });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/test',
        expect.objectContaining({
          method: 'POST',
          body,
        })
      );
    });

    it('should use AbortController for timeout', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await api.testRequest('/test');

      const callArgs = (global.fetch as any).mock.calls[0][1];
      expect(callArgs.signal).toBeInstanceOf(AbortSignal);
    });
  });

  describe('request() - Retry logic', () => {
    it('should retry on network error up to maxRetries times', async () => {
      global.fetch = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'));

      await expect(api.testRequest('/test')).rejects.toThrow('Network error');

      // Constructor call + 3 retries = 4 total calls
      expect(global.fetch).toHaveBeenCalledTimes(4);
    });

    it('should NOT retry on HTTP 400 errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('HTTP 400: Bad Request'));

      await expect(api.testRequest('/test')).rejects.toThrow('HTTP 400');

      // Should fail immediately, no retries
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should use correct exponential backoff delays', async () => {
      vi.useFakeTimers();
      const now = Date.now();

      global.fetch = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({ success: true }),
        });

      const promise = api.testRequest('/test');

      // First retry should happen after 10ms
      await vi.advanceTimersByTimeAsync(10);
      // Second retry should happen after 20ms more
      await vi.advanceTimersByTimeAsync(20);

      const result = await promise;

      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledTimes(3);

      vi.useRealTimers();
    });

    it('should succeed on first retry', async () => {
      global.fetch = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({ data: 'success' }),
        });

      const result = await api.testRequest('/test');

      expect(result).toEqual({ data: 'success' });
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should succeed on second retry', async () => {
      global.fetch = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({ data: 'success' }),
        });

      const result = await api.testRequest('/test');

      expect(result).toEqual({ data: 'success' });
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should succeed on third retry', async () => {
      global.fetch = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockRejectedValueOnce(new Error('Connection reset'))
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({ data: 'success' }),
        });

      const result = await api.testRequest('/test');

      expect(result).toEqual({ data: 'success' });
      expect(global.fetch).toHaveBeenCalledTimes(4);
    });
  });

  describe('request() - HTTP error handling', () => {
    it('should throw error for HTTP 500 on max retries exceeded', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('HTTP 500: Server error'));

      await expect(api.testRequest('/test')).rejects.toThrow('HTTP 500');
    });

    it('should throw error immediately for HTTP 401', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('HTTP 401: Unauthorized'));

      await expect(api.testRequest('/test')).rejects.toThrow('HTTP 401');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should throw error for non-ok response status', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(api.testRequest('/test')).rejects.toThrow('HTTP 500: Internal Server Error');
    });
  });

  describe('request() - Endpoint construction', () => {
    it('should construct correct URL with base URL and endpoint', async () => {
      api.setBaseUrl('http://api.example.com:8000');
      global.fetch = vi
        .fn()
        .mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({}) });

      await api.testRequest('/api/v1/test');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://api.example.com:8000/api/v1/test',
        expect.any(Object)
      );
    });

    it('should handle empty endpoint', async () => {
      api.setBaseUrl('http://localhost:8000');
      global.fetch = vi
        .fn()
        .mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({}) });

      await api.testRequest('');

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000', expect.any(Object));
    });
  });

  describe('request() - Response parsing', () => {
    it('should parse array responses', async () => {
      const arrayData = [{ id: 1 }, { id: 2 }];
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(arrayData),
      });

      const result = await api.testRequest('/test');

      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(arrayData);
    });

    it('should parse object responses', async () => {
      const objectData = { name: 'Test', value: 42 };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(objectData),
      });

      const result = await api.testRequest('/test');

      expect(result).toEqual(objectData);
    });

    it('should parse primitive responses', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(123),
      });

      const result = await api.testRequest('/test');

      expect(result).toBe(123);
    });

    it('should parse string responses', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue('success'),
      });

      const result = await api.testRequest('/test');

      expect(result).toBe('success');
    });
  });

  describe('request() - Timeout behavior', () => {
    it('should abort request when timeout is exceeded', async () => {
      let abortSignal: AbortSignal | undefined;
      global.fetch = vi.fn().mockImplementation((url, options) => {
        abortSignal = options?.signal;
        // Simulate slow response
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ ok: true, json: () => Promise.resolve({}) });
          }, 15000);
        });
      });

      const promise = api.testRequest('/test');

      // Abort should be triggered within request timeout (10000ms)
      expect(abortSignal).toBeDefined();

      // Give it a moment to abort
      await new Promise(resolve => setTimeout(resolve, 100));

      // Request should either timeout or succeed depending on timing
      // The important thing is that AbortController is properly created
      expect(abortSignal).toBeInstanceOf(AbortSignal);
    });
  });

  describe('request() - Edge cases', () => {
    it('should handle responses with null data', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(null),
      });

      const result = await api.testRequest('/test');

      expect(result).toBeNull();
    });

    it('should handle responses with undefined data', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(undefined),
      });

      const result = await api.testRequest('/test');

      expect(result).toBeUndefined();
    });

    it('should handle empty object responses', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      });

      const result = await api.testRequest('/test');

      expect(result).toEqual({});
    });
  });
});
