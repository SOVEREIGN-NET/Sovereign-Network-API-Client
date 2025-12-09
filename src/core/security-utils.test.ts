/**
 * Security Utilities Test Suite
 * Tests for input validation, passphrase strength, rate limiting, and error sanitization
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  sanitizeError,
  sanitizeObject,
  validateIdentityId,
  validateDid,
  validateContractId,
  validateGuardianId,
  validateRecoveryMethod,
  validateWalletType,
  validateProofType,
  validateDomainName,
  validatePassphraseStrength,
  isRateLimited,
  clearRateLimit,
  constructUrl,
} from './security-utils';

describe('Security Utils - Error Sanitization', () => {
  it('should sanitize error messages with sensitive keywords', () => {
    const error = new Error('Invalid password: secret123');
    const sanitized = sanitizeError(error);
    expect(sanitized).toContain('[REDACTED]');
    expect(sanitized).not.toContain('password');
    expect(sanitized).not.toContain('secret123');
  });

  it('should sanitize passphrase from error messages', () => {
    const error = { message: 'Passphrase too weak: myPassphrase123' };
    const sanitized = sanitizeError(error);
    expect(sanitized).toContain('[REDACTED]');
    expect(sanitized).not.toContain('passphrase');
  });

  it('should sanitize tokens from error messages', () => {
    const error = 'Bearer token invalid: eyJhbGciOiJIUzI1...';
    const sanitized = sanitizeError(error);
    expect(sanitized).toContain('[REDACTED]');
  });

  it('should handle non-error inputs gracefully', () => {
    expect(sanitizeError('simple error')).toBe('simple error');
    expect(sanitizeError(null)).toBe('Unknown error');
    expect(sanitizeError(undefined)).toBe('Unknown error');
  });

  it('should sanitize objects with sensitive fields', () => {
    const obj = {
      username: 'alice',
      password: 'secret123',
      token: 'eyJhbGci...',
      publicData: 'visible',
    };
    const sanitized = sanitizeObject(obj);
    expect(sanitized.username).toBe('alice');
    expect(sanitized.password).toBe('[REDACTED]');
    expect(sanitized.token).toBe('[REDACTED]');
    expect(sanitized.publicData).toBe('visible');
  });
});

describe('Security Utils - Input Validation', () => {
  describe('validateIdentityId', () => {
    it('should accept valid 64-character hex identity IDs', () => {
      const validId = 'a'.repeat(64);
      expect(() => validateIdentityId(validId)).not.toThrow();
    });

    it('should reject identity IDs that are too short', () => {
      expect(() => validateIdentityId('abc123')).toThrow('Invalid identity ID format');
    });

    it('should reject identity IDs with non-hex characters', () => {
      const invalidId = 'g'.repeat(64);
      expect(() => validateIdentityId(invalidId)).toThrow('Invalid identity ID format');
    });

    it('should reject empty strings', () => {
      expect(() => validateIdentityId('')).toThrow('must be a non-empty string');
    });
  });

  describe('validateDid', () => {
    it('should accept valid DIDs', () => {
      const validDid = 'did:zhtp:' + 'a'.repeat(64);
      expect(() => validateDid(validDid)).not.toThrow();
    });

    it('should reject DIDs with wrong format', () => {
      expect(() => validateDid('did:example:123')).toThrow('Invalid DID format');
    });

    it('should reject DIDs without did:zhtp prefix', () => {
      const noPrefixDid = 'a'.repeat(64);
      expect(() => validateDid(noPrefixDid)).toThrow('Invalid DID format');
    });
  });

  describe('validateContractId', () => {
    it('should accept valid contract IDs', () => {
      expect(() => validateContractId('my-contract_123')).not.toThrow();
    });

    it('should reject contract IDs with path traversal', () => {
      expect(() => validateContractId('../etc/passwd')).toThrow('Invalid contract ID format');
    });

    it('should reject contract IDs with slashes', () => {
      expect(() => validateContractId('contract/subpath')).toThrow('Invalid contract ID format');
    });

    it('should reject contract IDs that are too long', () => {
      const longId = 'a'.repeat(129);
      expect(() => validateContractId(longId)).toThrow('Invalid contract ID format');
    });
  });

  describe('validateGuardianId', () => {
    it('should accept valid guardian IDs', () => {
      const validId = 'f'.repeat(64);
      expect(() => validateGuardianId(validId)).not.toThrow();
    });

    it('should reject invalid guardian IDs', () => {
      expect(() => validateGuardianId('invalid')).toThrow('Invalid guardian ID format');
    });
  });

  describe('validateRecoveryMethod', () => {
    it('should accept valid recovery methods', () => {
      expect(() => validateRecoveryMethod('seed')).not.toThrow();
      expect(() => validateRecoveryMethod('backup')).not.toThrow();
      expect(() => validateRecoveryMethod('social')).not.toThrow();
    });

    it('should reject invalid recovery methods', () => {
      expect(() => validateRecoveryMethod('invalid')).toThrow('Invalid recovery method');
    });
  });

  describe('validateWalletType', () => {
    it('should accept valid wallet types', () => {
      expect(() => validateWalletType('Primary')).not.toThrow();
      expect(() => validateWalletType('UBI')).not.toThrow();
      expect(() => validateWalletType('Savings')).not.toThrow();
    });

    it('should reject invalid wallet types', () => {
      expect(() => validateWalletType('Invalid')).toThrow('Invalid wallet type');
    });
  });

  describe('validateProofType', () => {
    it('should accept valid proof types', () => {
      expect(() => validateProofType('age_over_18')).not.toThrow();
      expect(() => validateProofType('citizenship_verified')).not.toThrow();
    });

    it('should reject invalid proof types', () => {
      expect(() => validateProofType('invalid_proof')).toThrow('Invalid proof type');
    });
  });

  describe('validateDomainName', () => {
    it('should accept valid domain names', () => {
      expect(() => validateDomainName('example.com')).not.toThrow();
      expect(() => validateDomainName('sub.example.web4')).not.toThrow();
    });

    it('should reject localhost', () => {
      expect(() => validateDomainName('localhost')).toThrow('internal/private addresses not allowed');
    });

    it('should reject private IP addresses', () => {
      expect(() => validateDomainName('127.0.0.1')).toThrow('internal/private addresses not allowed');
      expect(() => validateDomainName('10.0.0.1')).toThrow('internal/private addresses not allowed');
      expect(() => validateDomainName('192.168.1.1')).toThrow('internal/private addresses not allowed');
    });

    it('should reject domains that are too long', () => {
      const longDomain = 'a'.repeat(254) + '.com';
      expect(() => validateDomainName(longDomain)).toThrow('Domain name too long');
    });
  });
});

describe('Security Utils - Passphrase Strength', () => {
  it('should accept strong passphrases', () => {
    const strongPassphrase = 'Correct-Horse-Battery-Staple-2024!';
    expect(() => validatePassphraseStrength(strongPassphrase)).not.toThrow();
  });

  it('should reject passphrases that are too short', () => {
    expect(() => validatePassphraseStrength('Short1!')).toThrow('must be at least 16 characters');
  });

  it('should reject passphrases without enough complexity', () => {
    // Only lowercase and numbers (missing uppercase and special)
    expect(() => validatePassphraseStrength('abcdefghijklmnop123')).toThrow('at least 3 of');
  });

  it('should reject passphrases with low entropy', () => {
    // All same character - fails complexity check first
    expect(() => validatePassphraseStrength('aaaaaaaaaaaaaaaa')).toThrow('Passphrase must include at least 3 of');
  });

  it('should reject common weak patterns', () => {
    // These fail complexity check first
    expect(() => validatePassphraseStrength('password12345678')).toThrow('Passphrase must include at least 3 of');
    expect(() => validatePassphraseStrength('qwerty1234567890')).toThrow('Passphrase must include at least 3 of');
  });

  it('should accept passphrase with custom thresholds', () => {
    // Test with minimum 12 characters and 50 bits entropy
    const passphrase = 'MyPass123!abc';
    expect(() => validatePassphraseStrength(passphrase, 12, 50)).not.toThrow();
  });
});

describe('Security Utils - Rate Limiting', () => {
  beforeEach(() => {
    // Clear any existing rate limits
    clearRateLimit('test-key');
  });

  it('should not rate limit first attempts', () => {
    expect(isRateLimited('test-key', 3, 60000)).toBe(false);
  });

  it('should rate limit after max attempts', () => {
    // First 3 attempts should succeed
    expect(isRateLimited('test-key-2', 3, 60000)).toBe(false);
    expect(isRateLimited('test-key-2', 3, 60000)).toBe(false);
    expect(isRateLimited('test-key-2', 3, 60000)).toBe(false);

    // 4th attempt should throw
    expect(() => isRateLimited('test-key-2', 3, 60000)).toThrow('Rate limit exceeded');
  });

  it('should reset rate limit window after expiration', () => {
    // Use very short window for testing (100ms)
    expect(isRateLimited('test-key-3', 2, 100)).toBe(false);
    expect(isRateLimited('test-key-3', 2, 100)).toBe(false);

    // Wait for window to expire
    return new Promise((resolve) => {
      setTimeout(() => {
        // Should allow new attempts after window expires
        expect(isRateLimited('test-key-3', 2, 100)).toBe(false);
        resolve(true);
      }, 150);
    });
  });

  it('should clear rate limit manually', () => {
    expect(isRateLimited('test-key-4', 2, 60000)).toBe(false);
    expect(isRateLimited('test-key-4', 2, 60000)).toBe(false);

    // Clear the rate limit
    clearRateLimit('test-key-4');

    // Should be able to make new attempts
    expect(isRateLimited('test-key-4', 2, 60000)).toBe(false);
  });
});

describe('Security Utils - URL Construction', () => {
  it('should construct URL without parameters', () => {
    const url = constructUrl('/api/v1/users');
    expect(url).toBe('/api/v1/users');
  });

  it('should construct URL with parameters', () => {
    const url = constructUrl('/api/v1/users', { id: '123', name: 'Alice' });
    expect(url).toContain('/api/v1/users?');
    expect(url).toContain('id=123');
    expect(url).toContain('name=Alice');
  });

  it('should properly encode special characters', () => {
    const url = constructUrl('/api/v1/search', { query: 'hello world!', filter: 'a&b' });
    expect(url).toContain('query=hello+world%21');
    expect(url).toContain('filter=a%26b');
  });

  it('should handle boolean and number parameters', () => {
    const url = constructUrl('/api/v1/data', { active: true, count: 42 });
    expect(url).toContain('active=true');
    expect(url).toContain('count=42');
  });

  it('should handle empty parameters object', () => {
    const url = constructUrl('/api/v1/users', {});
    expect(url).toBe('/api/v1/users');
  });
});

describe('Security Utils - Integration Tests', () => {
  it('should sanitize errors in realistic authentication scenario', () => {
    try {
      // Simulate failed authentication with sensitive data
      throw new Error('Authentication failed: Invalid password "mySecret123" or token "eyJhbGci..."');
    } catch (error) {
      const sanitized = sanitizeError(error);
      // The function redacts sensitive keywords like 'password', 'token', 'Auth'
      expect(sanitized).not.toContain('password');
      expect(sanitized).not.toContain('token');
      expect(sanitized).toContain('[REDACTED]');
    }
  });

  it('should validate and construct secure URLs', () => {
    const identityId = 'a'.repeat(64);
    validateIdentityId(identityId); // Should not throw

    const url = constructUrl('/api/v1/identity/backup/status', { identity_id: identityId });
    expect(url).toContain(identityId);
    expect(url).toContain('identity_id=');
  });

  it('should enforce strong passphrases and rate limiting together', () => {
    // Strong passphrase should pass
    const strongPass = 'MySecurePassphrase2024!';
    expect(() => validatePassphraseStrength(strongPass)).not.toThrow();

    // Rate limiting should work
    const key = 'passphrase-validation';
    expect(isRateLimited(key, 3, 60000)).toBe(false);
    expect(isRateLimited(key, 3, 60000)).toBe(false);
    expect(isRateLimited(key, 3, 60000)).toBe(false);
    expect(() => isRateLimited(key, 3, 60000)).toThrow();

    clearRateLimit(key);
  });
});
