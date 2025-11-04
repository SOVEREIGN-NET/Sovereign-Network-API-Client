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
    wallets?: Wallet[];
    votingPower?: number;
    ubiEarned?: number;
}
export interface Wallet {
    id: string;
    name: string;
    balance: number;
    address: string;
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
    uptime: number;
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
//# sourceMappingURL=types.d.ts.map