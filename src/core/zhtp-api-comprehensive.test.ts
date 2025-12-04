/**
 * Comprehensive tests for ALL remaining untested ZHTP API methods
 * Target: 98%+ coverage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ZhtpApi } from './zhtp-api';
import { ApiConfig } from './types';

describe('ZhtpApi - Comprehensive Coverage', () => {
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

  beforeEach(async () => {
    vi.clearAllMocks();
    api = new ZhtpApi(mockConfigProvider);
    await api.ensureInitialized();
    global.fetch = vi.fn();
  });

  describe('Identity - Legacy Methods', () => {
    it('recoverIdentity should call correct endpoint for seed method', async () => {
      const mockIdentity = {
        did: 'did:recovered',
        displayName: 'Recovered',
        identityType: 'citizen' as const,
        createdAt: '2024-01-01T00:00:00Z',
        citizenship: true,
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockIdentity),
      });

      const result = await api.recoverIdentity('seed', 'test-seed-data');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/identity/recover/seed',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ data: 'test-seed-data' }),
        })
      );
      expect(result.did).toBe('did:recovered');
    });

    it('recoverIdentity should work with backup method', async () => {
      const mockIdentity = {
        did: 'did:backup',
        displayName: 'Backup',
        identityType: 'citizen' as const,
        createdAt: '2024-01-01T00:00:00Z',
        citizenship: true,
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockIdentity),
      });

      await api.recoverIdentity('backup', 'backup-data');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/identity/recover/backup',
        expect.any(Object)
      );
    });

    it('recoverIdentity should work with social method', async () => {
      const mockIdentity = {
        did: 'did:social',
        displayName: 'Social',
        identityType: 'citizen' as const,
        createdAt: '2024-01-01T00:00:00Z',
        citizenship: true,
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockIdentity),
      });

      await api.recoverIdentity('social', 'social-recovery-data');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/identity/recover/social',
        expect.any(Object)
      );
    });

    it('createZkDid should POST to zkdid/create', async () => {
      const mockDid = { did: 'did:zk:test', created: true };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockDid),
      });

      const didData = { identity_type: 'human' };
      const result = await api.createZkDid(didData);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/identity/zkdid/create',
        expect.objectContaining({
          body: JSON.stringify(didData),
        })
      );
      expect(result.did).toBe('did:zk:test');
    });

    it('createZkDid should work without data', async () => {
      const mockDid = { did: 'did:zk:default' };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockDid),
      });

      await api.createZkDid();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({}),
        })
      );
    });

    it('signInWithIdentity should POST identity and passphrase', async () => {
      const mockResult = {
        token: 'jwt-token',
        identity: {
          did: 'did:test',
          displayName: 'Test',
          identityType: 'citizen' as const,
          createdAt: '2024-01-01T00:00:00Z',
          citizenship: true,
        },
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResult),
      });

      const identity = mockResult.identity;
      const result = await api.signInWithIdentity(identity, 'passphrase');

      expect(result.token).toBe('jwt-token');
      expect(result.identity.did).toBe('did:test');
    });
  });

  describe('DAO Operations - Extended', () => {
    it('createProposal should POST proposal data', async () => {
      const mockProposal = {
        id: 'prop-123',
        title: 'Test Proposal',
        description: 'Test',
        status: 'active' as const,
        votesFor: 0,
        votesAgainst: 0,
        creator: 'did:test',
        createdAt: '2024-01-01T00:00:00Z',
        deadline: '2024-02-01T00:00:00Z',
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockProposal),
      });

      const proposalData = { title: 'Test Proposal', description: 'Test' };
      const result = await api.createProposal(proposalData);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/dao/proposals',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(proposalData),
        })
      );
      expect(result.id).toBe('prop-123');
    });

    it('getProposalDetails should GET specific proposal', async () => {
      const mockDetails = {
        id: 'prop-456',
        title: 'Detailed Proposal',
        description: 'Details',
        status: 'passed' as const,
        votesFor: 100,
        votesAgainst: 50,
        creator: 'did:creator',
        createdAt: '2024-01-01T00:00:00Z',
        deadline: '2024-02-01T00:00:00Z',
        executionData: { action: 'transfer' },
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockDetails),
      });

      const result = await api.getProposalDetails('prop-456');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/dao/proposals/prop-456',
        expect.any(Object)
      );
      expect(result.executionData).toBeDefined();
    });

    it('getDaoData should GET dao data', async () => {
      const mockData = { participants: 1000, totalVotes: 5000 };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      });

      const result = await api.getDaoData();

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/dao/data',
        expect.any(Object)
      );
      expect(result.participants).toBe(1000);
    });

    it('getDaoDelegates should GET list of delegates', async () => {
      const mockDelegates = [
        {
          id: 'del-1',
          name: 'Delegate 1',
          votingPower: 500,
          delegators: 10,
          activeProposals: 3,
          reputation: 95,
        },
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockDelegates),
      });

      const result = await api.getDaoDelegates();

      expect(result).toHaveLength(1);
      expect(result[0].votingPower).toBe(500);
    });

    it('getDelegateProfile should GET specific delegate', async () => {
      const mockDelegate = {
        id: 'del-2',
        name: 'Alice',
        votingPower: 1000,
        delegators: 20,
        activeProposals: 5,
        reputation: 98,
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockDelegate),
      });

      const result = await api.getDelegateProfile('del-2');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/dao/delegates/del-2',
        expect.any(Object)
      );
      expect(result.reputation).toBe(98);
    });

    it('registerDelegate should POST delegate registration', async () => {
      const mockDelegate = {
        id: 'del-new',
        name: 'New Delegate',
        votingPower: 0,
        delegators: 0,
        activeProposals: 0,
        reputation: 50,
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockDelegate),
      });

      const delegateInfo = { name: 'New Delegate', bio: 'Test bio' };
      const result = await api.registerDelegate('did:user', delegateInfo);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/dao/delegates/register',
        expect.objectContaining({
          body: JSON.stringify({ userDid: 'did:user', delegateInfo }),
        })
      );
      expect(result.name).toBe('New Delegate');
    });

    it('revokeDelegation should POST revocation', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      });

      await api.revokeDelegation('did:user');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/dao/delegates/revoke',
        expect.objectContaining({
          body: JSON.stringify({ userDid: 'did:user' }),
        })
      );
    });

    it('getTreasuryHistory should GET treasury records', async () => {
      const mockHistory = [
        {
          id: 'tx-1',
          from: 'dao',
          to: 'recipient',
          amount: 1000,
          reason: 'Grant',
          timestamp: '2024-01-01T00:00:00Z',
          status: 'executed' as const,
        },
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockHistory),
      });

      const result = await api.getTreasuryHistory();

      expect(result).toHaveLength(1);
      expect(result[0].reason).toBe('Grant');
    });

    it('createSpendingProposal should POST spending proposal', async () => {
      const mockProposal = {
        id: 'spend-1',
        title: 'Spending',
        description: 'Spend funds',
        status: 'active' as const,
        votesFor: 0,
        votesAgainst: 0,
        creator: 'did:test',
        createdAt: '2024-01-01T00:00:00Z',
        deadline: '2024-02-01T00:00:00Z',
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockProposal),
      });

      const proposalData = { amount: 5000, recipient: 'did:recipient' };
      const result = await api.createSpendingProposal(proposalData);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/dao/proposals/spending',
        expect.any(Object)
      );
      expect(result.title).toBe('Spending');
    });

    it('getUserVotes should GET user voting history', async () => {
      const mockVotes = [
        { proposalId: 'prop-1', vote: true },
        { proposalId: 'prop-2', vote: false },
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockVotes),
      });

      const result = await api.getUserVotes('did:user');

      expect(result).toHaveLength(2);
      expect(result[0].vote).toBe(true);
    });
  });

  describe('Web4/DHT Operations', () => {
    it('resolveDapp should resolve domain', async () => {
      const mockDapp = { domain: 'test.zhtp', contentHash: 'hash123' };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockDapp),
      });

      const result = await api.resolveDapp('test.zhtp');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/dht/web4/resolve/test.zhtp',
        expect.any(Object)
      );
      expect(result.domain).toBe('test.zhtp');
    });

    it('loadWeb4Resource should POST resource URL', async () => {
      const mockResource = { content: 'data', type: 'html' };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResource),
      });

      const result = await api.loadWeb4Resource('zhtp://test.zhtp/page');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/web4/load',
        expect.objectContaining({
          body: JSON.stringify({ url: 'zhtp://test.zhtp/page' }),
        })
      );
      expect(result.content).toBe('data');
    });

    it('getContractContent should GET contract content', async () => {
      const mockContent = { code: 'contract_code' };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockContent),
      });

      const result = await api.getContractContent('contract-123');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/dht/contract/contract-123',
        expect.any(Object)
      );
      expect(result.code).toBe('contract_code');
    });

    it('getContractContent should support path parameter', async () => {
      const mockContent = { file: 'module.js' };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockContent),
      });

      await api.getContractContent('contract-123', '/lib/module.js');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('path=%2Flib%2Fmodule.js'),
        expect.any(Object)
      );
    });

    it('getContractByHash should GET contract by hash', async () => {
      const mockContract = { hash: 'abc123', code: 'code' };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockContract),
      });

      const result = await api.getContractByHash('abc123');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/blockchain/contract/abc123',
        expect.any(Object)
      );
      expect(result.hash).toBe('abc123');
    });

    it('getContractById should GET contract by ID', async () => {
      const mockContract = {
        id: 'contract-456',
        name: 'TestContract',
        version: '1.0.0',
        author: 'did:author',
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockContract),
      });

      const result = await api.getContractById('contract-456');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/contract/contract-456',
        expect.any(Object)
      );
      expect(result.name).toBe('TestContract');
    });
  });

  describe('Transaction Operations', () => {
    it('getTransactionHistory should support wallet_type parameter', async () => {
      const mockTxs = [
        {
          id: 'tx-1',
          from: 'addr1',
          to: 'addr2',
          amount: 100,
          status: 'confirmed' as const,
          timestamp: '2024-01-01T00:00:00Z',
        },
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockTxs),
      });

      await api.getTransactionHistory('addr1', 'primary');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('wallet_type=primary'),
        expect.any(Object)
      );
    });

    it('sendTransaction should support metadata', async () => {
      const mockTx = {
        id: 'tx-new',
        from: 'from-addr',
        to: 'to-addr',
        amount: 500,
        status: 'pending' as const,
        timestamp: '2024-01-01T00:00:00Z',
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockTx),
      });

      const metadata = { memo: 'Payment for services' };
      await api.sendTransaction('from-addr', 'to-addr', 500, metadata);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            from: 'from-addr',
            to: 'to-addr',
            amount: 500,
            metadata,
          }),
        })
      );
    });
  });

  describe('Success Path Coverage', () => {
    it('verifyZkProof should return true for valid proof', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ valid: true }),
      });

      const proof = { type: 'test', data: 'proof-data', timestamp: '2024-01-01' };
      const result = await api.verifyZkProof(proof);

      expect(result).toBe(true);
    });

    it('testConnection should return true on successful health check', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ healthy: true }),
      });

      const result = await api.testConnection();

      expect(result).toBe(true);
    });

    it('getProtocolInfo should return protocol data', async () => {
      const mockNodeStatus = {
        version: '1.0.0',
        quantum_resistant: true,
        zk_privacy_enabled: true,
        mesh_networking: true,
        dao_fees_enabled: true,
        network_id: 'testnet',
        consensus_state: 'active',
        block_height: 1000,
        peer_count: 5,
        healthy: true,
        status: 'running',
        uptime_seconds: 3600,
        latency_ms: 10,
        fully_synced: true,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockNodeStatus),
      });

      const result = await api.getProtocolInfo();

      expect(result.success).toBe(true);
      expect(result.protocol).toBe('ZHTP/1.0');
      expect(result.version).toBe('1.0.0');
      expect(result.features.quantum_resistant).toBe(true);
      expect(result.network.block_height).toBe(1000);
    });
  });
});
