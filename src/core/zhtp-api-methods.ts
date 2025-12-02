/**
 * ZHTP API Methods
 * All API method implementations for various operations
 */

import { ZhtpApiCore } from './zhtp-api-core';
import {
  Identity,
  Wallet,
  NetworkStatus,
  DaoProposal,
  DaoStats,
  Transaction,
  Delegate,
  ProposalDetails,
  TreasuryRecord,
  DApp,
  SmartContract,
  ContractDeploymentResult,
  ContractExecutionResult,
  Asset,
  NodeStatus,
  GasInfo,
  Proof,
  SignupRequest,
  SignupResponse,
  LoginRequest,
  LoginResponse,
  BackupData,
  BackupVerification,
  SeedVerification,
  SeedPhrases,
  Guardian,
  GuardianResponse,
  RecoverySession,
  RecoveryStatus,
  CitizenshipResult,
} from './types';

export abstract class ZhtpApiMethods extends ZhtpApiCore {
  // ==================== Identity Operations ====================

  async signIn(did: string, passphrase: string): Promise<Identity> {
    return this.request<Identity>('/api/v1/identity/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ did, passphrase }),
    });
  }

  async createIdentity(data: any): Promise<Identity> {
    return this.request<Identity>('/api/v1/identity/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  /**
   * Sign up a new citizen identity with 3 wallets, DAO membership, and welcome bonus
   */
  async signup(request: SignupRequest): Promise<Identity> {
    const response = await this.request<SignupResponse>('/api/v1/identity/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    // Map backend response to Identity interface
    return this.mapSignupResponseToIdentity(response);
  }

  /**
   * Login with existing identity
   */
  async login(request: LoginRequest): Promise<Identity> {
    const response = await this.request<LoginResponse>('/api/v1/identity/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    // Map backend response to Identity interface
    return this.mapLoginResponseToIdentity(response);
  }

  /**
   * Map signup response from backend to Identity interface
   */
  private mapSignupResponseToIdentity(response: SignupResponse): Identity {
    const citizenship = response.citizenship_result;

    return {
      did: response.identity_id,
      displayName: citizenship?.wallet_seed_phrases ? 'Citizen' : 'Unknown',
      identityType: response.identity_type.toLowerCase() === 'human' ? 'citizen' : 'organization',
      createdAt: new Date(response.created_at * 1000).toISOString(),
      citizenship: !!citizenship,
      wallets: citizenship ? {
        primary: {
          id: citizenship.primary_wallet_id,
          wallet_type: 'Primary',
          name: 'Primary Wallet',
          balance: citizenship.welcome_bonus.bonus_amount,
          staked_balance: 0,
          pending_rewards: 0,
        },
        ubi: {
          id: citizenship.ubi_wallet_id,
          wallet_type: 'UBI',
          name: 'UBI Wallet',
          balance: 0,
          staked_balance: 0,
          pending_rewards: 0,
        },
        savings: {
          id: citizenship.savings_wallet_id,
          wallet_type: 'Savings',
          name: 'Savings Wallet',
          balance: 0,
          staked_balance: 0,
          pending_rewards: 0,
        },
      } : undefined,
      daoMembership: citizenship ? {
        votingPower: citizenship.dao_registration.voting_power,
        soulboundNftIssued: citizenship.dao_registration.soulbound_nft_issued,
      } : undefined,
      seedPhrases: citizenship ? {
        primary: citizenship.wallet_seed_phrases.primary_wallet_seeds.words,
        ubi: citizenship.wallet_seed_phrases.ubi_wallet_seeds.words,
        savings: citizenship.wallet_seed_phrases.savings_wallet_seeds.words,
      } : undefined,
      votingPower: citizenship?.dao_registration.voting_power,
    };
  }

  /**
   * Map login response from backend to Identity interface
   */
  private mapLoginResponseToIdentity(response: LoginResponse): Identity {
    return {
      did: response.identity_id,
      displayName: response.display_name,
      identityType: response.identity_type.toLowerCase() === 'human' ? 'citizen' : 'organization',
      createdAt: new Date().toISOString(),
      citizenship: true,
      wallets: {
        primary: response.wallets.primary,
        ubi: response.wallets.ubi,
        savings: response.wallets.savings,
      },
      // Note: DAO membership info not returned by login endpoint yet
      daoMembership: undefined,
      votingPower: undefined,
    };
  }

  async recoverIdentity(
    method: 'seed' | 'backup' | 'social',
    data: string
  ): Promise<Identity> {
    const endpoint = `/api/v1/identity/recover/${method}`;
    return this.request<Identity>(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    });
  }

  async recoverIdentityFromSeed(recoveryData: Record<string, any>): Promise<Identity> {
    return this.request<Identity>('/api/v1/identity/restore/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recoveryData),
    });
  }

  async restoreIdentityFromBackup(backupData: Record<string, any>): Promise<Identity> {
    return this.request<Identity>('/api/v1/identity/backup/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backupData),
    });
  }

  async recoverIdentityWithGuardians(guardianData: Record<string, any>): Promise<Identity> {
    return this.request<Identity>('/api/v1/identity/recover/guardians', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(guardianData),
    });
  }

  // ==================== Backup Operations ====================

  async exportBackup(identityId: string, password: string): Promise<BackupData> {
    return this.request<BackupData>('/api/v1/identity/backup/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity_id: identityId, password }),
    });
  }

  async importBackup(backupData: string, password: string): Promise<Identity> {
    return this.request<Identity>('/api/v1/identity/backup/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ backup_data: backupData, password }),
    });
  }

  async verifyBackup(backupData: string): Promise<BackupVerification> {
    return this.request<BackupVerification>('/api/v1/identity/backup/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ backup_data: backupData }),
    });
  }

  // ==================== Seed Phrase Operations ====================

  async verifySeedPhrase(identityId: string, seedPhrase: string): Promise<SeedVerification> {
    return this.request<SeedVerification>('/api/v1/identity/seed/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity_id: identityId, seed_phrase: seedPhrase }),
    });
  }

  async exportSeedPhrases(identityId: string): Promise<SeedPhrases> {
    return this.request<SeedPhrases>(`/api/v1/identity/${identityId}/seeds`);
  }

  // ==================== Guardian Management ====================

  async addGuardian(identityId: string, guardianId: string, guardianInfo?: Record<string, any>): Promise<GuardianResponse> {
    return this.request<GuardianResponse>('/api/v1/guardian/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identity_id: identityId,
        guardian_id: guardianId,
        ...guardianInfo
      }),
    });
  }

  async listGuardians(identityId: string): Promise<Guardian[]> {
    return this.request<Guardian[]>(`/api/v1/guardian/list/${identityId}`);
  }

  async removeGuardian(identityId: string, guardianId: string): Promise<void> {
    await this.request<void>('/api/v1/guardian/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity_id: identityId, guardian_id: guardianId }),
    });
  }

  async acceptGuardianInvite(guardianId: string, identityId: string): Promise<void> {
    await this.request<void>('/api/v1/guardian/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guardian_id: guardianId, identity_id: identityId }),
    });
  }

  async declineGuardianInvite(guardianId: string, identityId: string): Promise<void> {
    await this.request<void>('/api/v1/guardian/decline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guardian_id: guardianId, identity_id: identityId }),
    });
  }

  // ==================== Guardian Recovery Flow ====================

  async initiateRecovery(identityId: string, guardianIds: string[]): Promise<RecoverySession> {
    return this.request<RecoverySession>('/api/v1/guardian/recovery/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity_id: identityId, guardian_ids: guardianIds }),
    });
  }

  async approveRecovery(guardianId: string, recoveryId: string, approval: boolean): Promise<void> {
    await this.request<void>('/api/v1/guardian/recovery/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guardian_id: guardianId, recovery_id: recoveryId, approval }),
    });
  }

  async getRecoveryStatus(recoveryId: string): Promise<RecoveryStatus> {
    return this.request<RecoveryStatus>(`/api/v1/guardian/recovery/status/${recoveryId}`);
  }

  async cancelRecovery(recoveryId: string): Promise<void> {
    await this.request<void>('/api/v1/guardian/recovery/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recovery_id: recoveryId }),
    });
  }

  // ==================== Citizenship ====================

  async applyCitizenship(identityId: string, applicationData?: Record<string, any>): Promise<CitizenshipResult> {
    return this.request<CitizenshipResult>('/api/v1/identity/citizenship/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity_id: identityId, ...applicationData }),
    });
  }

  async createZkDid(didData?: Record<string, any>): Promise<any> {
    return this.request<any>('/api/v1/identity/zkdid/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(didData || {}),
    });
  }

  async getIdentity(did: string): Promise<Identity> {
    return this.request<Identity>(`/api/v1/identity/get/${did}`);
  }

  async verifyIdentity(did: string, requirements?: Record<string, any>): Promise<boolean> {
    try {
      const response = await this.request<{ verified: boolean }>(
        `/api/v1/identity/verify/${did}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requirements || {}),
        }
      );
      return response.verified || false;
    } catch (error) {
      console.warn('⚠️ Failed to verify identity:', error);
      return false;
    }
  }

  async checkIdentityExists(identifier: string): Promise<boolean> {
    try {
      const response = await this.request<{ exists: boolean }>(
        `/api/v1/identity/exists/${encodeURIComponent(identifier)}`
      );
      return response.exists || false;
    } catch (error) {
      console.warn('⚠️ Failed to check identity existence:', error);
      return false;
    }
  }

  async signInWithIdentity(
    identity: Identity,
    passphrase: string
  ): Promise<{ token: string; identity: Identity }> {
    return this.request<{ token: string; identity: Identity }>(
      '/api/v1/identity/signin-with-identity',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity, passphrase }),
      }
    );
  }

  // ==================== Network Operations ====================

  async getNetworkInfo(): Promise<NetworkStatus> {
    return this.request<NetworkStatus>('/api/v1/blockchain/network/peers');
  }

  // ==================== Wallet & Transaction Operations ====================

  async getWallets(did: string): Promise<Wallet[]> {
    return this.request<Wallet[]>(
      `/wallet/balance?address=${encodeURIComponent(did)}`
    );
  }

  async getWalletBalance(did: string): Promise<number> {
    const wallets = await this.getWallets(did);
    return wallets.reduce((sum, w) => sum + w.balance, 0);
  }

  async getTransactionHistory(
    address: string,
    walletType?: string
  ): Promise<Transaction[]> {
    let endpoint = `/wallet/transactions?address=${encodeURIComponent(address)}`;
    if (walletType) {
      endpoint += `&wallet_type=${encodeURIComponent(walletType)}`;
    }
    return this.request<Transaction[]>(endpoint);
  }

  async getAssets(address: string): Promise<Asset[]> {
    return this.request<Asset[]>(`/wallet/assets?address=${encodeURIComponent(address)}`);
  }

  async sendTransaction(
    from: string,
    to: string,
    amount: number,
    metadata?: Record<string, any>
  ): Promise<Transaction> {
    return this.request<Transaction>('/api/v1/wallet/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, amount, metadata }),
    });
  }

  // ==================== DAO Operations ====================

  async getDaoProposals(): Promise<DaoProposal[]> {
    return this.request<DaoProposal[]>('/api/v1/dao/proposals/list');
  }

  async getDaoStats(): Promise<DaoStats> {
    const [proposals, treasury, delegates] = await Promise.all([
      this.getDaoProposals(),
      this.getDaoTreasury(),
      this.getDaoDelegates().catch(() => []),
    ]);

    const activeCount = proposals.filter(p => p.status === 'active').length;
    const totalVotes = proposals.reduce((sum, p) => sum + p.votesFor + p.votesAgainst, 0);
    const maxVotes = proposals.reduce((sum, p) => {
      const maxForProposal = Math.max(p.votesFor, p.votesAgainst);
      return sum + maxForProposal;
    }, 0);
    const participationRate = maxVotes > 0 ? totalVotes / (maxVotes * 2) : 0;

    return {
      totalProposals: proposals.length,
      activeProposals: activeCount,
      treasury,
      delegates: delegates.length,
      participationRate: Math.min(participationRate, 1), // Clamp to 0-1
    };
  }

  async createProposal(proposal: any): Promise<DaoProposal> {
    return this.request<DaoProposal>('/api/v1/dao/proposals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proposal),
    });
  }

  async submitVote(
    proposalId: string,
    vote: boolean,
    voterDid: string
  ): Promise<void> {
    await this.request<void>('/api/v1/dao/vote/cast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposalId, vote, voterDid }),
    });
  }

  async getDaoTreasury(): Promise<number> {
    const response = await this.request<any>('/api/v1/dao/treasury/balance');
    return response?.balance || 0;
  }

  async getProposalDetails(proposalId: string): Promise<ProposalDetails> {
    return this.request<ProposalDetails>(`/dao/proposals/${proposalId}`);
  }

  async getDaoData(): Promise<Record<string, any>> {
    return this.request<Record<string, any>>('/api/v1/dao/data');
  }

  async getDaoDelegates(): Promise<Delegate[]> {
    return this.request<Delegate[]>('/api/v1/dao/delegates');
  }

  async getDelegateProfile(delegateId: string): Promise<Delegate> {
    return this.request<Delegate>(`/dao/delegates/${delegateId}`);
  }

  async registerDelegate(userDid: string, delegateInfo: Record<string, any>): Promise<Delegate> {
    return this.request<Delegate>('/api/v1/dao/delegates/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userDid, delegateInfo }),
    });
  }

  async revokeDelegation(userDid: string): Promise<void> {
    await this.request<void>('/api/v1/dao/delegates/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userDid }),
    });
  }

  async getTreasuryHistory(): Promise<TreasuryRecord[]> {
    return this.request<TreasuryRecord[]>('/api/v1/dao/treasury/history');
  }

  async createSpendingProposal(proposalData: Record<string, any>): Promise<DaoProposal> {
    return this.request<DaoProposal>('/api/v1/dao/proposals/spending', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proposalData),
    });
  }

  async getVotingPower(userDid: string): Promise<number> {
    try {
      const response = await this.request<{ votingPower: number }>(
        `/dao/voting-power/${userDid}`
      );
      return response.votingPower || 0;
    } catch (error) {
      console.warn('⚠️ Failed to get voting power:', error);
      return 0;
    }
  }

  async getUserVotes(userDid: string): Promise<Array<{ proposalId: string; vote: boolean }>> {
    return this.request<Array<{ proposalId: string; vote: boolean }>>(
      `/dao/user-votes/${userDid}`
    );
  }

  // ==================== Web4/DHT Operations ====================

  async resolveDapp(domain: string): Promise<any> {
    return this.request<any>(
      `/api/v1/dht/web4/resolve/${encodeURIComponent(domain)}`
    );
  }

  async loadWeb4Resource(url: string): Promise<Record<string, any>> {
    return this.request<Record<string, any>>('/api/v1/web4/load', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
  }

  async getContractContent(contractId: string, path?: string): Promise<any> {
    let endpoint = `/api/v1/dht/contract/${contractId}`;
    if (path) {
      endpoint += `?path=${encodeURIComponent(path)}`;
    }
    return this.request<any>(endpoint);
  }

  async getContractByHash(hash: string): Promise<any> {
    return this.request<any>(`/api/v1/blockchain/contract/${hash}`);
  }

  async getContractById(contractId: string): Promise<SmartContract> {
    return this.request<SmartContract>(`/api/v1/contract/${contractId}`);
  }

  async resolveDomain(domainName: string): Promise<DApp> {
    return this.request<DApp>(`/api/v1/web4/resolve/${encodeURIComponent(domainName)}`);
  }

  // ==================== Blockchain Operations ====================

  async getBlockchainInfo(): Promise<any> {
    return this.request<any>('/api/v1/blockchain/status');
  }

  async getGasInfo(): Promise<any> {
    return this.request<any>('/api/v1/network/gas');
  }

  async getNodeStatus(): Promise<NodeStatus> {
    return this.request<NodeStatus>('/api/v1/protocol/info');
  }

  async getMeshPeers(): Promise<{ peers: string[]; count: number }> {
    return this.request<{ peers: string[]; count: number }>('/api/v1/blockchain/network/peers');
  }

  async getNetworkStats(): Promise<{
    blockchain: Record<string, any>;
    gas: Record<string, any>;
    mesh: Record<string, any>;
    timestamp: string;
  }> {
    try {
      const [blockchainInfo, gasInfo, meshInfo] = await Promise.all([
        this.getBlockchainInfo().catch(() => ({})),
        this.getGasInfo().catch(() => ({})),
        this.getMeshPeers().catch(() => ({ peers: [], count: 0 })),
      ]);

      return {
        blockchain: blockchainInfo,
        gas: gasInfo,
        mesh: meshInfo,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.warn('⚠️ Failed to get network stats:', error);
      throw error;
    }
  }

  // ==================== Smart Contract Operations ====================

  async deployContract(
    contractData: SmartContract,
    options?: Record<string, any>
  ): Promise<ContractDeploymentResult> {
    return this.request<ContractDeploymentResult>('/api/v1/contract/deploy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...contractData, ...options }),
    });
  }

  async executeContract(
    contractId: string,
    functionName: string,
    args?: any[]
  ): Promise<ContractExecutionResult> {
    return this.request<ContractExecutionResult>('/api/v1/contract/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contractId, functionName, args }),
    });
  }

  async queryContract(
    contractId: string,
    functionName?: string,
    args?: any[]
  ): Promise<Record<string, any>> {
    let endpoint = `/api/v1/contract/query/${contractId}`;
    if (functionName) {
      endpoint += `/${functionName}`;
    }
    return this.request<Record<string, any>>(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ args }),
    });
  }

  async getContractMetadata(contractId: string): Promise<SmartContract> {
    return this.request<SmartContract>(`/api/v1/contract/${contractId}/metadata`);
  }

  async upgradeContract(
    contractId: string,
    newBytecode: string,
    metadata?: Record<string, any>
  ): Promise<ContractDeploymentResult> {
    return this.request<ContractDeploymentResult>(`/api/v1/contract/${contractId}/upgrade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newBytecode, metadata }),
    });
  }

  // ==================== Zero-Knowledge Proof Operations ====================

  async generateZkProof(data: Record<string, any>): Promise<Proof> {
    return this.request<Proof>('/api/v1/zkp/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async verifyZkProof(proof: Proof): Promise<boolean> {
    try {
      const response = await this.request<{ valid: boolean }>('/api/v1/zkp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proof),
      });
      return response.valid || false;
    } catch (error) {
      console.warn('⚠️ Failed to verify zero-knowledge proof:', error);
      return false;
    }
  }

  // ==================== Connection Management ====================

  async testConnection(): Promise<boolean> {
    try {
      await this.request<any>('/health');
      return true;
    } catch (error) {
      console.warn('⚠️ Health check failed:', error);
      return false;
    }
  }

  // ==================== Protocol Information ====================

  async getProtocolInfo() {
    try {
      const response = await this.request<any>('/api/v1/protocol/info');

      return {
        success: true,
        protocol: 'ZHTP/1.0',
        version: response.version,
        features: {
          quantum_resistant: response.quantum_resistant,
          zk_privacy_enabled: response.zk_privacy_enabled,
          mesh_networking: response.mesh_networking,
          dao_fees_enabled: response.dao_fees_enabled,
          pure_tcp: true
        },
        network: {
          id: response.network_id,
          consensus: response.consensus_state,
          block_height: response.block_height,
          peer_count: response.peer_count,
          healthy: response.healthy
        },
        node: {
          status: response.status,
          uptime: response.uptime_seconds,
          latency: response.latency_ms,
          synced: response.fully_synced
        }
      };
    } catch (error) {
      console.error('❌ Failed to get protocol info:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        protocol: 'ZHTP/1.0',
        features: {
          quantum_resistant: true,
          zk_privacy_enabled: true,
          mesh_networking: true,
          dao_fees_enabled: true,
          pure_tcp: true
        }
      };
    }
  }
}
