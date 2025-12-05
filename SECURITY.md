# Security Policy

## Supported Versions

| Version | Supported          | Notes |
| ------- | ------------------ | ----- |
| 1.x.x   | :white_check_mark: | Security updates provided |
| < 1.0   | :x:                | Not supported |

## Reporting Vulnerabilities

If you discover a security vulnerability in the Sovereign Network API Client, please report it responsibly:

1. **DO NOT** open a public GitHub issue
2. Email: security@sovereignnetwork.io
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

We will respond within 48 hours and provide updates on remediation progress.

---

## Security Architecture

### Transport Layer

The Sovereign Network uses **QUIC (UDP port 9334)** for all backend communication:

- **Post-Quantum Cryptography**: CRYSTALS-Kyber512 for key encapsulation, CRYSTALS-Dilithium2 for signatures
- **TLS 1.3 Mandatory**: All QUIC connections enforce TLS 1.3
- **HTTP/3 Compatibility**: HTTP requests converted to ZHTP protocol over QUIC

**Important**: This TypeScript client uses standard `fetch()` API, which requires:
1. **Browser**: HTTP-to-QUIC gateway on port 8000 (ZHTP backend on 9334)
2. **React Native**: Custom QUIC fetch adapter using platform-specific libraries
3. **Electron**: Same as browser (gateway required)

### Client-Side Security Features

#### 1. Input Validation (P0-2 Fixed)
All identity IDs, DIDs, contract IDs, and parameters are validated before sending to backend:

```typescript
- Identity IDs: 64-character hex strings
- DIDs: Format `did:zhtp:[hex64]`
- Contract IDs: Alphanumeric, hyphens, underscores only (no path traversal)
- Guardian IDs: 64-character hex strings
- Domain names: SSRF protection (rejects internal IPs)
```

#### 2. Passphrase Strength (P1-2 Fixed)
Enhanced passphrase requirements for backup/recovery operations:

```typescript
- Minimum length: 16 characters (increased from 12)
- Minimum entropy: 60 bits
- Complexity requirement: 3 of 4 character types (upper, lower, numbers, symbols)
- Weak pattern detection: Rejects common passwords and sequences
```

#### 3. Error Sanitization (P0-1 Fixed)
All errors are sanitized before logging to prevent credential leakage:

```typescript
- Passphrases, tokens, keys, seeds automatically redacted
- Debug logs sanitize error messages
- JSON bodies scrubbed of sensitive fields
```

#### 4. Rate Limiting (P2-1 Fixed)
Client-side rate limiting protects against brute force:

```typescript
- Login: 5 attempts per 5 minutes per identity
- Sign-in: 5 attempts per 5 minutes per DID
- Backup import: 3 attempts per hour (global)
```

#### 5. Content-Type Validation (P2-4 Fixed)
Responses validated before parsing:

```typescript
- Rejects non-JSON responses
- Prevents content-type confusion attacks
```

#### 6. Configurable Timeouts (P2-2 Fixed)
Per-operation timeout configuration:

```typescript
- Default: 10 seconds
- Configurable per request
- Prevents hanging connections
```

#### 7. Secure URL Construction (P2-5 Fixed)
All query parameters use `URLSearchParams`:

```typescript
- Automatic encoding
- Injection prevention
- Consistent parameter handling
```

#### 8. Config Validation (P2-6 Fixed)
Electron IPC responses validated:

```typescript
- Structure validation
- Type checking
- URL format validation
```

---

## Security Considerations for Developers

### 1. **NEVER Log Sensitive Data**

❌ **DON'T:**
```typescript
console.log('Login attempt:', { password, seedPhrase });
```

✅ **DO:**
```typescript
// Errors are automatically sanitized
if (config.debugMode) {
  console.log('Login attempt for user:', userId);
}
```

### 2. **Store Seed Phrases Securely**

Seed phrases are returned **only once** during signup:

```typescript
const identity = await api.signup(request);
// identity.seedPhrases ONLY available immediately after signup
// Store in secure encrypted storage immediately
// DO NOT log, cache unencrypted, or transmit over insecure channels
```

**Secure storage options:**
- **Browser**: IndexedDB with Web Crypto API encryption
- **React Native**: `react-native-encrypted-storage` or Keychain/Keystore
- **Electron**: `electron-store` with encryption or OS keychain

### 3. **Use Strong Passphrases**

The library enforces strong passphrases, but educate users:

```typescript
✅ Good: "Correct-Horse-Battery-Staple-2024!"
❌ Bad: "password123456"
```

### 4. **Implement Certificate Pinning (Production)**

For production React Native apps:

```typescript
import { ZhtpApi } from '@sovereign-network/api-client/react-native';

// Pin ZHTP node certificates
const pinnedCerts = ['sha256/AAAAAAA...'];
const api = new ZhtpApi(configProvider, customFetchWithPinning);
```

### 5. **Validate Session Tokens**

Session tokens are bearer tokens - protect them:

```typescript
- Store in HTTP-only cookies (browser) or secure storage (mobile)
- Never expose in URLs or localStorage
- Implement token refresh mechanism
- Clear on logout
```

### 6. **Rate Limit on Backend Too**

Client-side rate limiting is **not sufficient**:

```typescript
// Backend MUST implement server-side rate limiting
// Client-side limiting only provides UX feedback
```

### 7. **Sanitize User Input**

Even with input validation, sanitize on backend:

```typescript
// Client validates format
validateDid(did);

// Backend MUST re-validate and sanitize
```

---

## Known Security Limitations

### 1. **No Built-In Request Signing**

The library does not cryptographically sign requests. For sensitive operations:

```typescript
// Implement request signing in your application
const signature = await signRequest(payload, privateKey);
await api.sendWalletPayment({ ...payload, signature });
```

### 2. **Client-Side Validation Only**

All validation in this library is client-side. The backend **MUST**:
- Re-validate all inputs
- Implement authorization checks
- Rate limit requests
- Log security events

### 3. **Session Management**

The library does not handle:
- Session expiration
- Token refresh
- Multi-device session management

Applications must implement these features.

### 4. **CSRF Protection**

For browser environments, implement CSRF protection:

```typescript
// Add CSRF token to state-changing requests
headers: {
  'X-CSRF-Token': csrfToken,
}
```

### 5. **Browser Security Headers**

Applications should configure security headers:

```http
Content-Security-Policy: default-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000; includeSubDomains
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

---

## Security Best Practices

### For Application Developers

1. **Always use HTTPS in production**
2. **Never log passphrases, seed phrases, or session tokens**
3. **Store sensitive data encrypted**
4. **Implement proper session management**
5. **Use certificate pinning for mobile apps**
6. **Implement server-side validation and authorization**
7. **Rate limit on both client and server**
8. **Monitor for suspicious activity**
9. **Keep dependencies updated** (`npm audit` regularly)
10. **Follow principle of least privilege**

### For Users

1. **Use strong, unique passphrases** (16+ characters)
2. **Write down seed phrases and store offline**
3. **Never share seed phrases or passphrases**
4. **Enable biometric authentication when available**
5. **Verify application authenticity before use**
6. **Keep software updated**
7. **Use hardware security keys when possible**

---

## Security Testing

### Running Security Tests

```bash
# Run all tests including security tests
npm test

# Run only security tests
npm test -- --grep "security"

# Check for vulnerabilities
npm audit

# Type check
npm run type-check
```

### Manual Security Testing Checklist

- [ ] Input validation works for all ID formats
- [ ] Rate limiting triggers after configured attempts
- [ ] Weak passphrases are rejected
- [ ] Errors do not leak credentials in debug mode
- [ ] Session tokens not exposed in logs
- [ ] QUIC connection works (or gateway configured)
- [ ] Certificate pinning works (mobile)
- [ ] Config validation prevents malicious IPC data (Electron)

---

## Compliance

### GDPR / Privacy

- **Data Minimization**: Library does not collect telemetry
- **Right to Erasure**: Applications must handle identity deletion
- **Data Portability**: Backup export provides encrypted data portability

### PCI DSS (if handling payment data)

- **Encryption**: TLS 1.3 mandatory via QUIC
- **Tokenization**: Applications must implement wallet address tokenization
- **Audit Logging**: Applications must log financial transactions

### SOC 2 / ISO 27001

- **Access Control**: Applications must implement authorization
- **Logging**: Applications must log security events
- **Incident Response**: Follow responsible disclosure process

---

## Security Changelog

### Version 1.1.10+ (December 2025)

**Critical Fixes:**
- **P0-1**: Error sanitization prevents credential logging
- **P0-2**: Comprehensive input validation for all ID parameters
- **P1-2**: Enhanced passphrase requirements (16 chars, 60 bits entropy)

**High Priority Fixes:**
- **P2-1**: Client-side rate limiting for authentication
- **P2-4**: Content-Type validation prevents response confusion
- **P2-5**: Secure URL construction prevents injection
- **P2-6**: Electron IPC config validation

**Medium Priority Fixes:**
- **P2-2**: Configurable timeouts per operation
- **P2-8**: Updated vulnerable dependencies (js-yaml, semantic-release)

**Enhancements:**
- Added QUIC architecture documentation
- Security utilities module for validation/sanitization
- Comprehensive security testing suite

### Version 1.0.0 (Initial Release)

- Basic input validation
- HTTP transport (deprecated - now QUIC)
- Session token management
- Retry logic with exponential backoff

---

## Resources

- [OWASP Top 10](https://owasp.org/Top10/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [QUIC Protocol](https://www.rfc-editor.org/rfc/rfc9000.html)
- [Post-Quantum Cryptography](https://csrc.nist.gov/projects/post-quantum-cryptography)
- [React Native Security](https://reactnative.dev/docs/security)
- [Electron Security](https://www.electronjs.org/docs/latest/tutorial/security)

---

## Contact

- **Security Issues**: security@sovereignnetwork.io
- **General Support**: support@sovereignnetwork.io
- **Documentation**: https://docs.sovereignnetwork.io
- **GitHub**: https://github.com/SOVEREIGN-NET/Sovereign-Network-API-Client

---

**Last Updated**: December 5, 2025
**Security Assessment**: Comprehensive security audit completed December 2025
