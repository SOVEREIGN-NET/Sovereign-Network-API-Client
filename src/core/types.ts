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
