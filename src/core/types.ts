/**
 * Shared types for all platforms
 */

export interface Identity {
  did: string;
  displayName: string;
  username?: string;
  identityType: 'citizen' | 'organization' | 'developer' | 'validator';
  avatar?: string;
  createdAt: string;
  citizenship?: boolean;
  publicKey?: string;
  biometricHash?: string;
  wallets?: {
    primary: WalletInfo;
    ubi: WalletInfo;
    savings: WalletInfo;
  };
  daoMembership?: {
    votingPower: number;
    soulboundNftIssued: boolean;
  };
  seedPhrases?: {
    primary: string[];
    ubi: string[];
    savings: string[];
  };
  votingPower?: number;
  ubiEarned?: number;
}

export interface Wallet {
  id: string;
  name: string;
  balance: number;
  address: string;
}

export interface WalletInfo {
  id: string;
  wallet_type: string;
  name: string;
  balance: number;
  staked_balance: number;
  pending_rewards: number;
}

export interface NetworkStatus {
  peers: number;
  meshConnected: boolean;
  latency: number;
  version: string;
  quantumResistant: boolean;
}

export interface DaoProposal {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'passed' | 'rejected' | 'executed';
  votesFor: number;
  votesAgainst: number;
  creator: string;
  createdAt: string;
  deadline: string;
}

export interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: string;
  blockNumber?: number;
  hash?: string;
}

export interface DaoStats {
  totalProposals: number;
  activeProposals: number;
  treasury: number;
  delegates: number;
  participationRate: number;
}

export interface ApiConfig {
  zhtpNodeUrl: string;
  networkType: 'testnet' | 'mainnet';
  debugMode: boolean;
  enableBiometrics: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Extended types for full API support

export interface IdentityRecoveryData {
  method: 'seed' | 'backup' | 'social' | 'guardians';
  data: string | Record<string, any>;
}

export interface Delegate {
  id: string;
  name: string;
  votingPower: number;
  delegators: number;
  activeProposals: number;
  reputation: number;
}

export interface ProposalDetails {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'passed' | 'rejected' | 'executed';
  votesFor: number;
  votesAgainst: number;
  creator: string;
  createdAt: string;
  deadline: string;
  executionData?: Record<string, any>;
  discussionUrl?: string;
}

export interface TreasuryRecord {
  id: string;
  from: string;
  to: string;
  amount: number;
  reason: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'executed';
}

export interface DApp {
  domain: string;
  owner: string;
  contentHash: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface SmartContract {
  id: string;
  name: string;
  version: string;
  author?: string;
  description?: string;
  bytecode?: string;
  abi?: any[];
  deployedAt?: string;
  ownerDid?: string;
  permissions?: ContractPermissions;
}

export interface ContractPermissions {
  executePolicy: 'Public' | 'Authenticated' | 'OwnerOnly';
  queryPolicy: 'Public' | 'Authenticated' | 'OwnerOnly';
  upgradePolicy: 'Public' | 'Authenticated' | 'OwnerOnly';
}

export interface ContractDeploymentResult {
  contractId: string;
  transactionHash: string;
  blockNumber: number;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface ContractExecutionResult {
  success: boolean;
  output?: any;
  gasUsed?: number;
  error?: string;
}

export interface Asset {
  id: string;
  name: string;
  symbol: string;
  balance: number;
  decimals: number;
  contractAddress?: string;
}

export interface NodeStatus {
  isOnline: boolean;
  version: string;
  peersConnected: number;
  blockHeight: number;
  syncStatus: 'synced' | 'syncing' | 'stalled';
  uptime: number; // in seconds
}

export interface GasInfo {
  baseGasPrice: number;
  priorityFee: number;
  maxGasPrice: number;
  estimatedGasByOperation?: Record<string, number>;
}

export interface Proof {
  type: string;
  data: string;
  timestamp: string;
  signature?: string;
}

// ==================== Signup/Login Types ====================

export interface SignupRequest {
  display_name: string;
  identity_type?: string;
  recovery_options?: string[];
  password: string;
}

export interface LoginRequest {
  identity_id: string;
  password: string;
}

export interface SignupResponse {
  status: string;
  identity_id: string;
  identity_type: string;
  access_level: string;
  created_at: number;
  citizenship_result?: CitizenshipResult;
}

// ==================== Client-Side Identity Registration (iOS/Mobile) ====================

/**
 * Request for registering an identity with client-generated keys.
 * Used by iOS/Android where private keys stay on device.
 * Calls POST /api/v1/identity/register
 */
export interface RegisterIdentityRequest {
  /** Decentralized Identifier: "did:zhtp:{64-char-hex}" */
  did: string;

  /** Base64-encoded Dilithium5 public key (~2592 bytes) */
  public_key: string;

  /** Base64-encoded Kyber1024 public key (~1568 bytes) - optional for PQC */
  kyber_public_key?: string;

  /** Base64-encoded node ID: Blake3(did || device_id) - 32 bytes */
  node_id: string;

  /** Device identifier (e.g., "5A63A821-595A-4A71-88FB-3A5448D2A8B6") */
  device_id: string;

  /** Optional display name */
  display_name?: string;

  /** Identity type: "human", "device", or "organization" (default: "human") */
  identity_type?: string;

  /**
   * Base64-encoded signature proving ownership of private key.
   * Signs the message: "ZHTP_REGISTER:{did}:{timestamp}"
   */
  registration_proof: string;

  /** Unix timestamp in seconds when signature was created (must be within 300s of server time) */
  timestamp: number;
}

/**
 * Response from client-side identity registration.
 * Use identity_id for keystore path: Documents/keystore/{identity_id}/
 */
export interface RegisterIdentityResponse {
  /** Always "registered" on success */
  status: 'registered';

  /** 64-character hex string - USE THIS for keystore path */
  identity_id: string;

  /** Full DID: "did:zhtp:{identity_id}" */
  did: string;

  /** Device identifier echoed back */
  device_id: string;

  /** Identity type: "human", "device", or "organization" */
  identity_type: string;

  /** Blockchain transaction hash, or null if blockchain registration failed (non-fatal) */
  blockchain_tx: string | null;

  /** Welcome bonus amount (5000 for humans, 0 for others) */
  welcome_bonus: number;

  /** Unix timestamp when registered */
  registered_at: number;

  /** True if kyber_public_key was provided */
  pqc_enabled: boolean;
}

export interface LoginResponse {
  status: string;
  identity_id: string;
  display_name: string;
  identity_type: string;
  access_level: string;
  wallets: {
    primary: WalletInfo;
    ubi: WalletInfo;
    savings: WalletInfo;
  };
}

export interface CitizenshipResult {
  identity_id: string;
  primary_wallet_id: string;
  ubi_wallet_id: string;
  savings_wallet_id: string;
  wallet_seed_phrases: {
    primary_wallet_seeds: { words: string[] };
    ubi_wallet_seeds: { words: string[] };
    savings_wallet_seeds: { words: string[] };
  };
  dao_registration: {
    voting_power: number;
    soulbound_nft_issued: boolean;
    registered_at: number;
  };
  ubi_registration: {
    ubi_wallet_id: string;
    ubi_enabled: boolean;
  };
  web4_access: {
    web4_enabled: boolean;
  };
  welcome_bonus: {
    bonus_amount: number;
  };
}

// ==================== Backup & Recovery Types ====================

export interface BackupData {
  backup_data: string;
  created_at: number;
}

export interface BackupVerification {
  valid: boolean;
  version: string;
  created_at: number;
  identity_id?: string;
  errors: string[];
  warnings: string[];
}

export interface ImportBackupResponse {
  status: string;
  identity: {
    identity_id: string;
    did: string;
  };
  session_token: string;
}

export interface SeedVerification {
  verified: boolean;
}

export interface SeedPhrases {
  primary?: string[];
  ubi?: string[];
  savings?: string[];
  master?: string[];
}

export interface BackupStatus {
  has_recovery_phrase: boolean;
  backup_date: number | null;
  verified: boolean;
}

// ==================== Guardian Types ====================

export interface Guardian {
  guardian_id: string;
  guardian_did: string;
  name: string;
  added_at: number;
  status: string; // 'Active' | 'Pending' | 'Revoked'
}

export interface GuardianResponse {
  status: string;
  guardian_id: string;
  total_guardians: number;
}

export interface RecoverySession {
  status: string;
  recovery_id: string;
  guardians_required: number;
  guardians_approved: number;
  expires_at: number;
}

export interface RecoveryStatus {
  recovery_id: string;
  status: string;
  approvals: number;
  required: number;
  expires_at: number;
  identity_did: string;
}

// ==================== Zero-Knowledge Proof Types ====================

export type ProofType = 'age_over_18' | 'age_range' | 'citizenship_verified' | 'jurisdiction_membership';

export interface CredentialData {
  age?: number;
  jurisdiction?: string;
  is_verified_citizen?: boolean;
}

export interface GenerateProofRequest {
  identity_id: string;
  proof_type: ProofType;
  credential_data: CredentialData;
}

export interface ProofData {
  proof_data: string; // Base64-encoded ZK proof
  public_inputs: string[]; // Opaque commitments (no plaintext)
  proof_type: ProofType;
  generated_at: number;
  valid_until: number; // Expires after 24 hours
}

export interface GenerateProofResponse {
  status: string;
  proof: ProofData;
  valid_until: number;
}

export interface VerifyProofRequest {
  proof: ProofData;
}

export interface VerifyProofResponse {
  status: string;
  valid: boolean;
  claim: ProofType;
  verified_at: number;
}

// ==================== Wallet Types ====================

export interface WalletPermissions {
  can_transfer_external: boolean;
  can_vote: boolean;
  can_stake: boolean;
  can_receive_rewards: boolean;
  daily_transaction_limit: number;
  requires_multisig_threshold: number | null;
}

export interface DetailedWalletInfo {
  wallet_type: string;
  wallet_id: string;
  available_balance: number;
  staked_balance: number;
  pending_rewards: number;
  total_balance: number;
  permissions: WalletPermissions;
  created_at: number;
  description: string;
}

export interface WalletListResponse {
  status: string;
  identity_id: string;
  total_wallets: number;
  total_balance: number;
  wallets: DetailedWalletInfo[];
}

export interface WalletBalanceResponse {
  status: string;
  wallet_type: string;
  identity_id: string;
  balance: {
    available_balance: number;
    staked_balance: number;
    pending_rewards: number;
    total_balance: number;
  };
  permissions: WalletPermissions;
  created_at: number;
}

export interface SimpleSendRequest {
  from_identity: string;
  to_address: string;
  amount: number;
  memo?: string;
}

export interface CrossWalletTransferRequest {
  identity_id: string;
  from_wallet: string;
  to_wallet: string;
  amount: number;
  purpose?: string;
}

export interface StakingRequest {
  identity_id: string;
  amount: number;
}

export interface TransactionRecord {
  tx_hash: string;
  tx_type: string;
  amount: number;
  fee: number;
  from_wallet: string | null;
  to_address: string | null;
  timestamp: number;
  block_height: number | null;
  status: string; // "confirmed" | "pending" | "failed"
  memo: string | null;
}

export interface TransactionHistoryResponse {
  identity_id: string;
  total_transactions: number;
  transactions: TransactionRecord[];
}

// ==================== Network & Protocol Types ====================

export interface PeerInfo {
  peer_id: string;
  peer_type: string;
  status: string;
  connection_time: number | null;
}

export interface NetworkPeersResponse {
  status: string;
  peer_count: number;
  peers: PeerInfo[];
}

export interface AddPeerRequest {
  peer_address: string;
  peer_type?: string;
}

export interface AddPeerResponse {
  status: string;
  peer_id: string;
  message: string;
  connected: boolean;
}

export interface MeshStatusInfo {
  internet_connected: boolean;
  mesh_connected: boolean;
  connectivity_percentage: number;
  coverage: number;
  stability: number;
}

export interface TrafficStats {
  bytes_sent: number;
  bytes_received: number;
  packets_sent: number;
  packets_received: number;
  connection_count: number;
}

export interface PeerDistribution {
  active_peers: number;
  local_peers: number;
  regional_peers: number;
  global_peers: number;
  relay_peers: number;
}

export interface NetworkStatsResponse {
  status: string;
  mesh_status: MeshStatusInfo;
  traffic_stats: TrafficStats;
  peer_distribution: PeerDistribution;
}

export interface GasInfoResponse {
  status: string;
  gas_price: number;
  estimated_cost: number;
  base_fee: number;
  priority_fee: number;
}

export interface ProtocolInfoResponse {
  status: string;
  protocol: string;
  version: string;
  node_id: string;
  uptime: number;
  supported_methods: string[];
  supported_features: string[];
}

export interface HealthCheck {
  name: string;
  status: string;
  message: string;
}

export interface HealthCheckResponse {
  status: string;
  healthy: boolean;
  uptime: number;
  timestamp: number;
  checks: HealthCheck[];
}

export interface BuildInfo {
  commit: string;
  build_date: string;
  rust_version: string;
}

export interface VersionResponse {
  status: string;
  server_version: string;
  protocol_version: string;
  api_version: string;
  build_info: BuildInfo;
}

export interface Capability {
  name: string;
  version: string;
  description: string;
  enabled: boolean;
}

export interface CapabilitiesResponse {
  status: string;
  capabilities: Capability[];
  extensions: string[];
}

export interface ProtocolStatsResponse {
  status: string;
  requests_handled: number;
  active_connections: number;
  total_bytes_sent: number;
  total_bytes_received: number;
  average_response_time: number;
  error_rate: number;
}

// ==================== Web4 Domain Types ====================

export interface ContentMapping {
  content: string; // Base64-encoded content
  content_type: string;
}

export interface Web4RegisterRequest {
  domain: string;
  owner: string; // DID format (did:zhtp:hex) or raw hex identity hash
  content_mappings: Record<string, ContentMapping>;
  metadata?: Record<string, any>;
  signature: string; // Hex-encoded signature
  timestamp: number; // Unix seconds
  fee?: number; // ZHTP tokens
}

export interface Web4RegisterResponse {
  success: boolean;
  domain: string;
  owner: string;
  content_mappings: Record<string, string>; // path -> content hash
  fees_charged: number;
  registered_at: number;
  message: string;
  blockchain_transaction?: string;
  contract_deployed?: boolean;
}

export interface Web4ResolveResponse {
  status: string;
  domain: string;
  owner: string;
  registered_at: number;
  expires_at: number;
  note?: string;
}

export interface Web4DomainRecord {
  domain: string;
  owner: string;
  registered_at: number;
  expires_at: number;
  content_mappings: Record<string, string>;
}

export interface Web4DomainLookupResponse {
  found: boolean;
  record?: Web4DomainRecord;
  content_mappings: Record<string, string>;
}
