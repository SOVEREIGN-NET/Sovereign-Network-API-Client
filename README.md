# Sovereign Network API Client

[![codecov](https://codecov.io/gh/SOVEREIGN-NET/Sovereign-Network-API-Client/branch/main/graph/badge.svg)](https://codecov.io/gh/SOVEREIGN-NET/Sovereign-Network-API-Client)

A platform-agnostic TypeScript API client for Sovereign Network ZHTP nodes. Provides unified access to identity, wallet, DAO, smart contract, and blockchain operations across Electron, React Native, and web/Node.js environments with a single codebase.

## Features

- **Platform-Agnostic Core**: Single codebase works across Electron, React Native, and vanilla JavaScript/Node.js
- **52 API Methods**: Complete coverage of identity, wallet, DAO, smart contracts, Web4, blockchain, and zero-knowledge operations
- **Full TypeScript Support**: Comprehensive type definitions with strict mode enabled
- **Built-in Retry Logic**: Automatic exponential backoff for reliable requests
- **Environment-Specific Config**: Platform-specific configuration providers for Electron IPC, React Native AsyncStorage, and browser localStorage
- **Type Safety**: Full TypeScript support with strict mode enabled
- **Error Handling**: Graceful error handling with fallbacks

## Installation

### Via GitHub Packages

1. **Configure NPM** (one-time setup):
   ```bash
   # Create or edit ~/.npmrc
   @sovereign-network:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT
   ```

2. **Install**:
   ```bash
   npm install @sovereign-network/api-client
   ```

## Quick Start

### Electron

```typescript
import { ZhtpApi, ElectronConfigProvider } from '@sovereign-network/api-client/electron';

// Main process: expose config via IPC
import { ipcMain } from 'electron';
ipcMain.handle('get-config', async () => ({
  zhtpNodeUrl: process.env.ZHTP_NODE_URL || 'http://localhost:8000',
  networkType: 'testnet',
  debugMode: false,
  enableBiometrics: true,
}));

// Renderer process: use the API
const configProvider = new ElectronConfigProvider();
const api = new ZhtpApi(configProvider);
await api.ensureInitialized();

const proposals = await api.getDaoProposals();
const balance = await api.getWalletBalance(did);
```

### React Native

```typescript
import { ZhtpApi, ReactNativeConfigProvider } from '@sovereign-network/api-client/react-native';

const configProvider = new ReactNativeConfigProvider({
  ZHTP_NODE_URL: 'http://192.168.1.100:8000',
  NETWORK_TYPE: 'testnet',
  DEBUG_MODE: __DEV__,
  ENABLE_BIOMETRICS: true,
});

const api = new ZhtpApi(configProvider);
await api.ensureInitialized();

const identity = await api.signIn(did, passphrase);
const balance = await api.getWalletBalance(identity.did);
```

### Browser

```typescript
import { ZhtpApi, BrowserConfigProvider } from '@sovereign-network/api-client';

// Server should expose /api/config endpoint
const configProvider = new BrowserConfigProvider();
const api = new ZhtpApi(configProvider);
await api.ensureInitialized();

const dapp = await api.resolveDomain('example.web4');
const content = await api.loadWeb4Resource('example.web4/index.html');
```

## Implementation Architecture

### Electron Flow

```
┌─────────────────────────────────────────────────────────┐
│                  Electron Renderer                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │ import ElectronConfigProvider from              │  │
│  │ '@sovereign-network/api-client/electron'        │  │
│  │                                                  │  │
│  │ const configProvider = new                       │  │
│  │   ElectronConfigProvider()                       │  │
│  │ const api = new ZhtpApi(configProvider)          │  │
│  └──────────────────────────────────────────────────┘  │
│                      │                                  │
│              IPC: 'get-config'                          │
│                      │                                  │
├─────────────────────────────────────────────────────────┤
│                  Electron Main                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ipcMain.handle('get-config', async () => ({    │  │
│  │   zhtpNodeUrl: ...,                             │  │
│  │   networkType: ...,                             │  │
│  │   debugMode: ...,                               │  │
│  │   enableBiometrics: ...                          │  │
│  │ }))                                             │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                      │
           ┌──────────┴──────────┐
           │                     │
    ElectronConfigProvider   ZhtpApi
           │                     │
           └──────────┬──────────┘
                      │
              ZHTP Node (HTTP)
```

### React Native Flow

```
┌────────────────────────────────────┐
│     React Native Application       │
│  ┌──────────────────────────────┐  │
│  │ const configProvider = new   │  │
│  │   ReactNativeConfigProvider( │  │
│  │   { ZHTP_NODE_URL: '...' }   │  │
│  │ )                            │  │
│  │ const api = new ZhtpApi(...) │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
              │
    ┌─────────┴──────────┐
    │                    │
  AsyncStorage   Environment Variables
    │                    │
    └─────────┬──────────┘
              │
  ReactNativeConfigProvider
              │
           ZhtpApi
              │
       ZHTP Node (HTTP)
```

### Browser Flow

```
┌────────────────────────────────────┐
│         Browser/JavaScript         │
│  ┌──────────────────────────────┐  │
│  │ const configProvider = new   │  │
│  │   BrowserConfigProvider()    │  │
│  │ const api = new ZhtpApi(...) │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
              │
    ┌─────────┴──────────┐
    │                    │
localStorage         /api/config
    │                    │
    └─────────┬──────────┘
              │
  BrowserConfigProvider
              │
           ZhtpApi
              │
       ZHTP Node (HTTP)
```

## Complete API Reference

### Identity (11 methods)
- `signIn(did, passphrase)` - Sign in with credentials
- `createIdentity(data)` - Create new identity
- `recoverIdentity(method, data)` - Recover identity by method (seed/backup/social)
- `recoverIdentityFromSeed(recoveryData)` - Recover from seed phrase
- `restoreIdentityFromBackup(backupData)` - Restore from backup
- `recoverIdentityWithGuardians(guardianData)` - Social recovery
- `createZkDid(didData)` - Create ZK-DID
- `getIdentity(did)` - Get identity details
- `verifyIdentity(did, requirements)` - Verify identity credentials
- `checkIdentityExists(identifier)` - Check identity existence
- `signInWithIdentity(identity, passphrase)` - Sign in with identity

### Wallet (5 methods)
- `getWallets(did)` - Get all wallets for DID
- `getWalletBalance(did)` - Get wallet balance
- `getTransactionHistory(address, walletType)` - Get transaction history
- `getAssets(address)` - Get assets in wallet
- `sendTransaction(from, to, amount, metadata)` - Send transaction

### DAO (14 methods)
- `getDaoProposals()` - Get all proposals
- `getDaoStats()` - Get DAO statistics
- `getProposalDetails(proposalId)` - Get specific proposal details
- `createProposal(proposal)` - Create new proposal
- `submitVote(proposalId, vote, voterDid)` - Submit vote on proposal
- `getDaoData()` - Get comprehensive DAO data
- `getDaoDelegates()` - Get all delegates
- `getDelegateProfile(delegateId)` - Get delegate profile
- `registerDelegate(userDid, delegateInfo)` - Register as delegate
- `revokeDelegation(userDid)` - Revoke delegation
- `getTreasuryHistory()` - Get treasury transaction history
- `createSpendingProposal(proposalData)` - Create spending proposal
- `getVotingPower(userDid)` - Get voting power
- `getUserVotes(userDid)` - Get user's votes
- `getDaoTreasury()` - Get DAO treasury balance

### Smart Contracts (5 methods)
- `deployContract(contractId, bytecode, metadata)` - Deploy contract
- `executeContract(contractId, functionName, args)` - Execute contract function
- `queryContract(contractId, functionName, args)` - Query contract state
- `getContractMetadata(contractId)` - Get contract metadata
- `upgradeContract(contractId, bytecode, metadata)` - Upgrade contract

### Web4/DHT (6 methods)
- `resolveDomain(domainName)` - Resolve domain to contract
- `loadWeb4Resource(url)` - Load Web4 resource content
- `resolveDapp(domain)` - Resolve DApp by domain
- `getContractContent(contractId, path)` - Get contract content by path
- `getContractByHash(hash)` - Get contract by blockchain hash
- `getContractById(contractId)` - Get contract by ID

### Blockchain/Network (6 methods)
- `getBlockchainInfo()` - Get blockchain information
- `getGasInfo()` - Get gas pricing information
- `getNodeStatus()` - Get node status
- `getMeshPeers()` - Get mesh network peers
- `getNetworkStats()` - Get network statistics
- `getNetworkInfo()` - Get network information

### Zero-Knowledge Proofs (2 methods)
- `generateZkProof(data)` - Generate ZK proof
- `verifyZkProof(proof)` - Verify ZK proof

### Connection (3 methods)
- `testConnection()` - Test connection to node
- `ensureInitialized()` - Ensure API is initialized
- `getProtocolInfo()` - Get protocol information

## Configuration

### Electron Configuration Provider

The `ElectronConfigProvider` reads from Electron IPC.

**preload.ts:**
```typescript
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getConfig: () => ipcRenderer.invoke('get-config'),
});
```

**main.ts:**
```typescript
import { ipcMain } from 'electron';

ipcMain.handle('get-config', async () => {
  return {
    zhtpNodeUrl: process.env.ZHTP_NODE_URL || 'http://localhost:8000',
    networkType: process.env.NETWORK_TYPE || 'testnet',
    debugMode: process.env.DEBUG_MODE === 'true',
    enableBiometrics: true,
  };
});
```

### React Native Configuration Provider

Environment variables in order of precedence:
1. Constructor `envVars` parameter
2. `process.env` (if available)
3. AsyncStorage cache
4. Defaults

```typescript
const configProvider = new ReactNativeConfigProvider({
  ZHTP_NODE_URL: 'http://192.168.1.100:8000',
  NETWORK_TYPE: 'testnet',
  DEBUG_MODE: __DEV__,
  ENABLE_BIOMETRICS: true,
});
```

Also supports dynamic updates:
```typescript
await configProvider.updateConfig({ zhtpNodeUrl: 'http://new-node:8000' });
await configProvider.clearCache();
```

### Browser Configuration Provider

Configuration sources in order:
1. localStorage (cache)
2. API endpoint `/api/config`
3. Defaults

**Server endpoint:**
```typescript
app.get('/api/config', (req, res) => {
  res.json({
    zhtpNodeUrl: process.env.ZHTP_NODE_URL || 'http://localhost:8000',
    networkType: 'testnet',
    debugMode: false,
    enableBiometrics: true,
  });
});
```

## Built-in Features

### Automatic Retry Logic
- Exponential backoff: 1s → 2s → 4s delays
- Max 3 retries on network errors
- Does NOT retry on 4xx client errors
- Automatic error recovery

### Timeout Handling
- 30-second request timeout
- AbortController-based cancellation
- Proper cleanup on timeout

### Type Safety
- Full TypeScript strict mode
- Comprehensive type definitions
- All methods fully typed

### Initialization Tracking
- `initPromise` tracks async setup
- `ensureInitialized()` waits for config load
- Connection state tracking

## Error Handling

```typescript
try {
  const proposals = await api.getDaoProposals();
} catch (error) {
  console.error('Failed:', error.message);
  // Error already retried up to 3 times with exponential backoff
}
```

## Development

### Build
```bash
npm run build
```

### Type Check
```bash
npm run type-check
```

### Run Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm run dev
```

### Full Verification
```bash
npm run prepare  # type-check + build + tests all at once
```

## Publishing

Publishing is **automated** via GitHub Actions on every push to `main`:

1. **Commit with semantic messages**:
   - `fix:` → patch version (1.0.0 → 1.0.1)
   - `feat:` → minor version (1.0.0 → 1.1.0)
   - `BREAKING CHANGE:` → major version (1.0.0 → 2.0.0)

2. **Push to main**:
   ```bash
   git push origin main
   ```

3. **Automated workflow**:
   - Analyzes commits
   - Bumps version
   - Creates CHANGELOG
   - Publishes to GitHub Packages
   - Creates GitHub release
   - Commits back to repo

No manual steps needed!

## Project Structure

```
src/
├── core/                          # Platform-agnostic core
│   ├── types.ts                  # Type definitions
│   ├── config-provider.ts        # Config interface
│   ├── zhtp-api.ts               # Main API class
│   ├── zhtp-api-methods.ts       # 52 API methods
│   └── zhtp-api-core.ts          # Retry & request logic
│
├── electron/                      # Electron entry point
│   ├── config-provider.ts        # IPC-based config
│   └── index.ts                  # Exports
│
├── react-native/                 # React Native entry point
│   ├── config-provider.ts        # AsyncStorage config
│   └── index.ts                  # Exports
│
└── vanilla-js/                    # Browser entry point
    ├── config-provider.ts        # localStorage config
    └── index.ts                  # Exports
```

## Test Coverage

- **Total Tests**: 170 (all passing ✓)
- **Overall Coverage**: 80.72%
- **Retry Logic**: 92.85%
- **Config Providers**: 96-97% each
- **API Methods**: 86.36%

## Design Principles

1. **Single Fetch API**: Uses standard `fetch()` in all environments
2. **Platform Abstraction**: Config providers handle platform differences
3. **Type Safety**: Full TypeScript with strict mode
4. **Resilience**: Automatic retry with exponential backoff
5. **Isomorphic**: Same code runs everywhere

## TypeScript Types

All types are exported and fully typed:

```typescript
import type {
  Identity,
  Wallet,
  DaoProposal,
  DaoStats,
  Transaction,
  Delegate,
  ProposalDetails,
  SmartContract,
  ContractDeploymentResult,
  Asset,
  NodeStatus,
  GasInfo,
  Proof,
  ApiConfig,
  ConfigProvider,
} from '@sovereign-network/api-client';
```

## License

MIT

## Contributing

Contributions welcome! Ensure:
- All TypeScript compiles with strict mode
- All tests pass (`npm test`)
- Types are properly exported
- No additional markdown files
