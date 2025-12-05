/**
 * Security Utilities
 * Provides input validation, error sanitization, and security helpers
 */

// ==================== Error Sanitization ====================

/**
 * Sensitive field patterns to redact from logs and errors
 */
const SENSITIVE_PATTERNS = [
  /password/gi,
  /passphrase/gi,
  /token/gi,
  /key/gi,
  /seed/gi,
  /secret/gi,
  /auth/gi,
  /credential/gi,
  /private/gi,
  /signature/gi,
];

/**
 * Sanitize error messages to prevent credential leakage
 * @param error - Error object or message
 * @returns Sanitized error message safe for logging
 */
export function sanitizeError(error: any): string {
  let message = '';

  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  } else if (error?.message) {
    message = String(error.message);
  } else {
    message = 'Unknown error';
  }

  // Remove sensitive field values
  SENSITIVE_PATTERNS.forEach(pattern => {
    message = message.replace(pattern, '[REDACTED]');
  });

  // Remove potential JSON bodies that might contain credentials
  message = message.replace(/"[^"]*":\s*"[^"]*"/g, (match) => {
    for (const pattern of SENSITIVE_PATTERNS) {
      if (pattern.test(match)) {
        return '"[REDACTED]": "[REDACTED]"';
      }
    }
    return match;
  });

  return message;
}

/**
 * Sanitize object for logging (removes sensitive fields)
 */
export function sanitizeObject(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sanitized: any = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_PATTERNS.some(pattern => pattern.test(lowerKey));

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitized[key] = sanitizeObject(obj[key]);
    } else {
      sanitized[key] = obj[key];
    }
  }

  return sanitized;
}

// ==================== Input Validation ====================

/**
 * Validate identity ID format (64-character hex string)
 */
export function validateIdentityId(id: string): void {
  if (!id || typeof id !== 'string') {
    throw new Error('Identity ID must be a non-empty string');
  }

  if (!/^[0-9a-fA-F]{64}$/.test(id)) {
    throw new Error('Invalid identity ID format: must be 64-character hexadecimal string');
  }
}

/**
 * Validate DID format (did:zhtp:hexstring)
 */
export function validateDid(did: string): void {
  if (!did || typeof did !== 'string') {
    throw new Error('DID must be a non-empty string');
  }

  if (!/^did:zhtp:[0-9a-fA-F]{64}$/.test(did)) {
    throw new Error('Invalid DID format: must be "did:zhtp:" followed by 64-character hexadecimal string');
  }
}

/**
 * Validate contract ID format
 */
export function validateContractId(contractId: string): void {
  if (!contractId || typeof contractId !== 'string') {
    throw new Error('Contract ID must be a non-empty string');
  }

  // Allow alphanumeric, hyphens, underscores (no path traversal)
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(contractId)) {
    throw new Error('Invalid contract ID format: must be 1-128 alphanumeric characters, hyphens, or underscores');
  }

  // Reject path traversal attempts
  if (contractId.includes('..') || contractId.includes('/') || contractId.includes('\\')) {
    throw new Error('Invalid contract ID: path traversal not allowed');
  }
}

/**
 * Validate guardian ID format
 */
export function validateGuardianId(guardianId: string): void {
  if (!guardianId || typeof guardianId !== 'string') {
    throw new Error('Guardian ID must be a non-empty string');
  }

  if (!/^[0-9a-fA-F]{64}$/.test(guardianId)) {
    throw new Error('Invalid guardian ID format: must be 64-character hexadecimal string');
  }
}

/**
 * Validate recovery method enum
 */
export function validateRecoveryMethod(method: string): void {
  const validMethods = ['seed', 'backup', 'social'];
  if (!validMethods.includes(method)) {
    throw new Error(`Invalid recovery method: must be one of ${validMethods.join(', ')}`);
  }
}

/**
 * Validate wallet type enum
 */
export function validateWalletType(walletType: string): void {
  const validTypes = ['Primary', 'UBI', 'Savings', 'DAO', 'Staking'];
  if (!validTypes.includes(walletType)) {
    throw new Error(`Invalid wallet type: must be one of ${validTypes.join(', ')}`);
  }
}

/**
 * Validate proof type enum
 */
export function validateProofType(proofType: string): void {
  const validTypes = ['age_over_18', 'age_range', 'citizenship_verified', 'jurisdiction_membership'];
  if (!validTypes.includes(proofType)) {
    throw new Error(`Invalid proof type: must be one of ${validTypes.join(', ')}`);
  }
}

/**
 * Validate domain name format (prevent SSRF)
 */
export function validateDomainName(domain: string): void {
  if (!domain || typeof domain !== 'string') {
    throw new Error('Domain must be a non-empty string');
  }

  // Reject internal/private IP addresses
  const privateIpPatterns = [
    /^127\./,           // Localhost
    /^10\./,            // Private class A
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // Private class B
    /^192\.168\./,      // Private class C
    /^169\.254\./,      // Link-local
    /^::1$/,            // IPv6 localhost
    /^fe80:/,           // IPv6 link-local
    /^localhost$/i,
  ];

  for (const pattern of privateIpPatterns) {
    if (pattern.test(domain)) {
      throw new Error('Invalid domain: internal/private addresses not allowed');
    }
  }

  // Validate domain format (basic check)
  if (!/^[a-zA-Z0-9][a-zA-Z0-9-_.]*[a-zA-Z0-9]$/.test(domain)) {
    throw new Error('Invalid domain format');
  }

  // Reject excessively long domains
  if (domain.length > 253) {
    throw new Error('Domain name too long (max 253 characters)');
  }
}

// ==================== Passphrase Strength Validation ====================

/**
 * Calculate entropy of a string (bits)
 */
function calculateEntropy(str: string): number {
  const charSet = new Set(str.split(''));
  const poolSize = charSet.size;

  if (poolSize === 0) return 0;

  // Estimate character pool based on character types
  let estimatedPoolSize = 0;
  if (/[a-z]/.test(str)) estimatedPoolSize += 26;
  if (/[A-Z]/.test(str)) estimatedPoolSize += 26;
  if (/[0-9]/.test(str)) estimatedPoolSize += 10;
  if (/[^a-zA-Z0-9]/.test(str)) estimatedPoolSize += 32;

  return str.length * Math.log2(Math.max(poolSize, estimatedPoolSize));
}

/**
 * Validate passphrase strength with enhanced requirements
 * @param passphrase - Passphrase to validate
 * @param minLength - Minimum length (default 16)
 * @param minEntropy - Minimum entropy in bits (default 60)
 * @throws Error if passphrase doesn't meet requirements
 */
export function validatePassphraseStrength(
  passphrase: string,
  minLength: number = 16,
  minEntropy: number = 60
): void {
  if (!passphrase || typeof passphrase !== 'string') {
    throw new Error('Passphrase must be a non-empty string');
  }

  // Check minimum length
  if (passphrase.length < minLength) {
    throw new Error(`Passphrase must be at least ${minLength} characters`);
  }

  // Check character complexity
  const hasUppercase = /[A-Z]/.test(passphrase);
  const hasLowercase = /[a-z]/.test(passphrase);
  const hasNumbers = /[0-9]/.test(passphrase);
  const hasSpecial = /[^A-Za-z0-9]/.test(passphrase);

  const complexity = [hasUppercase, hasLowercase, hasNumbers, hasSpecial]
    .filter(Boolean).length;

  if (complexity < 3) {
    throw new Error(
      'Passphrase must include at least 3 of: uppercase letters, lowercase letters, numbers, special characters'
    );
  }

  // Check entropy
  const entropy = calculateEntropy(passphrase);
  if (entropy < minEntropy) {
    throw new Error(
      `Passphrase entropy too low (${entropy.toFixed(1)} bits). Minimum ${minEntropy} bits required. ` +
      'Use a longer passphrase with more varied characters.'
    );
  }

  // Check against common weak patterns
  const weakPatterns = [
    /^(.)\1+$/,                    // All same character
    /^(12|23|34|45|56|67|78|89|90)+/,  // Sequential numbers
    /^(abc|bcd|cde|def)+/i,        // Sequential letters
    /password/i,
    /qwerty/i,
    /admin/i,
    /letmein/i,
  ];

  for (const pattern of weakPatterns) {
    if (pattern.test(passphrase)) {
      throw new Error('Passphrase contains common weak pattern. Please choose a more secure passphrase.');
    }
  }
}

// ==================== Rate Limiting (Client-Side) ====================

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Client-side rate limiting for sensitive operations
 * @param key - Unique key for the operation (e.g., 'login:user123')
 * @param maxAttempts - Maximum attempts allowed
 * @param windowMs - Time window in milliseconds
 * @returns true if rate limit exceeded, false otherwise
 */
export function isRateLimited(
  key: string,
  maxAttempts: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry) {
    rateLimitStore.set(key, {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
    });
    return false;
  }

  // Check if window has expired
  if (now - entry.firstAttempt > windowMs) {
    // Reset window
    rateLimitStore.set(key, {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
    });
    return false;
  }

  // Increment count
  entry.count++;
  entry.lastAttempt = now;
  rateLimitStore.set(key, entry);

  // Check if limit exceeded
  if (entry.count > maxAttempts) {
    const waitTime = Math.ceil((windowMs - (now - entry.firstAttempt)) / 1000);
    throw new Error(
      `Rate limit exceeded. Please wait ${waitTime} seconds before trying again.`
    );
  }

  return false;
}

/**
 * Clear rate limit entry (useful for successful authentication)
 */
export function clearRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

// ==================== URL Construction Helpers ====================

/**
 * Safely construct URL with query parameters
 * @param base - Base URL or endpoint
 * @param params - Query parameters
 * @returns URL string with encoded parameters
 */
export function constructUrl(base: string, params?: Record<string, string | number | boolean>): string {
  if (!params || Object.keys(params).length === 0) {
    return base;
  }

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    searchParams.append(key, String(value));
  }

  const queryString = searchParams.toString();
  return queryString ? `${base}?${queryString}` : base;
}
