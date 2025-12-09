/**
 * ZHTP API Methods
 * All API method implementations for various operations
 */
import { ZhtpApiCore } from './zhtp-api-core';
import { Identity, Wallet, NetworkStatus, DaoProposal, DaoStats, Transaction, Delegate, ProposalDetails, TreasuryRecord, DApp, SmartContract, ContractDeploymentResult, ContractExecutionResult, Asset, NodeStatus, SignupRequest, LoginRequest, BackupData, BackupVerification, BackupStatus, ImportBackupResponse, SeedVerification, SeedPhrases, Guardian, GuardianResponse, RecoverySession, RecoveryStatus, CitizenshipResult, ProofData, GenerateProofRequest, VerifyProofResponse, WalletListResponse, WalletBalanceResponse, SimpleSendRequest, CrossWalletTransferRequest, TransactionHistoryResponse, NetworkPeersResponse, NetworkStatsResponse, GasInfoResponse, AddPeerRequest, AddPeerResponse, ProtocolInfoResponse, HealthCheckResponse, VersionResponse, CapabilitiesResponse, ProtocolStatsResponse, Web4RegisterRequest, Web4RegisterResponse, Web4ResolveResponse, Web4DomainLookupResponse } from './types';
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
    recoverIdentity(recoveryPhrase: string): Promise<{
        status: string;
        identity: {
            identity_id: string;
            did: string;
        };
        session_token: string;
    }>;
    /**
     * @deprecated Use recoverIdentity() with recovery phrase instead
     */
    recoverIdentityFromSeed(recoveryData: Record<string, any>): Promise<any>;
    /**
     * @deprecated Use importBackup() instead
     */
    restoreIdentityFromBackup(backupData: Record<string, any>): Promise<Identity>;
    /**
     * @deprecated Guardian recovery endpoints not yet implemented in node
     */
    recoverIdentityWithGuardians(guardianData: Record<string, any>): Promise<Identity>;
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
    generateRecoveryPhrase(identityId: string, sessionToken: string): Promise<{
        status: string;
        phrase_hash: string;
        recovery_phrase: string;
        instructions: string;
    }>;
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
    verifyRecoveryPhrase(identityId: string, recoveryPhrase: string): Promise<{
        status: string;
        verified: boolean;
    }>;
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
    resetPassword(identityId: string, recoveryPhrase: string, newPassword: string): Promise<{
        status: string;
        message: string;
    }>;
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
    /**
     * @deprecated This endpoint is not available in the node API
     */
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
    /**
     * @deprecated ZK DID endpoints not yet implemented in the node
     */
    createZkDid(didData?: Record<string, any>): Promise<any>;
    /**
     * Get identity information by ID
     *
     * @param identityId - Identity ID (hex format) or DID
     * @returns Identity information including type, access level, and timestamps
     * @throws Error if identity not found
     */
    getIdentity(identityId: string): Promise<{
        status: string;
        identity_id: string;
        identity_type: string;
        access_level: string;
        created_at: number;
        last_active: number;
    }>;
    /**
     * @deprecated This endpoint is not available in the node API
     */
    verifyIdentity(did: string, requirements?: Record<string, any>): Promise<boolean>;
    /**
     * @deprecated This endpoint is not available in the node API
     */
    checkIdentityExists(identifier: string): Promise<boolean>;
    /**
     * @deprecated This endpoint is not available in the node API. Use signIn() or login() instead.
     */
    signInWithIdentity(identity: Identity, passphrase: string): Promise<{
        token: string;
        identity: Identity;
    }>;
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
    signMessage(identityId: string, message: string): Promise<{
        success: boolean;
        identity_id: string;
        message: string;
        signature: string;
        signature_algorithm: string;
        public_key: string;
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
     * Register a new Web4 domain with content
     * @param request - Domain registration request with owner, content, signature, fee
     * @returns Registration response with domain details and transaction hash
     */
    registerWeb4Domain(request: Web4RegisterRequest): Promise<Web4RegisterResponse>;
    /**
     * Resolve Web4 domain to owner and registration details
     * @param domain - Domain name (e.g., "example.zhtp")
     * @returns Domain resolution with owner DID and registration timestamps
     */
    resolveWeb4Domain(domain: string): Promise<Web4ResolveResponse>;
    /**
     * Get full Web4 domain information including content mappings
     * @param domain - Domain name (e.g., "example.zhtp")
     * @returns Complete domain record with content hashes
     */
    getWeb4Domain(domain: string): Promise<Web4DomainLookupResponse>;
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
    /**
     * Get protocol information including version, node ID, and supported features
     * @returns Protocol information with capabilities and uptime
     */
    getProtocolInfo(): Promise<ProtocolInfoResponse>;
    /**
     * Get health check status for the node
     * @returns Health status with checks for server, handlers, and memory
     */
    getProtocolHealth(): Promise<HealthCheckResponse>;
    /**
     * Get version information for server, protocol, and API
     * @returns Version details including build information
     */
    getProtocolVersion(): Promise<VersionResponse>;
    /**
     * Get list of protocol capabilities and extensions
     * @returns Available capabilities with enabled status and descriptions
     */
    getProtocolCapabilities(): Promise<CapabilitiesResponse>;
    /**
     * Get protocol statistics including request counts and bandwidth
     * @returns Protocol metrics with request handling and performance stats
     */
    getProtocolStats(): Promise<ProtocolStatsResponse>;
}
//# sourceMappingURL=zhtp-api-methods.d.ts.map