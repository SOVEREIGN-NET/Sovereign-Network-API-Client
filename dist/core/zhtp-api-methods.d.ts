/**
 * ZHTP API Methods
 * All API method implementations for various operations
 */
import { ZhtpApiCore } from './zhtp-api-core';
import { Identity, Wallet, NetworkStatus, DaoProposal, DaoStats, Transaction, Delegate, ProposalDetails, TreasuryRecord, DApp, SmartContract, ContractDeploymentResult, ContractExecutionResult, Asset, NodeStatus, SignupRequest, LoginRequest, BackupData, BackupVerification, BackupStatus, ImportBackupResponse, SeedVerification, SeedPhrases, Guardian, GuardianResponse, RecoverySession, RecoveryStatus, CitizenshipResult, ProofData, GenerateProofRequest, VerifyProofResponse, WalletListResponse, WalletBalanceResponse, SimpleSendRequest, CrossWalletTransferRequest, TransactionHistoryResponse, NetworkPeersResponse, NetworkStatsResponse, GasInfoResponse, AddPeerRequest, AddPeerResponse } from './types';
export declare abstract class ZhtpApiMethods extends ZhtpApiCore {
    signIn(did: string, passphrase: string): Promise<Identity>;
    createIdentity(data: any): Promise<Identity>;
    /**
     * Sign up a new citizen identity with 3 wallets, DAO membership, and welcome bonus
     */
    signup(request: SignupRequest): Promise<Identity>;
    /**
     * Login with existing identity
     */
    login(request: LoginRequest): Promise<Identity>;
    /**
     * Map signup response from backend to Identity interface
     */
    private mapSignupResponseToIdentity;
    /**
     * Map login response from backend to Identity interface
     */
    private mapLoginResponseToIdentity;
    recoverIdentity(method: 'seed' | 'backup' | 'social', data: string): Promise<Identity>;
    recoverIdentityFromSeed(recoveryData: Record<string, any>): Promise<Identity>;
    restoreIdentityFromBackup(backupData: Record<string, any>): Promise<Identity>;
    recoverIdentityWithGuardians(guardianData: Record<string, any>): Promise<Identity>;
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
    exportBackup(identityId: string, passphrase: string): Promise<BackupData>;
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
    importBackup(backupData: string, passphrase: string): Promise<ImportBackupResponse>;
    verifyBackup(backupData: string): Promise<BackupVerification>;
    /**
     * Get backup status for an identity
     *
     * @param identityId - Identity ID to check
     * @returns Backup status including recovery phrase existence and verification state
     */
    getBackupStatus(identityId: string): Promise<BackupStatus>;
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
    verifySeedPhrase(identityId: string, seedPhrase: string): Promise<SeedVerification>;
    exportSeedPhrases(identityId: string): Promise<SeedPhrases>;
    addGuardian(identityId: string, sessionToken: string, guardianDid: string, guardianPublicKey: number[], guardianName: string): Promise<GuardianResponse>;
    listGuardians(sessionToken: string): Promise<{
        guardians: Guardian[];
        threshold: number;
    }>;
    removeGuardian(guardianId: string, sessionToken: string): Promise<void>;
    initiateRecovery(identityDid: string, requesterDevice: string): Promise<RecoverySession>;
    approveRecovery(recoveryId: string, guardianDid: string, sessionToken: string, signature: number[]): Promise<{
        status: string;
        approvals: number;
        required: number;
    }>;
    rejectRecovery(recoveryId: string, guardianDid: string, sessionToken: string, signature: number[]): Promise<void>;
    completeRecovery(recoveryId: string): Promise<{
        status: string;
        session_token: string;
        identity_did: string;
    }>;
    getRecoveryStatus(recoveryId: string): Promise<RecoveryStatus>;
    getPendingRecoveries(sessionToken: string): Promise<{
        pending_requests: Array<{
            recovery_id: string;
            identity_did: string;
            initiated_at: number;
            expires_at: number;
        }>;
    }>;
    applyCitizenship(identityId: string, applicationData?: Record<string, any>): Promise<CitizenshipResult>;
    createZkDid(didData?: Record<string, any>): Promise<any>;
    getIdentity(did: string): Promise<Identity>;
    verifyIdentity(did: string, requirements?: Record<string, any>): Promise<boolean>;
    checkIdentityExists(identifier: string): Promise<boolean>;
    signInWithIdentity(identity: Identity, passphrase: string): Promise<{
        token: string;
        identity: Identity;
    }>;
    /**
     * Get list of connected network peers
     * @returns Peer information including peer IDs, types, and connection status
     */
    getNetworkPeers(): Promise<NetworkPeersResponse>;
    /**
     * Get comprehensive network statistics including mesh status and traffic
     * @returns Network stats with mesh status, traffic, and peer distribution
     */
    getNetworkStats(): Promise<NetworkStatsResponse>;
    /**
     * Get current gas pricing information for transaction cost estimation
     * @returns Gas prices including base fee, priority fee, and estimated costs
     */
    getGasInfo(): Promise<GasInfoResponse>;
    /**
     * Add a peer to the network by address
     * @param request - Peer address and optional peer type
     * @returns Connection result with peer ID and status
     */
    addNetworkPeer(request: AddPeerRequest): Promise<AddPeerResponse>;
    /**
     * Remove a peer from the network
     * @param peerId - ID of the peer to remove
     * @returns Removal result with status
     */
    removeNetworkPeer(peerId: string): Promise<any>;
    /**
     * @deprecated Use getNetworkPeers() instead
     */
    getNetworkInfo(): Promise<NetworkStatus>;
    /**
     * List all wallets for an identity
     * @param identityId - Identity ID (hex string)
     * @returns List of all wallets with balances and permissions
     */
    getWalletList(identityId: string): Promise<WalletListResponse>;
    /**
     * Get balance for a specific wallet type
     * @param walletType - Wallet type (Primary, UBI, Savings, Staking, etc.)
     * @param identityId - Identity ID (hex string)
     * @returns Detailed balance information for the wallet
     */
    getWalletBalance(walletType: string, identityId: string): Promise<WalletBalanceResponse>;
    /**
     * Get comprehensive wallet statistics for an identity
     * @param identityId - Identity ID (hex string)
     * @returns Wallet statistics
     */
    getWalletStatistics(identityId: string): Promise<any>;
    /**
     * Get transaction history for an identity
     * @param identityId - Identity ID (hex string)
     * @returns Transaction history
     */
    getWalletTransactionHistory(identityId: string): Promise<TransactionHistoryResponse>;
    /**
     * Send a simple payment from primary wallet
     * @param request - Send request with from_identity, to_address, amount, memo
     * @returns Transaction result
     */
    sendWalletPayment(request: SimpleSendRequest): Promise<any>;
    /**
     * Transfer tokens between wallets of the same identity
     * @param request - Transfer request with identity_id, from_wallet, to_wallet, amount, purpose
     * @returns Transfer result with transaction ID
     */
    transferBetweenWallets(request: CrossWalletTransferRequest): Promise<any>;
    /**
     * Stake tokens from Primary wallet to Staking wallet
     * @param identityId - Identity ID (hex string)
     * @param amount - Amount to stake
     * @returns Staking result
     */
    stakeTokens(identityId: string, amount: number): Promise<any>;
    /**
     * Unstake tokens from Staking wallet back to Primary wallet
     * @param identityId - Identity ID (hex string)
     * @param amount - Amount to unstake
     * @returns Unstaking result
     */
    unstakeTokens(identityId: string, amount: number): Promise<any>;
    /**
     * @deprecated Use getWalletList() instead
     */
    getWallets(did: string): Promise<Wallet[]>;
    /**
     * @deprecated Use getWalletTransactionHistory() instead
     */
    getTransactionHistory(address: string, walletType?: string): Promise<Transaction[]>;
    getAssets(address: string): Promise<Asset[]>;
    /**
     * @deprecated Use sendWalletPayment() instead
     */
    sendTransaction(from: string, to: string, amount: number, metadata?: Record<string, any>): Promise<Transaction>;
    getDaoProposals(): Promise<DaoProposal[]>;
    getDaoStats(): Promise<DaoStats>;
    createProposal(proposal: any): Promise<DaoProposal>;
    submitVote(voterIdentityId: string, proposalId: string, voteChoice: 'yes' | 'no' | 'abstain', justification?: string): Promise<void>;
    getDaoTreasury(): Promise<number>;
    getProposalDetails(proposalId: string): Promise<ProposalDetails>;
    getDaoData(): Promise<Record<string, any>>;
    getDaoDelegates(): Promise<Delegate[]>;
    getDelegateProfile(delegateId: string): Promise<Delegate>;
    registerDelegate(userDid: string, delegateInfo: {
        name: string;
        bio: string;
    }): Promise<Delegate>;
    revokeDelegation(userDid: string): Promise<void>;
    getTreasuryHistory(limit?: number, offset?: number): Promise<TreasuryRecord[]>;
    createSpendingProposal(proposalData: Record<string, any>): Promise<DaoProposal>;
    getVotingPower(userDid: string): Promise<number>;
    getUserVotes(userDid: string): Promise<Array<{
        proposalId: string;
        vote: boolean;
    }>>;
    resolveDapp(domain: string): Promise<any>;
    loadWeb4Resource(url: string): Promise<Record<string, any>>;
    getContractContent(contractId: string, path?: string): Promise<any>;
    /**
     * Lookup contract by blockchain transaction hash
     * @param hash - Deployment transaction hash
     */
    getContractByHash(hash: string): Promise<SmartContract>;
    getContractById(contractId: string): Promise<SmartContract>;
    resolveDomain(domainName: string): Promise<DApp>;
    /**
     * Resolve Web4 domain via DHT network
     * @param domain - Domain name (e.g., "example.zhtp")
     */
    resolveWeb4ViaDht(domain: string): Promise<DApp>;
    /**
     * Get contract from DHT distributed storage
     * @param contractId - Contract identifier
     */
    getContractFromDht(contractId: string): Promise<SmartContract>;
    getBlockchainInfo(): Promise<any>;
    getNodeStatus(): Promise<NodeStatus>;
    /**
     * @deprecated Use getNetworkPeers() instead
     */
    getMeshPeers(): Promise<{
        peers: string[];
        count: number;
    }>;
    deployContract(contractData: SmartContract, options?: Record<string, any>): Promise<ContractDeploymentResult>;
    executeContract(contractId: string, functionName: string, args?: any[]): Promise<ContractExecutionResult>;
    queryContract(contractId: string, functionName?: string, args?: any[]): Promise<Record<string, any>>;
    getContractMetadata(contractId: string): Promise<SmartContract>;
    upgradeContract(contractId: string, newBytecode: string, metadata?: Record<string, any>): Promise<ContractDeploymentResult>;
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
    generateZkProof(request: GenerateProofRequest, sessionToken: string): Promise<ProofData>;
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
    verifyZkProof(proof: ProofData): Promise<VerifyProofResponse>;
    testConnection(): Promise<boolean>;
    getProtocolInfo(): Promise<{
        success: boolean;
        protocol: string;
        version: any;
        features: {
            quantum_resistant: any;
            zk_privacy_enabled: any;
            mesh_networking: any;
            dao_fees_enabled: any;
            pure_tcp: boolean;
        };
        network: {
            id: any;
            consensus: any;
            block_height: any;
            peer_count: any;
            healthy: any;
        };
        node: {
            status: any;
            uptime: any;
            latency: any;
            synced: any;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        protocol: string;
        features: {
            quantum_resistant: boolean;
            zk_privacy_enabled: boolean;
            mesh_networking: boolean;
            dao_fees_enabled: boolean;
            pure_tcp: boolean;
        };
        version?: undefined;
        network?: undefined;
        node?: undefined;
    }>;
}
//# sourceMappingURL=zhtp-api-methods.d.ts.map