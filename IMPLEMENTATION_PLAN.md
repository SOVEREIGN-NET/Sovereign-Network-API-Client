# Security Fixes Implementation Plan

## Status: IN PROGRESS

This document tracks the implementation of all security fixes from the security assessment.

## Completed ✅

1. **P0-1: Error Sanitization** - ✅ DONE
   - Created `src/core/security-utils.ts` with sanitizeError() function
   - Updated `zhtp-api-core.ts` to sanitize errors before logging
   - Prevents credential leakage in debug logs

2. **P2-2: Configurable Timeouts** - ✅ DONE
   - Added optional `timeoutMs` parameter to request() method
   - Allows per-operation timeout configuration

3. **P2-4: Content-Type Validation** - ✅ DONE
   - Added Content-Type header validation in request() method
   - Rejects non-JSON responses before parsing

4. **Security Utils Created** - ✅ DONE
   - Input validation functions (DID, identity ID, contract ID, etc.)
   - Passphrase strength validation (16+ chars, 60+ bits entropy, complexity)
   - Rate limiting helpers
   - URL construction helpers

## In Progress 🔄

5. **P0-2: Input Validation** - 🔄 NEXT
   - Need to apply validation to all API methods in zhtp-api-methods.ts
   - Files to update:
     - `src/core/zhtp-api-methods.ts` (all methods with ID parameters)

## Pending 📋

### Critical (P0/P1)

6. **Default ZHTP Configuration**
   - Update default URLs in all config providers
   - Change from `http://localhost:8000` to proper QUIC config
   - Files: `vanilla-js/config-provider.ts`, `react-native/config-provider.ts`, `electron/config-provider.ts`

7. **P1-2: Passphrase Requirements**
   - Apply validatePassphraseStrength() to exportBackup() and importBackup()
   - File: `src/core/zhtp-api-methods.ts`

8. **P1-3: Seed Phrase Security**
   - Remove seedPhrases from Identity type (make separate secure retrieval)
   - Update mapSignupResponseToIdentity() to not include seeds by default
   - Add explicit retrieveSeedPhrases() method with warnings
   - Files: `src/core/types.ts`, `src/core/zhtp-api-methods.ts`

9. **P1-4: CSRF Protection**
   - Add CSRF token generation/validation helpers
   - Include CSRF tokens in state-changing operations
   - File: `src/core/security-utils.ts`, update all POST/DELETE/PUT methods

### Medium (P2)

10. **P2-1: Client-Side Rate Limiting**
    - Apply isRateLimited() to login, signup, backup import
    - Files: `src/core/zhtp-api-methods.ts`

11. **P2-5: URL Construction**
    - Replace manual query string construction with constructUrl()
    - Files: `src/core/zhtp-api-methods.ts` (multiple methods)

12. **P2-6: Electron Config Validation**
    - Add schema validation for IPC config responses
    - File: `src/electron/config-provider.ts`

13. **P2-7: Initialization Guards**
    - Add ensureInitialized() checks to all public methods
    - File: `src/core/zhtp-api.ts`

14. **P2-8: Dependency Updates**
    - Run `npm audit fix`
    - Update vulnerable dependencies
    - File: `package.json`

### Documentation & Testing

15. **SECURITY.md**
    - Create comprehensive security documentation
    - Include best practices, known limitations, reporting procedures

16. **Security Tests**
    - Create `src/core/security-utils.test.ts`
    - Add tests for all validation functions
    - Add integration tests for security features

17. **Final Validation**
    - Run `npm run type-check`
    - Run `npm run build`
    - Run `npm test`
    - Verify all tests pass

## Implementation Strategy

### Phase 1: Core Security (Items 5-9) - HIGHEST PRIORITY
These are blocking issues that prevent secure production use.

### Phase 2: Additional Protections (Items 10-14) - HIGH PRIORITY
These improve defense-in-depth.

### Phase 3: Documentation & Testing (Items 15-17) - REQUIRED FOR RELEASE
These ensure maintainability and proper usage.

## Estimated Timeline

- **Phase 1**: 2-3 hours (critical fixes)
- **Phase 2**: 1-2 hours (additional protections)
- **Phase 3**: 1-2 hours (documentation & testing)
- **Total**: 4-7 hours for complete implementation

## Files Modified So Far

1. ✅ `src/core/security-utils.ts` (created)
2. ✅ `src/core/zhtp-api-core.ts` (updated)

## Files Remaining

3. 📋 `src/core/zhtp-api-methods.ts` (major updates needed)
4. 📋 `src/core/types.ts` (seed phrase security)
5. 📋 `src/core/zhtp-api.ts` (initialization guards)
6. 📋 `src/vanilla-js/config-provider.ts` (default URL)
7. 📋 `src/react-native/config-provider.ts` (default URL)
8. 📋 `src/electron/config-provider.ts` (config validation)
9. 📋 `package.json` (dependency updates)
10. 📋 `SECURITY.md` (create)
11. 📋 `src/core/security-utils.test.ts` (create)

## Next Steps

1. Update zhtp-api-methods.ts with input validation
2. Apply passphrase strength validation
3. Secure seed phrase handling
4. Add rate limiting to sensitive operations
5. Fix URL construction
6. Update config providers
7. Add initialization guards
8. Update dependencies
9. Create documentation
10. Write tests
11. Final validation
