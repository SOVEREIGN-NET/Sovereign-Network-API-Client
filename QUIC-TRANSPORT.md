# QUIC Transport Support

The Sovereign Network uses QUIC as its primary transport protocol. This library supports custom QUIC implementations through the `FetchAdapter` interface.

## Overview

By default, this library uses the standard `fetch()` API which works over HTTP/HTTPS. For React Native apps that need to connect via QUIC, you can provide a custom fetch implementation that uses native QUIC libraries.

## Architecture

```
React Native App
  ├── Native QUIC Client (Swift/Kotlin)
  │   └── Implements QUIC protocol
  ├── JavaScript Bridge
  │   └── Exposes fetch-like API
  └── This TypeScript Library
      └── Uses injected fetch adapter
```

## Usage

### 1. Default HTTP/HTTPS (Browser/Node.js)

```typescript
import { ZhtpApi, BrowserConfigProvider } from '@sovereign-net/api-client';

// Uses standard fetch() - works over HTTP/HTTPS
const config = new BrowserConfigProvider({
  zhtpNodeUrl: 'https://node.sovereignnet.io',
  networkType: 'mainnet',
  debugMode: false,
  enableBiometrics: false,
});

const api = new ZhtpApi(config);
```

### 2. Custom QUIC Transport (React Native)

```typescript
import { ZhtpApi, ReactNativeConfigProvider, FetchAdapter } from '@sovereign-net/api-client/react-native';
import { NativeModules } from 'react-native';

// Your native QUIC module (implemented in Swift/Kotlin)
const { QuicClient } = NativeModules;

// Create fetch adapter using native QUIC
const quicFetchAdapter: FetchAdapter = async (url, options) => {
  const response = await QuicClient.request({
    url,
    method: options?.method || 'GET',
    headers: options?.headers,
    body: options?.body,
  });

  // Return Response-like object
  return {
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers),
    json: async () => JSON.parse(response.body),
    text: async () => response.body,
  } as Response;
};

// Initialize API with QUIC transport
const config = new ReactNativeConfigProvider({
  zhtpNodeUrl: 'quic://node.sovereignnet.io:9333',
  networkType: 'mainnet',
  debugMode: true,
  enableBiometrics: true,
});

const api = new ZhtpApi(config, quicFetchAdapter);

// Use normally - all requests go over QUIC
const identity = await api.signup({
  display_name: 'Alice',
  identity_type: 'citizen',
  password: 'secure_password',
});
```

## Native QUIC Implementation

### iOS (Swift)

Use a Swift QUIC library like:
- **nw_connection** (Apple's Network.framework with QUIC support)
- **swift-quic** community libraries

```swift
@objc(QuicClient)
class QuicClient: NSObject {
  @objc
  func request(_ params: NSDictionary,
               resolver resolve: @escaping RCTPromiseResolveBlock,
               rejecter reject: @escaping RCTPromiseRejectBlock) {

    // Establish QUIC connection
    let endpoint = NWEndpoint.hostPort(
      host: NWEndpoint.Host(params["host"] as! String),
      port: NWEndpoint.Port(integerLiteral: 9333)
    )

    let parameters = NWParameters.quic(alpn: ["zhtp/1.0"])
    parameters.allowLocalEndpointReuse = true

    let connection = NWConnection(to: endpoint, using: parameters)
    connection.start(queue: .global())

    // Send HTTP request over QUIC stream
    // ... (implement request/response handling)
  }
}
```

### Android (Kotlin)

Use a Kotlin QUIC library like:
- **Cronet** (Chromium's network stack with QUIC)
- **kwik** (Pure Kotlin QUIC implementation)

```kotlin
@ReactModule(name = "QuicClient")
class QuicClientModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  @ReactMethod
  fun request(params: ReadableMap, promise: Promise) {
    val url = params.getString("url")
    val method = params.getString("method") ?: "GET"

    // Use Cronet for QUIC support
    val builder = CronetEngine.Builder(reactApplicationContext)
    builder.enableQuic(true)
    val engine = builder.build()

    val requestBuilder = engine.newUrlRequestBuilder(
      url,
      object : UrlRequest.Callback() {
        override fun onResponseStarted(request: UrlRequest, info: UrlResponseInfo) {
          // Handle response
        }
      },
      executorService
    )

    requestBuilder.build().start()
  }
}
```

## QUIC Connection Settings

### Default Port
- **QUIC**: 9333/UDP
- **HTTP Fallback**: 9333/TCP (if QUIC unavailable)

### TLS Configuration
- **TLS 1.3 Required**
- **Self-signed certificates accepted** in development/mesh mode
- **Post-Quantum Cryptography**: Kyber512 + Dilithium2 for mesh connections

### Connection Parameters
```typescript
const quicConfig = {
  alpn: ['zhtp/1.0'],          // Application protocol
  maxIdleTimeout: 30000,        // 30 seconds
  maxStreamData: 1048576,       // 1 MB per stream
  initialMaxData: 10485760,     // 10 MB total
  enableDatagrams: true,        // For mesh discovery
};
```

## Protocol Discovery

The unified server supports multiple discovery methods:

| Protocol | Port | Purpose |
|----------|------|---------|
| QUIC | 9333/UDP | Primary transport |
| UDP Multicast | 5353/UDP | LAN discovery |
| mDNS | 5353/UDP | Service discovery (_zhtp._udp.local) |
| WiFi Direct | P2P | Direct peer connections |
| Bluetooth LE | N/A | Mobile discovery |
| LoRaWAN | 868MHz | Long-range mesh |

### Discovery API

```typescript
// Get list of discovered nodes
const nodes = await api.discoverNodes({
  methods: ['quic', 'mdns', 'bluetooth'],
  timeout: 5000,
});

// Connect to best available node
await api.connectToBestNode(nodes);
```

## Testing

### Test QUIC Connection

```typescript
const testQuicConnection = async () => {
  try {
    // Test protocol info endpoint
    const info = await api.getProtocolInfo();
    console.log('✅ QUIC connection successful:', info.protocol);
    console.log('   Node:', info.node_id);
    console.log('   Uptime:', info.uptime, 'seconds');
  } catch (error) {
    console.error('❌ QUIC connection failed:', error);
  }
};
```

### Benchmark QUIC vs HTTP

```typescript
const benchmark = async () => {
  const iterations = 100;

  // HTTP timing
  const httpStart = Date.now();
  for (let i = 0; i < iterations; i++) {
    await api.getProtocolHealth();
  }
  const httpTime = Date.now() - httpStart;

  // QUIC timing (with custom adapter)
  const quicStart = Date.now();
  for (let i = 0; i < iterations; i++) {
    await api.getProtocolHealth();
  }
  const quicTime = Date.now() - quicStart;

  console.log(`HTTP: ${httpTime}ms (${httpTime/iterations}ms avg)`);
  console.log(`QUIC: ${quicTime}ms (${quicTime/iterations}ms avg)`);
  console.log(`Improvement: ${((httpTime - quicTime) / httpTime * 100).toFixed(1)}%`);
};
```

## Troubleshooting

### Connection Fails
- Check QUIC port 9333/UDP is not blocked
- Verify TLS certificate trust (disable verification in dev)
- Try HTTP fallback to test API methods

### Performance Issues
- Enable connection pooling in native QUIC client
- Use 0-RTT resumption for faster reconnects
- Check network latency with `getNetworkStats()`

### Platform-Specific Issues

**iOS**:
- Ensure `Info.plist` allows UDP connections
- Check App Transport Security settings

**Android**:
- Add `INTERNET` permission to `AndroidManifest.xml`
- Enable cleartext traffic for development

## Migration from HTTP

Existing code requires NO changes when switching to QUIC:

```typescript
// Before (HTTP)
const api = new ZhtpApi(config);

// After (QUIC)
const api = new ZhtpApi(config, quicFetchAdapter);

// All methods work identically
await api.signup({ ... });
await api.registerWeb4Domain({ ... });
await api.getWalletList(identityId);
```

## Performance Benefits

QUIC provides:
- **30-50% lower latency** vs TCP (no head-of-line blocking)
- **Faster connection establishment** (0-RTT resumption)
- **Better mobile performance** (connection migration)
- **Improved reliability** (better congestion control)

## Security

QUIC connections use:
- **TLS 1.3 mandatory** (no downgrade attacks)
- **Connection ID encryption** (privacy from network observers)
- **Forward secrecy** (ephemeral keys)
- **Post-quantum cryptography** (Kyber512 + Dilithium2 for mesh)

## References

- [QUIC RFC 9000](https://www.rfc-editor.org/rfc/rfc9000.html)
- [HTTP/3 RFC 9114](https://www.rfc-editor.org/rfc/rfc9114.html)
- [Sovereign Network Protocol Spec](https://github.com/SOVEREIGN-NET/protocol-spec)
- [React Native Native Modules](https://reactnative.dev/docs/native-modules-intro)
- [Cronet QUIC Documentation](https://chromium.googlesource.com/chromium/src/+/master/components/cronet/)
