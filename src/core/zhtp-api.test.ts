/**
 * Tests for ZhtpApi - Initialization, utilities, and API methods
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ZhtpApi } from './zhtp-api';
import { ApiConfig } from './types';

describe('ZhtpApi', () => {
  let api: ZhtpApi;
  const mockConfig: ApiConfig = {
    zhtpNodeUrl: 'http://localhost:8000',
    networkType: 'testnet',
    debugMode: false,
    enableBiometrics: true,
  };

  const mockConfigProvider = {
    getConfig: vi.fn().mockResolvedValue(mockConfig),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigProvider.getConfig.mockResolvedValue(mockConfig);
  });

  describe('Initialization', () => {
    it('should initialize with config provider', async () => {
      api = new ZhtpApi(mockConfigProvider);
      await api.ensureInitialized();

      expect(api.getConfig()).toEqual(mockConfig);
      expect(api.isConnected()).toBe(true);
    });

    it('should set base URL from config', async () => {
      api = new ZhtpApi(mockConfigProvider);
      await api.ensureInitialized();

      expect(api.getBaseUrl()).toBe(mockConfig.zhtpNodeUrl);
    });

    it('should load config asynchronously', async () => {
      api = new ZhtpApi(mockConfigProvider);

      // Not initialized yet
      expect(api.isConnected()).toBe(false);

      // Wait for initialization
      await api.ensureInitialized();

      expect(api.isConnected()).toBe(true);
    });

    it('should throw error if config provider fails', async () => {
      const failingProvider = {
        getConfig: vi.fn().mockRejectedValue(new Error('Config load failed')),
      };

      api = new ZhtpApi(failingProvider);

      await expect(api.ensureInitialized()).rejects.toThrow('Config load failed');
    });

    it('should cache config after loading', async () => {
      api = new ZhtpApi(mockConfigProvider);
      await api.ensureInitialized();
      await api.ensureInitialized();

      // Should only call config provider once
      expect(mockConfigProvider.getConfig).toHaveBeenCalledTimes(1);
    });
  });

  describe('Utility Methods', () => {
    beforeEach(async () => {
      api = new ZhtpApi(mockConfigProvider);
      await api.ensureInitialized();
    });

    it('should return base URL', async () => {
      expect(api.getBaseUrl()).toBe('http://localhost:8000');
    });

    it('should return config', async () => {
      const config = api.getConfig();
      expect(config).toEqual(mockConfig);
    });

    it('should indicate connected status', async () => {
      expect(api.isConnected()).toBe(true);
    });

    it('should indicate not connected before initialization', () => {
      const newApi = new ZhtpApi(mockConfigProvider);
      expect(newApi.isConnected()).toBe(false);
    });

    it('should ensure connection', async () => {
      const result = await api.ensureConnection();
      expect(result).toBe(true);
    });

    it('should reestablish connection if lost', async () => {
      api = new ZhtpApi(mockConfigProvider);
      // Manual initialization to test reconnection
      const result = await api.ensureConnection();
      expect(result).toBe(true);
    });
  });

  describe('API Methods - Identity', () => {
    beforeEach(async () => {
      api = new ZhtpApi(mockConfigProvider);
      await api.ensureInitialized();
      global.fetch = vi.fn();
    });

    it('signIn should POST to /api/v1/identity/signin', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi
          .fn()
          .mockResolvedValue({ did: 'did:test', displayName: 'Test User' }),
      });

      await api.signIn('did:test', 'passphrase');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/identity/signin',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('createIdentity should POST to /api/v1/identity/create', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ did: 'did:new' }),
      });

      await api.createIdentity({ username: 'newuser' });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/identity/create',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('getIdentity should GET from /api/v1/identity/get/{did}', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ did: 'did:test' }),
      });

      await api.getIdentity('did:test');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/identity/get/did:test',
        expect.any(Object)
      );
    });

    it('verifyIdentity should return boolean', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ verified: true }),
      });

      const result = await api.verifyIdentity('did:test');

      expect(typeof result).toBe('boolean');
      expect(result).toBe(true);
    });

    it('verifyIdentity should handle errors gracefully', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ verified: false }),
      });

      const result = await api.verifyIdentity('did:test');

      expect(result).toBe(false);
    });

    it('checkIdentityExists should return boolean', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ exists: true }),
      });

      const result = await api.checkIdentityExists('username');

      expect(typeof result).toBe('boolean');
      expect(result).toBe(true);
    });

    it('checkIdentityExists should handle missing users', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ exists: false }),
      });

      const result = await api.checkIdentityExists('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('API Methods - Backup & Recovery', () => {
    beforeEach(async () => {
      api = new ZhtpApi(mockConfigProvider);
      await api.ensureInitialized();
      global.fetch = vi.fn();
    });

    it('exportBackup should POST to /api/v1/identity/backup/export with passphrase', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          backup_data: 'encrypted_data_base64',
          created_at: 1234567890,
        }),
      });

      await api.exportBackup('test-id', 'test-passphrase');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/identity/backup/export',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('passphrase'),
        })
      );
    });

    it('importBackup should POST to /api/v1/identity/backup/import with passphrase', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          status: 'success',
          identity: {
            identity_id: 'test-id',
            did: 'did:zhtp:test',
          },
          session_token: 'test-token',
        }),
      });

      await api.importBackup('backup-data', 'test-passphrase');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/identity/backup/import',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('passphrase'),
        })
      );
    });

    it('getBackupStatus should GET from /api/v1/identity/backup/status', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          has_recovery_phrase: true,
          backup_date: 1234567890,
          verified: true,
        }),
      });

      await api.getBackupStatus('test-id');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/identity/backup/status?identity_id='),
        expect.any(Object)
      );
    });

    it('verifySeedPhrase should POST to /api/v1/identity/seed/verify', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          verified: true,
        }),
      });

      await api.verifySeedPhrase('test-id', 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/identity/seed/verify',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('seed_phrase'),
        })
      );
    });

    it('exportSeedPhrases should GET from /api/v1/identity/{id}/seeds', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          primary: ['word1', 'word2'],
          ubi: ['word3', 'word4'],
          savings: ['word5', 'word6'],
        }),
      });

      await api.exportSeedPhrases('test-id');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/identity/test-id/seeds',
        expect.any(Object)
      );
    });
  });

  describe('API Methods - Wallet', () => {
    beforeEach(async () => {
      api = new ZhtpApi(mockConfigProvider);
      await api.ensureInitialized();
      global.fetch = vi.fn();
    });

    it('getWallets should GET from /api/v1/wallet/balance', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue([{ id: 'w1', balance: 100 }]),
      });

      await api.getWallets('did:test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/wallet/balance'),
        expect.any(Object)
      );
    });

    it('getWalletBalance should sum wallet balances', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi
          .fn()
          .mockResolvedValue([
            { id: 'w1', balance: 100 },
            { id: 'w2', balance: 50 },
          ]),
      });

      const balance = await api.getWalletBalance('did:test');

      expect(balance).toBe(150);
    });

    it('getTransactionHistory should GET from /api/v1/wallet/transactions', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      });

      await api.getTransactionHistory('address');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/wallet/transactions'),
        expect.any(Object)
      );
    });

    it('getAssets should GET from /api/v1/wallet/assets', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      });

      await api.getAssets('address');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/wallet/assets'),
        expect.any(Object)
      );
    });

    it('sendTransaction should POST to /api/v1/wallet/send', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ id: 'tx1' }),
      });

      await api.sendTransaction('from', 'to', 100);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/wallet/send',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('API Methods - DAO', () => {
    beforeEach(async () => {
      api = new ZhtpApi(mockConfigProvider);
      await api.ensureInitialized();
      global.fetch = vi.fn();
    });

    it('getDaoProposals should GET from /api/v1/dao/proposals/list', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      });

      await api.getDaoProposals();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/dao/proposals/list',
        expect.any(Object)
      );
    });

    it('submitVote should POST to /api/v1/dao/vote/cast', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      });

      await api.submitVote('proposal1', true, 'did:user');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/dao/vote/cast',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('getDaoTreasury should GET from /dao/treasury', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ balance: 1000 }),
      });

      const balance = await api.getDaoTreasury();

      expect(balance).toBe(1000);
    });

    it('getDaoTreasury should return 0 on missing balance', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      });

      const balance = await api.getDaoTreasury();

      expect(balance).toBe(0);
    });

    it('getVotingPower should return number', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ votingPower: 42 }),
      });

      const power = await api.getVotingPower('did:user');

      expect(typeof power).toBe('number');
      expect(power).toBe(42);
    });

    it('getVotingPower should return 0 for low power users', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ votingPower: 0 }),
      });

      const power = await api.getVotingPower('did:user');

      expect(power).toBe(0);
    });

    it('getDaoStats should aggregate proposals, treasury, and delegates', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: vi
            .fn()
            .mockResolvedValue([
              { status: 'active', votesFor: 10, votesAgainst: 5 },
            ]),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({ balance: 1000 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue([{ id: 'd1' }]),
        });

      const stats = await api.getDaoStats();

      expect(stats.totalProposals).toBe(1);
      expect(stats.activeProposals).toBe(1);
      expect(stats.treasury).toBe(1000);
      expect(stats.delegates).toBe(1);
    });
  });

  describe('API Methods - Smart Contracts', () => {
    beforeEach(async () => {
      api = new ZhtpApi(mockConfigProvider);
      await api.ensureInitialized();
      global.fetch = vi.fn();
    });

    it('deployContract should POST to /api/v1/blockchain/contracts/deploy', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ contractId: 'c1' }),
      });

      await api.deployContract({ name: 'MyContract' });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/blockchain/contracts/deploy',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('executeContract should POST to /api/v1/blockchain/contracts/{id}/call', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true }),
      });

      await api.executeContract('contract1', 'transfer', ['arg1']);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/blockchain/contracts/contract1/call',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('queryContract should GET from /api/v1/blockchain/contracts/{id}/state', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ result: 'data' }),
      });

      await api.queryContract('contract1', 'balanceOf', ['account']);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/blockchain/contracts/contract1/state'),
        expect.any(Object)
      );
    });

    it('getContractMetadata should GET from /api/v1/contract/{id}/metadata', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ name: 'MyContract' }),
      });

      await api.getContractMetadata('contract1');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/contract/contract1/metadata',
        expect.any(Object)
      );
    });

    it('upgradeContract should POST to /api/v1/contract/{id}/upgrade', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ contractId: 'c1' }),
      });

      await api.upgradeContract('contract1', '0x...');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/contract/contract1/upgrade'),
        expect.any(Object)
      );
    });
  });

  describe('API Methods - Network', () => {
    beforeEach(async () => {
      api = new ZhtpApi(mockConfigProvider);
      await api.ensureInitialized();
      global.fetch = vi.fn();
    });

    it('getNetworkInfo should GET from /api/v1/blockchain/network/peers', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      });

      await api.getNetworkInfo();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/blockchain/network/peers',
        expect.any(Object)
      );
    });

    it('getBlockchainInfo should GET from /api/v1/blockchain/status', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      });

      await api.getBlockchainInfo();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/blockchain/status',
        expect.any(Object)
      );
    });

    it('getGasInfo should GET from /api/v1/network/gas', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      });

      await api.getGasInfo();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/network/gas',
        expect.any(Object)
      );
    });

    it('getNodeStatus should GET from /api/v1/protocol/info', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      });

      await api.getNodeStatus();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/protocol/info',
        expect.any(Object)
      );
    });

    it('getMeshPeers should GET from /api/v1/blockchain/network/peers', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ peers: ['p1'], count: 1 }),
      });

      const result = await api.getMeshPeers();

      expect(result.peers).toEqual(['p1']);
      expect(result.count).toBe(1);
    });

    it('getNetworkStats should aggregate multiple endpoints', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({ blockHeight: 100 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({ gasPrice: 1 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: vi.fn().mockResolvedValue({ peers: [] }),
        });

      const stats = await api.getNetworkStats();

      expect(stats).toHaveProperty('blockchain');
      expect(stats).toHaveProperty('gas');
      expect(stats).toHaveProperty('mesh');
      expect(stats).toHaveProperty('timestamp');
    });
  });

  describe('API Methods - Web4/DHT', () => {
    beforeEach(async () => {
      api = new ZhtpApi(mockConfigProvider);
      await api.ensureInitialized();
      global.fetch = vi.fn();
    });

    it('resolveDomain should GET from /api/v1/web4/resolve/{domain}', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ domain: 'example.web4' }),
      });

      await api.resolveDomain('example.web4');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/web4/resolve'),
        expect.any(Object)
      );
    });

    it('loadWeb4Resource should POST to /api/v1/web4/load', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ content: 'html' }),
      });

      await api.loadWeb4Resource('example.web4/index.html');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/web4/load',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('API Methods - ZK Proofs', () => {
    beforeEach(async () => {
      api = new ZhtpApi(mockConfigProvider);
      await api.ensureInitialized();
      global.fetch = vi.fn();
    });

    it('generateZkProof should POST to /api/v1/zkp/generate', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ type: 'proof', data: '...' }),
      });

      await api.generateZkProof({ data: 'test' });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/zkp/generate',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('verifyZkProof should return boolean', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ valid: true }),
      });

      const result = await api.verifyZkProof({ type: 'proof', data: '...' });

      expect(typeof result).toBe('boolean');
      expect(result).toBe(true);
    });

    it('verifyZkProof should return false for invalid proofs', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ valid: false }),
      });

      const result = await api.verifyZkProof({ type: 'proof', data: '...' });

      expect(result).toBe(false);
    });
  });

  describe('API Methods - Connection', () => {
    beforeEach(async () => {
      api = new ZhtpApi(mockConfigProvider);
      await api.ensureInitialized();
      global.fetch = vi.fn();
    });

    it('testConnection should GET /health', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      });

      const connected = await api.testConnection();

      expect(connected).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/health',
        expect.any(Object)
      );
    });

    it('testConnection should verify health endpoint', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      });

      const connected = await api.testConnection();

      expect(connected).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/health',
        expect.any(Object)
      );
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      api = new ZhtpApi(mockConfigProvider);
      await api.ensureInitialized();
      global.fetch = vi.fn();
    });

    it('should handle HTTP errors in API methods', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(api.getDaoProposals()).rejects.toThrow('HTTP 500');
    }, 10000);

    it('should handle 4xx errors without retry', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      // 4xx errors don't retry, so this should fail immediately
      await expect(api.getDaoProposals()).rejects.toThrow('HTTP 404');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle empty response bodies', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      });

      const proposals = await api.getDaoProposals();

      expect(Array.isArray(proposals)).toBe(true);
      expect(proposals.length).toBe(0);
    });
  });

  describe('Request Configuration', () => {
    beforeEach(async () => {
      api = new ZhtpApi(mockConfigProvider);
      await api.ensureInitialized();
      global.fetch = vi.fn();
    });

    it('should include Content-Type header for POST requests', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      });

      await api.submitVote('p1', true, 'u1');

      const callArgs = (global.fetch as any).mock.calls[0][1];
      expect(callArgs.headers['Content-Type']).toBe('application/json');
    });

    it('should include request body for POST requests', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      });

      await api.createIdentity({ username: 'test' });

      const callArgs = (global.fetch as any).mock.calls[0][1];
      expect(callArgs.body).toBeTruthy();
      expect(typeof callArgs.body).toBe('string');
    });

    it('should construct correct URLs with query parameters', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi
          .fn()
          .mockResolvedValue([
            { id: 'w1', balance: 100 },
          ]),
      });

      await api.getWalletBalance('address123');

      const calls = (global.fetch as any).mock.calls;
      const callUrl = calls[0][0];
      expect(callUrl).toContain('address123');
    });
  });
});
