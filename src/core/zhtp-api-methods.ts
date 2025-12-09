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
  BackupStatus,
  ImportBackupResponse,
  SeedVerification,
  SeedPhrases,
  Guardian,
  GuardianResponse,
  RecoverySession,
  RecoveryStatus,
  CitizenshipResult,
  ProofData,
  GenerateProofRequest,
  GenerateProofResponse,
  VerifyProofResponse,
  WalletListResponse,
  WalletBalanceResponse,
  DetailedWalletInfo,
  SimpleSendRequest,
  CrossWalletTransferRequest,
  StakingRequest,
  TransactionHistoryResponse,
  NetworkPeersResponse,
  NetworkStatsResponse,
  GasInfoResponse,
  AddPeerRequest,
  AddPeerResponse,
  ProtocolInfoResponse,
  HealthCheckResponse,
  VersionResponse,
  CapabilitiesResponse,
  ProtocolStatsResponse,
  Web4RegisterRequest,
  Web4RegisterResponse,
  Web4ResolveResponse,
  Web4DomainLookupResponse,
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

  /**
   * Recover identity from recovery phrase (20-word phrase)
   *
   * SECURITY WARNINGS:
   * 1. This endpoint is rate-limited to 3 attempts per hour per IP
   * 2. Requires exactly 20 words
   * 3. Creates a new session upon successful recovery
   *
   * @param recoveryPhrase - 20-word recovery phrase
   * @returns Recovered identity info and new session token
   * @throws Error if recovery phrase is invalid or rate limit exceeded
   */
  async recoverIdentity(recoveryPhrase: string): Promise<{ status: string; identity: { identity_id: string; did: string }; session_token: string }> {
    const words = recoveryPhrase.trim().split(/\s+/);
    if (words.length !== 20) {
      throw new Error('Recovery phrase must be exactly 20 words');
    }

    return this.request<{ status: string; identity: { identity_id: string; did: string }; session_token: string }>(
      '/api/v1/identity/recover',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recovery_phrase: recoveryPhrase }),
      }
    );
  }

  /**
   * @deprecated Use recoverIdentity() with recovery phrase instead
   */
  async recoverIdentityFromSeed(recoveryData: Record<string, any>): Promise<any> {
    console.warn('⚠️ recoverIdentityFromSeed() is deprecated. Use recoverIdentity() instead.');
    return this.recoverIdentity(recoveryData.recovery_phrase || '');
  }

  /**
   * @deprecated Use importBackup() instead
   */
  async restoreIdentityFromBackup(backupData: Record<string, any>): Promise<Identity> {
    console.warn('⚠️ restoreIdentityFromBackup() is deprecated. Use importBackup() instead.');
    return (await this.importBackup(backupData.backup_data, backupData.passphrase)) as any;
  }

  /**
   * @deprecated Guardian recovery endpoints not yet implemented in node
   */
  async recoverIdentityWithGuardians(guardianData: Record<string, any>): Promise<Identity> {
    console.warn('⚠️ Guardian recovery is not yet implemented in the node.');
    throw new Error('Guardian recovery endpoints not yet available');
  }

  /**
   * Generate a recovery phrase for identity backup
   *
   * SECURITY WARNINGS:
   * 1. Recovery phrase is returned ONCE and must be displayed immediately
   * 2. Client MUST display securely and NEVER store in logs/cache
   * 3. Use HTTPS only to prevent network sniffing
   * 4. Requires active authenticated session
   *
   * @param identityId - Identity ID to generate recovery phrase for
   * @param sessionToken - Active session token for authentication
   * @returns Recovery phrase hash, phrase (for display only), and instructions
   * @throws Error if session is invalid or identity not found
   */
  async generateRecoveryPhrase(
    identityId: string,
    sessionToken: string
  ): Promise<{ status: string; phrase_hash: string; recovery_phrase: string; instructions: string }> {
    return this.request<{ status: string; phrase_hash: string; recovery_phrase: string; instructions: string }>(
      '/api/v1/identity/backup/generate',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity_id: identityId, session_token: sessionToken }),
      }
    );
  }

  /**
   * Verify a recovery phrase is correct (20 words)
   *
   * SECURITY WARNINGS:
   * 1. Recovery phrase must be exactly 20 words
   * 2. Never log or store recovery phrases
   * 3. This endpoint prevents typos before using for recovery
   *
   * @param identityId - Identity ID that owns the recovery phrase
   * @param recoveryPhrase - 20-word recovery phrase to verify
   * @returns Verification result (true if valid, false if invalid)
   * @throws Error if recovery phrase format is invalid
   */
  async verifyRecoveryPhrase(
    identityId: string,
    recoveryPhrase: string
  ): Promise<{ status: string; verified: boolean }> {
    const words = recoveryPhrase.trim().split(/\s+/);
    if (words.length !== 20) {
      throw new Error('Recovery phrase must be exactly 20 words');
    }

    return this.request<{ status: string; verified: boolean }>(
      '/api/v1/identity/backup/verify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity_id: identityId, recovery_phrase: recoveryPhrase }),
      }
    );
  }

  /**
   * Reset password using recovery phrase
   *
   * SECURITY WARNINGS:
   * 1. This endpoint invalidates all existing sessions after successful reset
   * 2. Requires valid 20-word recovery phrase
   * 3. Use a strong new password (minimum 12 characters recommended)
   * 4. Cannot be reversed - old password will no longer work
   *
   * @param identityId - Identity ID (can also use DID format "did:zhtp:xxx")
   * @param recoveryPhrase - Valid 20-word recovery phrase
   * @param newPassword - New password to set
   * @returns Confirmation of password reset and session invalidation
   * @throws Error if recovery phrase is invalid or identity not found
   */
  async resetPassword(
    identityId: string,
    recoveryPhrase: string,
    newPassword: string
  ): Promise<{ status: string; message: string }> {
    const words = recoveryPhrase.trim().split(/\s+/);
    if (words.length !== 20) {
      throw new Error('Recovery phrase must be exactly 20 words');
    }

    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Handle both DID and hex identity ID formats
    let idValue = identityId;
    if (identityId.startsWith('did:zhtp:')) {
      idValue = identityId;
    }

    return this.request<{ status: string; message: string }>(
      '/api/v1/identity/password/recover',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identity_id: idValue,
          recovery_phrase: recoveryPhrase,
          new_password: newPassword,
        }),
      }
    );
  }

  // ==================== Backup Operations ====================

  /**
   * Export encrypted identity backup
   *
   * SECURITY WARNINGS:
   * 1. Use a strong passphrase (minimum 12 characters)
   * 2. Store backup data securely offline
   * 3. Never share or log the passphrase
   * 4. This operation requires an active authenticated session
   *
   * @param identityId - Identity ID to backup
   * @param passphrase - Encryption passphrase (minimum 12 characters)
   * @returns Encrypted backup data (base64) with creation timestamp
   * @throws Error if passphrase is too short or session is invalid
   */
  async exportBackup(identityId: string, passphrase: string): Promise<BackupData> {
    if (passphrase.length < 12) {
      throw new Error('Passphrase must be at least 12 characters');
    }

    return this.request<BackupData>('/api/v1/identity/backup/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity_id: identityId, passphrase }),
    });
  }

  /**
   * Import and restore identity from encrypted backup
   *
   * SECURITY WARNINGS:
   * 1. This endpoint is rate-limited to 3 attempts per hour per IP
   * 2. Incorrect passphrase will result in decryption failure
   * 3. Creates a new session upon successful import
   *
   * @param backupData - Encrypted backup data (base64 string from exportBackup)
   * @param passphrase - Decryption passphrase (same as used for export)
   * @returns Restored identity info and new session token
   * @throws Error if passphrase is incorrect or backup is corrupted
   */
  async importBackup(backupData: string, passphrase: string): Promise<ImportBackupResponse> {
    if (passphrase.length < 12) {
      throw new Error('Passphrase must be at least 12 characters');
    }

    return this.request<ImportBackupResponse>('/api/v1/identity/backup/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ backup_data: backupData, passphrase }),
    });
  }

  async verifyBackup(backupData: string): Promise<BackupVerification> {
    return this.request<BackupVerification>('/api/v1/identity/backup/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ backup_data: backupData }),
    });
  }

  /**
   * Get backup status for an identity
   *
   * @param identityId - Identity ID to check
   * @returns Backup status including recovery phrase existence and verification state
   */
  async getBackupStatus(identityId: string): Promise<BackupStatus> {
    return this.request<BackupStatus>(
      `/api/v1/identity/backup/status?identity_id=${encodeURIComponent(identityId)}`
    );
  }

  // ==================== Seed Phrase Operations ====================

  /**
   * Verify a BIP39 seed phrase for a wallet
   *
   * SECURITY WARNINGS:
   * 1. Seed phrase must be exactly 12 words
   * 2. Never log or store seed phrases
   * 3. This endpoint is rate-limited to prevent brute force attacks
   * 4. Requires active authenticated session
   *
   * @param identityId - Identity ID that owns the wallet
   * @param seedPhrase - 12-word BIP39 seed phrase to verify
   * @returns Verification result
   * @throws Error if seed phrase format is invalid
   */
  async verifySeedPhrase(identityId: string, seedPhrase: string): Promise<SeedVerification> {
    const words = seedPhrase.trim().split(/\s+/);
    if (words.length !== 12) {
      throw new Error('Seed phrase must be exactly 12 words');
    }

    return this.request<SeedVerification>('/api/v1/identity/seed/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity_id: identityId, seed_phrase: seedPhrase }),
    });
  }

  /**
   * @deprecated This endpoint is not available in the node API
   */
  async exportSeedPhrases(identityId: string): Promise<SeedPhrases> {
    console.warn('⚠️ exportSeedPhrases() endpoint not available in node API. Seed phrases are only returned during identity creation.');
    throw new Error('Seed phrase export not available');
  }

  // ==================== Guardian Management ====================

  async addGuardian(
    identityId: string,
    sessionToken: string,
    guardianDid: string,
    guardianPublicKey: number[],
    guardianName: string
  ): Promise<GuardianResponse> {
    return this.request<GuardianResponse>('/api/v1/identity/guardians/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identity_id: identityId,
        session_token: sessionToken,
        guardian_did: guardianDid,
        guardian_public_key: guardianPublicKey,
        guardian_name: guardianName
      }),
    });
  }

  async listGuardians(sessionToken: string): Promise<{ guardians: Guardian[]; threshold: number }> {
    return this.request<{ guardians: Guardian[]; threshold: number }>('/api/v1/identity/guardians', {
      headers: {
        'Authorization': `Bearer ${sessionToken}`
      }
    });
  }

  async removeGuardian(guardianId: string, sessionToken: string): Promise<void> {
    await this.request<void>(`/api/v1/identity/guardians/${guardianId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${sessionToken}`
      }
    });
  }

  // ==================== Guardian Recovery Flow ====================

  async initiateRecovery(identityDid: string, requesterDevice: string): Promise<RecoverySession> {
    return this.request<RecoverySession>('/api/v1/identity/recovery/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity_did: identityDid, requester_device: requesterDevice }),
    });
  }

  async approveRecovery(
    recoveryId: string,
    guardianDid: string,
    sessionToken: string,
    signature: number[]
  ): Promise<{ status: string; approvals: number; required: number }> {
    return this.request<{ status: string; approvals: number; required: number }>(
      `/api/v1/identity/recovery/${recoveryId}/approve`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guardian_did: guardianDid,
          session_token: sessionToken,
          signature: signature
        }),
      }
    );
  }

  async rejectRecovery(
    recoveryId: string,
    guardianDid: string,
    sessionToken: string,
    signature: number[]
  ): Promise<void> {
    await this.request<void>(`/api/v1/identity/recovery/${recoveryId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guardian_did: guardianDid,
        session_token: sessionToken,
        signature: signature
      }),
    });
  }

  async completeRecovery(recoveryId: string): Promise<{ status: string; session_token: string; identity_did: string }> {
    return this.request<{ status: string; session_token: string; identity_did: string }>(
      `/api/v1/identity/recovery/${recoveryId}/complete`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  async getRecoveryStatus(recoveryId: string): Promise<RecoveryStatus> {
    return this.request<RecoveryStatus>(`/api/v1/identity/recovery/${recoveryId}/status`);
  }

  async getPendingRecoveries(sessionToken: string): Promise<{ pending_requests: Array<{ recovery_id: string; identity_did: string; initiated_at: number; expires_at: number }> }> {
    return this.request<{ pending_requests: Array<{ recovery_id: string; identity_did: string; initiated_at: number; expires_at: number }> }>(
      '/api/v1/identity/recovery/pending',
      {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      }
    );
  }

  // ==================== Citizenship ====================

  async applyCitizenship(identityId: string, applicationData?: Record<string, any>): Promise<CitizenshipResult> {
    return this.request<CitizenshipResult>('/api/v1/identity/citizenship/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity_id: identityId, ...applicationData }),
    });
  }

  /**
   * @deprecated ZK DID endpoints not yet implemented in the node
   */
  async createZkDid(didData?: Record<string, any>): Promise<any> {
    console.warn('⚠️ createZkDid() endpoint not yet implemented in node API.');
    throw new Error('ZK DID creation not yet available');
  }

  /**
   * Get identity information by ID
   *
   * @param identityId - Identity ID (hex format) or DID
   * @returns Identity information including type, access level, and timestamps
   * @throws Error if identity not found
   */
  async getIdentity(identityId: string): Promise<{ status: string; identity_id: string; identity_type: string; access_level: string; created_at: number; last_active: number }> {
    // Handle both DID and hex identity ID formats
    let idValue = identityId;
    if (identityId.startsWith('did:zhtp:')) {
      idValue = identityId.replace('did:zhtp:', '');
    }

    return this.request<{ status: string; identity_id: string; identity_type: string; access_level: string; created_at: number; last_active: number }>(
      `/api/v1/identity/${idValue}`
    );
  }

  /**
   * @deprecated This endpoint is not available in the node API
   */
  async verifyIdentity(did: string, requirements?: Record<string, any>): Promise<boolean> {
    console.warn('⚠️ verifyIdentity() endpoint not available in node API.');
    throw new Error('Identity verification endpoint not available');
  }

  /**
   * @deprecated This endpoint is not available in the node API
   */
  async checkIdentityExists(identifier: string): Promise<boolean> {
    console.warn('⚠️ checkIdentityExists() endpoint not available in node API.');
    throw new Error('Identity exists check endpoint not available');
  }

  /**
   * @deprecated This endpoint is not available in the node API. Use signIn() or login() instead.
   */
  async signInWithIdentity(
    identity: Identity,
    passphrase: string
  ): Promise<{ token: string; identity: Identity }> {
    console.warn('⚠️ signInWithIdentity() endpoint not available in node API. Use signIn() instead.');
    throw new Error('signInWithIdentity endpoint not available');
  }

  /**
   * Sign a message with an identity's private key
   *
   * SECURITY NOTES:
   * 1. Uses post-quantum CRYSTALS-Dilithium2 algorithm
   * 2. Signature is 2420 bytes
   * 3. For verifying message authenticity and identity ownership
   *
   * @param identityId - Identity ID (hex format) to sign with
   * @param message - Message to sign
   * @returns Signature, algorithm, and public key
   * @throws Error if identity not found or signing fails
   */
  async signMessage(
    identityId: string,
    message: string
  ): Promise<{ success: boolean; identity_id: string; message: string; signature: string; signature_algorithm: string; public_key: string }> {
    return this.request<{ success: boolean; identity_id: string; message: string; signature: string; signature_algorithm: string; public_key: string }>(
      '/api/v1/identity/sign',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity_id: identityId, message }),
      }
    );
  }

  // ==================== Network Operations ====================

  /**
   * Get list of connected network peers
   * @returns Peer information including peer IDs, types, and connection status
   */
  async getNetworkPeers(): Promise<NetworkPeersResponse> {
    return this.request<NetworkPeersResponse>('/api/v1/blockchain/network/peers');
  }

  /**
   * Get comprehensive network statistics including mesh status and traffic
   * @returns Network stats with mesh status, traffic, and peer distribution
   */
  async getNetworkStats(): Promise<NetworkStatsResponse> {
    return this.request<NetworkStatsResponse>('/api/v1/blockchain/network/stats');
  }

  /**
   * Get current gas pricing information for transaction cost estimation
   * @returns Gas prices including base fee, priority fee, and estimated costs
   */
  async getGasInfo(): Promise<GasInfoResponse> {
    return this.request<GasInfoResponse>('/api/v1/network/gas');
  }

  /**
   * Add a peer to the network by address
   * @param request - Peer address and optional peer type
   * @returns Connection result with peer ID and status
   */
  async addNetworkPeer(request: AddPeerRequest): Promise<AddPeerResponse> {
    return this.request<AddPeerResponse>('/api/v1/blockchain/network/peer/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  }

  /**
   * Remove a peer from the network
   * @param peerId - ID of the peer to remove
   * @returns Removal result with status
   */
  async removeNetworkPeer(peerId: string): Promise<any> {
    return this.request<any>(`/api/v1/blockchain/network/peer/${peerId}`, {
      method: 'DELETE',
    });
  }

  // Legacy method (kept for backward compatibility)

  /**
   * @deprecated Use getNetworkPeers() instead
   */
  async getNetworkInfo(): Promise<NetworkStatus> {
    const response = await this.getNetworkPeers();
    return {
      peers: response.peer_count,
      meshConnected: response.peers.length > 0,
      latency: 0,
      version: '1.0',
      quantumResistant: true,
    };
  }

  // ==================== Wallet & Transaction Operations ====================

  /**
   * List all wallets for an identity
   * @param identityId - Identity ID (hex string)
   * @returns List of all wallets with balances and permissions
   */
  async getWalletList(identityId: string): Promise<WalletListResponse> {
    return this.request<WalletListResponse>(`/api/v1/wallet/list/${identityId}`);
  }

  /**
   * Get balance for a specific wallet type
   * @param walletType - Wallet type (Primary, UBI, Savings, Staking, etc.)
   * @param identityId - Identity ID (hex string)
   * @returns Detailed balance information for the wallet
   */
  async getWalletBalance(walletType: string, identityId: string): Promise<WalletBalanceResponse> {
    return this.request<WalletBalanceResponse>(`/api/v1/wallet/balance/${walletType}/${identityId}`);
  }

  /**
   * Get comprehensive wallet statistics for an identity
   * @param identityId - Identity ID (hex string)
   * @returns Wallet statistics
   */
  async getWalletStatistics(identityId: string): Promise<any> {
    return this.request<any>(`/api/v1/wallet/statistics/${identityId}`);
  }

  /**
   * Get transaction history for an identity
   * @param identityId - Identity ID (hex string)
   * @returns Transaction history
   */
  async getWalletTransactionHistory(identityId: string): Promise<TransactionHistoryResponse> {
    return this.request<TransactionHistoryResponse>(`/api/v1/wallet/transactions/${identityId}`);
  }

  /**
   * Send a simple payment from primary wallet
   * @param request - Send request with from_identity, to_address, amount, memo
   * @returns Transaction result
   */
  async sendWalletPayment(request: SimpleSendRequest): Promise<any> {
    return this.request<any>('/api/v1/wallet/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  }

  /**
   * Transfer tokens between wallets of the same identity
   * @param request - Transfer request with identity_id, from_wallet, to_wallet, amount, purpose
   * @returns Transfer result with transaction ID
   */
  async transferBetweenWallets(request: CrossWalletTransferRequest): Promise<any> {
    return this.request<any>('/api/v1/wallet/transfer/cross-wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  }

  /**
   * Stake tokens from Primary wallet to Staking wallet
   * @param identityId - Identity ID (hex string)
   * @param amount - Amount to stake
   * @returns Staking result
   */
  async stakeTokens(identityId: string, amount: number): Promise<any> {
    const request: StakingRequest = {
      identity_id: identityId,
      amount: amount,
    };
    return this.request<any>('/api/v1/wallet/staking/stake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  }

  /**
   * Unstake tokens from Staking wallet back to Primary wallet
   * @param identityId - Identity ID (hex string)
   * @param amount - Amount to unstake
   * @returns Unstaking result
   */
  async unstakeTokens(identityId: string, amount: number): Promise<any> {
    const request: StakingRequest = {
      identity_id: identityId,
      amount: amount,
    };
    return this.request<any>('/api/v1/wallet/staking/unstake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  }

  // Legacy methods (kept for backward compatibility)

  /**
   * @deprecated Use getWalletList() instead
   */
  async getWallets(did: string): Promise<Wallet[]> {
    const response = await this.getWalletList(did);
    return response.wallets.map(w => ({
      id: w.wallet_id,
      name: w.wallet_type,
      balance: w.total_balance,
      address: w.wallet_id,
    }));
  }

  /**
   * @deprecated Use getWalletTransactionHistory() instead
   */
  async getTransactionHistory(address: string, walletType?: string): Promise<Transaction[]> {
    const response = await this.getWalletTransactionHistory(address);
    return response.transactions.map(tx => ({
      id: tx.tx_hash,
      from: tx.from_wallet || '',
      to: tx.to_address || '',
      amount: tx.amount,
      status: tx.status as 'pending' | 'confirmed' | 'failed',
      timestamp: new Date(tx.timestamp * 1000).toISOString(),
      blockNumber: tx.block_height || undefined,
      hash: tx.tx_hash,
    }));
  }

  async getAssets(address: string): Promise<Asset[]> {
    return this.request<Asset[]>(`/api/v1/wallet/assets?address=${encodeURIComponent(address)}`);
  }

  /**
   * @deprecated Use sendWalletPayment() instead
   */
  async sendTransaction(
    from: string,
    to: string,
    amount: number,
    metadata?: Record<string, any>
  ): Promise<Transaction> {
    const request: SimpleSendRequest = {
      from_identity: from,
      to_address: to,
      amount: amount,
      memo: metadata ? JSON.stringify(metadata) : undefined,
    };
    const result = await this.sendWalletPayment(request);
    return {
      id: result.transaction?.transaction_id || '',
      from: from,
      to: to,
      amount: amount,
      status: 'pending',
      timestamp: new Date().toISOString(),
    };
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
    return this.request<DaoProposal>('/api/v1/dao/proposal/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proposal),
    });
  }

  async submitVote(
    voterIdentityId: string,
    proposalId: string,
    voteChoice: 'yes' | 'no' | 'abstain',
    justification?: string
  ): Promise<void> {
    await this.request<void>('/api/v1/dao/vote/cast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        voter_identity_id: voterIdentityId,
        proposal_id: proposalId,
        vote_choice: voteChoice,
        justification
      }),
    });
  }

  async getDaoTreasury(): Promise<number> {
    const response = await this.request<any>('/api/v1/dao/treasury/status');
    return response?.treasury?.total_balance || 0;
  }

  async getProposalDetails(proposalId: string): Promise<ProposalDetails> {
    return this.request<ProposalDetails>(`/api/v1/dao/proposal/${proposalId}`);
  }

  async getDaoData(): Promise<Record<string, any>> {
    return this.request<Record<string, any>>('/api/v1/dao/data');
  }

  async getDaoDelegates(): Promise<Delegate[]> {
    return this.request<Delegate[]>('/api/v1/dao/delegates');
  }

  async getDelegateProfile(delegateId: string): Promise<Delegate> {
    return this.request<Delegate>(`/api/v1/dao/delegates/${delegateId}`);
  }

  async registerDelegate(userDid: string, delegateInfo: { name: string; bio: string }): Promise<Delegate> {
    return this.request<Delegate>('/api/v1/dao/delegates/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_did: userDid, delegate_info: delegateInfo }),
    });
  }

  async revokeDelegation(userDid: string): Promise<void> {
    await this.request<void>('/api/v1/dao/delegates/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_did: userDid }),
    });
  }

  async getTreasuryHistory(limit?: number, offset?: number): Promise<TreasuryRecord[]> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    const queryString = params.toString();
    const url = `/api/v1/dao/treasury/transactions${queryString ? '?' + queryString : ''}`;
    const response = await this.request<any>(url);
    return response?.transactions || [];
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
        `/api/v1/dao/voting-power/${userDid}`
      );
      return response.votingPower || 0;
    } catch (error) {
      console.warn('⚠️ Failed to get voting power:', error);
      return 0;
    }
  }

  async getUserVotes(userDid: string): Promise<Array<{ proposalId: string; vote: boolean }>> {
    return this.request<Array<{ proposalId: string; vote: boolean }>>(
      `/api/v1/dao/user-votes/${userDid}`
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

  /**
   * Lookup contract by blockchain transaction hash
   * @param hash - Deployment transaction hash
   */
  async getContractByHash(hash: string): Promise<SmartContract> {
    return this.request<SmartContract>(`/api/v1/blockchain/contract/${hash}`);
  }

  async getContractById(contractId: string): Promise<SmartContract> {
    return this.request<SmartContract>(`/api/v1/contract/${contractId}`);
  }

  async resolveDomain(domainName: string): Promise<DApp> {
    return this.request<DApp>(`/api/v1/web4/resolve/${encodeURIComponent(domainName)}`);
  }

  /**
   * Register a new Web4 domain with content
   * @param request - Domain registration request with owner, content, signature, fee
   * @returns Registration response with domain details and transaction hash
   */
  async registerWeb4Domain(request: Web4RegisterRequest): Promise<Web4RegisterResponse> {
    return this.request<Web4RegisterResponse>('/api/v1/web4/domains/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  }

  /**
   * Resolve Web4 domain to owner and registration details
   * @param domain - Domain name (e.g., "example.zhtp")
   * @returns Domain resolution with owner DID and registration timestamps
   */
  async resolveWeb4Domain(domain: string): Promise<Web4ResolveResponse> {
    return this.request<Web4ResolveResponse>(`/api/v1/web4/resolve/${encodeURIComponent(domain)}`);
  }

  /**
   * Get full Web4 domain information including content mappings
   * @param domain - Domain name (e.g., "example.zhtp")
   * @returns Complete domain record with content hashes
   */
  async getWeb4Domain(domain: string): Promise<Web4DomainLookupResponse> {
    return this.request<Web4DomainLookupResponse>(`/api/v1/web4/domains/${encodeURIComponent(domain)}`);
  }

  /**
   * Resolve Web4 domain via DHT network
   * @param domain - Domain name (e.g., "example.zhtp")
   */
  async resolveWeb4ViaDht(domain: string): Promise<DApp> {
    return this.request<DApp>(`/api/v1/dht/web4/resolve/${encodeURIComponent(domain)}`);
  }

  /**
   * Get contract from DHT distributed storage
   * @param contractId - Contract identifier
   */
  async getContractFromDht(contractId: string): Promise<SmartContract> {
    return this.request<SmartContract>(`/api/v1/dht/contract/${contractId}`);
  }

  // ==================== Blockchain Operations ====================

  async getBlockchainInfo(): Promise<any> {
    return this.request<any>('/api/v1/blockchain/status');
  }

  async getNodeStatus(): Promise<NodeStatus> {
    return this.request<NodeStatus>('/api/v1/protocol/info');
  }

  /**
   * @deprecated Use getNetworkPeers() instead
   */
  async getMeshPeers(): Promise<{ peers: string[]; count: number }> {
    const response = await this.getNetworkPeers();
    return {
      peers: response.peers.map(p => p.peer_id),
      count: response.peer_count,
    };
  }

  // ==================== Smart Contract Operations ====================

  async deployContract(
    contractData: SmartContract,
    options?: Record<string, any>
  ): Promise<ContractDeploymentResult> {
    return this.request<ContractDeploymentResult>('/api/v1/blockchain/contracts/deploy', {
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
    return this.request<ContractExecutionResult>(`/api/v1/blockchain/contracts/${contractId}/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ functionName, args }),
    });
  }

  async queryContract(
    contractId: string,
    functionName?: string,
    args?: any[]
  ): Promise<Record<string, any>> {
    return this.request<Record<string, any>>(`/api/v1/blockchain/contracts/${contractId}/state`, {
      method: 'GET',
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

  /**
   * Generate a zero-knowledge proof for privacy-preserving credential verification
   *
   * Supported proof types:
   * - age_over_18: Prove age >= 18 without revealing exact age
   * - age_range: Prove age in range (18-25, 26-40, 41-65, 66+) without revealing exact age
   * - citizenship_verified: Prove verified citizen status without revealing identity
   * - jurisdiction_membership: Prove membership in jurisdiction without revealing personal data
   *
   * @param request - Proof generation request with identity_id, proof_type, and credential_data
   * @param sessionToken - Session token for authentication
   * @returns Generated proof data with 24-hour expiration
   *
   * @example
   * const proof = await client.generateZkProof({
   *   identity_id: myIdentity.id,
   *   proof_type: "age_over_18",
   *   credential_data: { age: 25 }
   * }, sessionToken);
   */
  async generateZkProof(request: GenerateProofRequest, sessionToken: string): Promise<ProofData> {
    const response = await this.request<GenerateProofResponse>('/api/v1/zkp/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify(request),
    });
    return response.proof;
  }

  /**
   * Verify a zero-knowledge proof
   *
   * Validates that a proof is cryptographically sound and has not expired.
   * Does NOT reveal the underlying credential values.
   *
   * @param proof - Proof data to verify
   * @returns Verification result with validity status and claim type
   *
   * @example
   * const verification = await client.verifyZkProof(proof);
   * if (verification.valid) {
   *   console.log(`Verified claim: ${verification.claim}`);
   * }
   */
  async verifyZkProof(proof: ProofData): Promise<VerifyProofResponse> {
    return this.request<VerifyProofResponse>('/api/v1/zkp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proof }),
    });
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

  /**
   * Get protocol information including version, node ID, and supported features
   * @returns Protocol information with capabilities and uptime
   */
  async getProtocolInfo(): Promise<ProtocolInfoResponse> {
    return this.request<ProtocolInfoResponse>('/api/v1/protocol/info');
  }

  /**
   * Get health check status for the node
   * @returns Health status with checks for server, handlers, and memory
   */
  async getProtocolHealth(): Promise<HealthCheckResponse> {
    return this.request<HealthCheckResponse>('/api/v1/protocol/health');
  }

  /**
   * Get version information for server, protocol, and API
   * @returns Version details including build information
   */
  async getProtocolVersion(): Promise<VersionResponse> {
    return this.request<VersionResponse>('/api/v1/protocol/version');
  }

  /**
   * Get list of protocol capabilities and extensions
   * @returns Available capabilities with enabled status and descriptions
   */
  async getProtocolCapabilities(): Promise<CapabilitiesResponse> {
    return this.request<CapabilitiesResponse>('/api/v1/protocol/capabilities');
  }

  /**
   * Get protocol statistics including request counts and bandwidth
   * @returns Protocol metrics with request handling and performance stats
   */
  async getProtocolStats(): Promise<ProtocolStatsResponse> {
    return this.request<ProtocolStatsResponse>('/api/v1/protocol/stats');
  }
}
