/**
 * Security Utilities
 * Provides input validation, error sanitization, and security helpers
 */
/**
 * Sanitize error messages to prevent credential leakage
 * @param error - Error object or message
 * @returns Sanitized error message safe for logging
 */
export declare function sanitizeError(error: any): string;
/**
 * Sanitize object for logging (removes sensitive fields)
 */
export declare function sanitizeObject(obj: any): any;
/**
 * Validate identity ID format (64-character hex string)
 */
export declare function validateIdentityId(id: string): void;
/**
 * Validate DID format (did:zhtp:hexstring)
 */
export declare function validateDid(did: string): void;
/**
 * Validate contract ID format
 */
export declare function validateContractId(contractId: string): void;
/**
 * Validate guardian ID format
 */
export declare function validateGuardianId(guardianId: string): void;
/**
 * Validate recovery method enum
 */
export declare function validateRecoveryMethod(method: string): void;
/**
 * Validate wallet type enum
 */
export declare function validateWalletType(walletType: string): void;
/**
 * Validate proof type enum
 */
export declare function validateProofType(proofType: string): void;
/**
 * Validate domain name format (prevent SSRF)
 */
export declare function validateDomainName(domain: string): void;
/**
 * Validate passphrase strength with enhanced requirements
 * @param passphrase - Passphrase to validate
 * @param minLength - Minimum length (default 16)
 * @param minEntropy - Minimum entropy in bits (default 60)
 * @throws Error if passphrase doesn't meet requirements
 */
export declare function validatePassphraseStrength(passphrase: string, minLength?: number, minEntropy?: number): void;
/**
 * Client-side rate limiting for sensitive operations
 * @param key - Unique key for the operation (e.g., 'login:user123')
 * @param maxAttempts - Maximum attempts allowed
 * @param windowMs - Time window in milliseconds
 * @returns true if rate limit exceeded, false otherwise
 */
export declare function isRateLimited(key: string, maxAttempts: number, windowMs: number): boolean;
/**
 * Clear rate limit entry (useful for successful authentication)
 */
export declare function clearRateLimit(key: string): void;
/**
 * Safely construct URL with query parameters
 * @param base - Base URL or endpoint
 * @param params - Query parameters
 * @returns URL string with encoded parameters
 */
export declare function constructUrl(base: string, params?: Record<string, string | number | boolean>): string;
//# sourceMappingURL=security-utils.d.ts.map