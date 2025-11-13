/**
 * ZHTP API Methods
 * All API method implementations for various operations
 */
import { ZhtpApiCore } from './zhtp-api-core';
import { Identity, Wallet, NetworkStatus, DaoProposal, DaoStats, Transaction, Delegate, ProposalDetails, TreasuryRecord, DApp, SmartContract, ContractDeploymentResult, ContractExecutionResult, Asset, NodeStatus, Proof, SignupRequest, LoginRequest, BackupData, BackupVerification, SeedVerification, SeedPhrases, Guardian, GuardianResponse, RecoverySession, RecoveryStatus, CitizenshipResult } from './types';
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
    exportBackup(identityId: string, password: string): Promise<BackupData>;
    importBackup(backupData: string, password: string): Promise<Identity>;
    verifyBackup(backupData: string): Promise<BackupVerification>;
    verifySeedPhrase(identityId: string, seedPhrase: string): Promise<SeedVerification>;
    exportSeedPhrases(identityId: string): Promise<SeedPhrases>;
    addGuardian(identityId: string, guardianId: string, guardianInfo?: Record<string, any>): Promise<GuardianResponse>;
    listGuardians(identityId: string): Promise<Guardian[]>;
    removeGuardian(identityId: string, guardianId: string): Promise<void>;
    acceptGuardianInvite(guardianId: string, identityId: string): Promise<void>;
    declineGuardianInvite(guardianId: string, identityId: string): Promise<void>;
    initiateRecovery(identityId: string, guardianIds: string[]): Promise<RecoverySession>;
    approveRecovery(guardianId: string, recoveryId: string, approval: boolean): Promise<void>;
    getRecoveryStatus(recoveryId: string): Promise<RecoveryStatus>;
    cancelRecovery(recoveryId: string): Promise<void>;
    applyCitizenship(identityId: string, applicationData?: Record<string, any>): Promise<CitizenshipResult>;
    createZkDid(didData?: Record<string, any>): Promise<any>;
    getIdentity(did: string): Promise<Identity>;
    verifyIdentity(did: string, requirements?: Record<string, any>): Promise<boolean>;
    checkIdentityExists(identifier: string): Promise<boolean>;
    signInWithIdentity(identity: Identity, passphrase: string): Promise<{
        token: string;
        identity: Identity;
    }>;
    getNetworkInfo(): Promise<NetworkStatus>;
    getWallets(did: string): Promise<Wallet[]>;
    getWalletBalance(did: string): Promise<number>;
    getTransactionHistory(address: string, walletType?: string): Promise<Transaction[]>;
    getAssets(address: string): Promise<Asset[]>;
    sendTransaction(from: string, to: string, amount: number, metadata?: Record<string, any>): Promise<Transaction>;
    getDaoProposals(): Promise<DaoProposal[]>;
    getDaoStats(): Promise<DaoStats>;
    createProposal(proposal: any): Promise<DaoProposal>;
    submitVote(proposalId: string, vote: boolean, voterDid: string): Promise<void>;
    getDaoTreasury(): Promise<number>;
    getProposalDetails(proposalId: string): Promise<ProposalDetails>;
    getDaoData(): Promise<Record<string, any>>;
    getDaoDelegates(): Promise<Delegate[]>;
    getDelegateProfile(delegateId: string): Promise<Delegate>;
    registerDelegate(userDid: string, delegateInfo: Record<string, any>): Promise<Delegate>;
    revokeDelegation(userDid: string): Promise<void>;
    getTreasuryHistory(): Promise<TreasuryRecord[]>;
    createSpendingProposal(proposalData: Record<string, any>): Promise<DaoProposal>;
    getVotingPower(userDid: string): Promise<number>;
    getUserVotes(userDid: string): Promise<Array<{
        proposalId: string;
        vote: boolean;
    }>>;
    resolveDapp(domain: string): Promise<any>;
    loadWeb4Resource(url: string): Promise<Record<string, any>>;
    getContractContent(contractId: string, path?: string): Promise<any>;
    getContractByHash(hash: string): Promise<any>;
    getContractById(contractId: string): Promise<SmartContract>;
    resolveDomain(domainName: string): Promise<DApp>;
    getBlockchainInfo(): Promise<any>;
    getGasInfo(): Promise<any>;
    getNodeStatus(): Promise<NodeStatus>;
    getMeshPeers(): Promise<{
        peers: string[];
        count: number;
    }>;
    getNetworkStats(): Promise<{
        blockchain: Record<string, any>;
        gas: Record<string, any>;
        mesh: Record<string, any>;
        timestamp: string;
    }>;
    deployContract(contractData: SmartContract, options?: Record<string, any>): Promise<ContractDeploymentResult>;
    executeContract(contractId: string, functionName: string, args?: any[]): Promise<ContractExecutionResult>;
    queryContract(contractId: string, functionName?: string, args?: any[]): Promise<Record<string, any>>;
    getContractMetadata(contractId: string): Promise<SmartContract>;
    upgradeContract(contractId: string, newBytecode: string, metadata?: Record<string, any>): Promise<ContractDeploymentResult>;
    generateZkProof(data: Record<string, any>): Promise<Proof>;
    verifyZkProof(proof: Proof): Promise<boolean>;
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