/**
 * ZHTP API Methods
 * All API method implementations for various operations
 */
import { ZhtpApiCore } from './zhtp-api-core.js';
export class ZhtpApiMethods extends ZhtpApiCore {
    // ==================== Identity Operations ====================
    async signIn(did, passphrase) {
        return this.request('/api/v1/identity/signin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ did, passphrase }),
        });
    }
    async createIdentity(data) {
        return this.request('/api/v1/identity/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
    }
    /**
     * Sign up a new citizen identity with 3 wallets, DAO membership, and welcome bonus
     */
    async signup(request) {
        const response = await this.request('/api/v1/identity/create', {
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
    async login(request) {
        const response = await this.request('/api/v1/identity/login', {
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
    mapSignupResponseToIdentity(response) {
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
    mapLoginResponseToIdentity(response) {
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
    async recoverIdentity(method, data) {
        const endpoint = `/api/v1/identity/recover/${method}`;
        return this.request(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data }),
        });
    }
    async recoverIdentityFromSeed(recoveryData) {
        return this.request('/api/v1/identity/restore/seed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(recoveryData),
        });
    }
    async restoreIdentityFromBackup(backupData) {
        return this.request('/api/v1/identity/backup/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(backupData),
        });
    }
    async recoverIdentityWithGuardians(guardianData) {
        return this.request('/api/v1/identity/recover/guardians', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(guardianData),
        });
    }
    // ==================== Backup Operations ====================
    async exportBackup(identityId, password) {
        return this.request('/api/v1/identity/backup/export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity_id: identityId, password }),
        });
    }
    async importBackup(backupData, password) {
        return this.request('/api/v1/identity/backup/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ backup_data: backupData, password }),
        });
    }
    async verifyBackup(backupData) {
        return this.request('/api/v1/identity/backup/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ backup_data: backupData }),
        });
    }
    // ==================== Seed Phrase Operations ====================
    async verifySeedPhrase(identityId, seedPhrase) {
        return this.request('/api/v1/identity/seed/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity_id: identityId, seed_phrase: seedPhrase }),
        });
    }
    async exportSeedPhrases(identityId) {
        return this.request(`/api/v1/identity/${identityId}/seeds`);
    }
    // ==================== Guardian Management ====================
    async addGuardian(identityId, guardianId, guardianInfo) {
        return this.request('/api/v1/guardian/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                identity_id: identityId,
                guardian_id: guardianId,
                ...guardianInfo
            }),
        });
    }
    async listGuardians(identityId) {
        return this.request(`/api/v1/guardian/list/${identityId}`);
    }
    async removeGuardian(identityId, guardianId) {
        await this.request('/api/v1/guardian/remove', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity_id: identityId, guardian_id: guardianId }),
        });
    }
    async acceptGuardianInvite(guardianId, identityId) {
        await this.request('/api/v1/guardian/accept', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guardian_id: guardianId, identity_id: identityId }),
        });
    }
    async declineGuardianInvite(guardianId, identityId) {
        await this.request('/api/v1/guardian/decline', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guardian_id: guardianId, identity_id: identityId }),
        });
    }
    // ==================== Guardian Recovery Flow ====================
    async initiateRecovery(identityId, guardianIds) {
        return this.request('/api/v1/guardian/recovery/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity_id: identityId, guardian_ids: guardianIds }),
        });
    }
    async approveRecovery(guardianId, recoveryId, approval) {
        await this.request('/api/v1/guardian/recovery/approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guardian_id: guardianId, recovery_id: recoveryId, approval }),
        });
    }
    async getRecoveryStatus(recoveryId) {
        return this.request(`/api/v1/guardian/recovery/status/${recoveryId}`);
    }
    async cancelRecovery(recoveryId) {
        await this.request('/api/v1/guardian/recovery/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recovery_id: recoveryId }),
        });
    }
    // ==================== Citizenship ====================
    async applyCitizenship(identityId, applicationData) {
        return this.request('/api/v1/identity/citizenship/apply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity_id: identityId, ...applicationData }),
        });
    }
    async createZkDid(didData) {
        return this.request('/api/v1/identity/zkdid/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(didData || {}),
        });
    }
    async getIdentity(did) {
        return this.request(`/api/v1/identity/get/${did}`);
    }
    async verifyIdentity(did, requirements) {
        try {
            const response = await this.request(`/api/v1/identity/verify/${did}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requirements || {}),
            });
            return response.verified || false;
        }
        catch (error) {
            console.warn('⚠️ Failed to verify identity:', error);
            return false;
        }
    }
    async checkIdentityExists(identifier) {
        try {
            const response = await this.request(`/api/v1/identity/exists/${encodeURIComponent(identifier)}`);
            return response.exists || false;
        }
        catch (error) {
            console.warn('⚠️ Failed to check identity existence:', error);
            return false;
        }
    }
    async signInWithIdentity(identity, passphrase) {
        return this.request('/api/v1/identity/signin-with-identity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity, passphrase }),
        });
    }
    // ==================== Network Operations ====================
    async getNetworkInfo() {
        return this.request('/mesh/peers');
    }
    // ==================== Wallet & Transaction Operations ====================
    async getWallets(did) {
        return this.request(`/wallet/balance?address=${encodeURIComponent(did)}`);
    }
    async getWalletBalance(did) {
        const wallets = await this.getWallets(did);
        return wallets.reduce((sum, w) => sum + w.balance, 0);
    }
    async getTransactionHistory(address, walletType) {
        let endpoint = `/wallet/transactions?address=${encodeURIComponent(address)}`;
        if (walletType) {
            endpoint += `&wallet_type=${encodeURIComponent(walletType)}`;
        }
        return this.request(endpoint);
    }
    async getAssets(address) {
        return this.request(`/wallet/assets?address=${encodeURIComponent(address)}`);
    }
    async sendTransaction(from, to, amount, metadata) {
        return this.request('/wallet/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ from, to, amount, metadata }),
        });
    }
    // ==================== DAO Operations ====================
    async getDaoProposals() {
        return this.request('/dao/proposals');
    }
    async getDaoStats() {
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
    async createProposal(proposal) {
        return this.request('/dao/proposals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(proposal),
        });
    }
    async submitVote(proposalId, vote, voterDid) {
        await this.request('/dao/vote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ proposalId, vote, voterDid }),
        });
    }
    async getDaoTreasury() {
        const response = await this.request('/dao/treasury');
        return response?.balance || 0;
    }
    async getProposalDetails(proposalId) {
        return this.request(`/dao/proposals/${proposalId}`);
    }
    async getDaoData() {
        return this.request('/dao/data');
    }
    async getDaoDelegates() {
        return this.request('/dao/delegates');
    }
    async getDelegateProfile(delegateId) {
        return this.request(`/dao/delegates/${delegateId}`);
    }
    async registerDelegate(userDid, delegateInfo) {
        return this.request('/dao/delegates/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userDid, delegateInfo }),
        });
    }
    async revokeDelegation(userDid) {
        await this.request('/dao/delegates/revoke', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userDid }),
        });
    }
    async getTreasuryHistory() {
        return this.request('/dao/treasury/history');
    }
    async createSpendingProposal(proposalData) {
        return this.request('/dao/proposals/spending', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(proposalData),
        });
    }
    async getVotingPower(userDid) {
        try {
            const response = await this.request(`/dao/voting-power/${userDid}`);
            return response.votingPower || 0;
        }
        catch (error) {
            console.warn('⚠️ Failed to get voting power:', error);
            return 0;
        }
    }
    async getUserVotes(userDid) {
        return this.request(`/dao/user-votes/${userDid}`);
    }
    // ==================== Web4/DHT Operations ====================
    async resolveDapp(domain) {
        return this.request(`/api/v1/dht/web4/resolve/${encodeURIComponent(domain)}`);
    }
    async loadWeb4Resource(url) {
        return this.request('/api/v1/web4/load', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
        });
    }
    async getContractContent(contractId, path) {
        let endpoint = `/api/v1/dht/contract/${contractId}`;
        if (path) {
            endpoint += `?path=${encodeURIComponent(path)}`;
        }
        return this.request(endpoint);
    }
    async getContractByHash(hash) {
        return this.request(`/api/v1/blockchain/contract/${hash}`);
    }
    async getContractById(contractId) {
        return this.request(`/api/v1/contract/${contractId}`);
    }
    async resolveDomain(domainName) {
        return this.request(`/api/v1/web4/resolve/${encodeURIComponent(domainName)}`);
    }
    // ==================== Blockchain Operations ====================
    async getBlockchainInfo() {
        return this.request('/blockchain/info');
    }
    async getGasInfo() {
        return this.request('/network/gas');
    }
    async getNodeStatus() {
        return this.request('/node/status');
    }
    async getMeshPeers() {
        return this.request('/mesh/peers');
    }
    async getNetworkStats() {
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
        }
        catch (error) {
            console.warn('⚠️ Failed to get network stats:', error);
            throw error;
        }
    }
    // ==================== Smart Contract Operations ====================
    async deployContract(contractData, options) {
        return this.request('/api/v1/contract/deploy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...contractData, ...options }),
        });
    }
    async executeContract(contractId, functionName, args) {
        return this.request('/api/v1/contract/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contractId, functionName, args }),
        });
    }
    async queryContract(contractId, functionName, args) {
        let endpoint = `/api/v1/contract/query/${contractId}`;
        if (functionName) {
            endpoint += `/${functionName}`;
        }
        return this.request(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ args }),
        });
    }
    async getContractMetadata(contractId) {
        return this.request(`/api/v1/contract/${contractId}/metadata`);
    }
    async upgradeContract(contractId, newBytecode, metadata) {
        return this.request(`/api/v1/contract/${contractId}/upgrade`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newBytecode, metadata }),
        });
    }
    // ==================== Zero-Knowledge Proof Operations ====================
    async generateZkProof(data) {
        return this.request('/api/v1/zkp/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
    }
    async verifyZkProof(proof) {
        try {
            const response = await this.request('/api/v1/zkp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(proof),
            });
            return response.valid || false;
        }
        catch (error) {
            console.warn('⚠️ Failed to verify zero-knowledge proof:', error);
            return false;
        }
    }
    // ==================== Connection Management ====================
    async testConnection() {
        try {
            await this.request('/health');
            return true;
        }
        catch (error) {
            console.warn('⚠️ Health check failed:', error);
            return false;
        }
    }
    // ==================== Protocol Information ====================
    async getProtocolInfo() {
        try {
            const response = await this.request('/node/status');
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
        }
        catch (error) {
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
//# sourceMappingURL=zhtp-api-methods.js.map