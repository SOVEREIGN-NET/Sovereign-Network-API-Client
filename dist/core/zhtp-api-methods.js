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
    async exportBackup(identityId, passphrase) {
        if (passphrase.length < 12) {
            throw new Error('Passphrase must be at least 12 characters');
        }
        return this.request('/api/v1/identity/backup/export', {
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
    async importBackup(backupData, passphrase) {
        if (passphrase.length < 12) {
            throw new Error('Passphrase must be at least 12 characters');
        }
        return this.request('/api/v1/identity/backup/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ backup_data: backupData, passphrase }),
        });
    }
    async verifyBackup(backupData) {
        return this.request('/api/v1/identity/backup/verify', {
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
    async getBackupStatus(identityId) {
        return this.request(`/api/v1/identity/backup/status?identity_id=${encodeURIComponent(identityId)}`);
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
    async verifySeedPhrase(identityId, seedPhrase) {
        const words = seedPhrase.trim().split(/\s+/);
        if (words.length !== 12) {
            throw new Error('Seed phrase must be exactly 12 words');
        }
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
    async addGuardian(identityId, sessionToken, guardianDid, guardianPublicKey, guardianName) {
        return this.request('/api/v1/identity/guardians/add', {
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
    async listGuardians(sessionToken) {
        return this.request('/api/v1/identity/guardians', {
            headers: {
                'Authorization': `Bearer ${sessionToken}`
            }
        });
    }
    async removeGuardian(guardianId, sessionToken) {
        await this.request(`/api/v1/identity/guardians/${guardianId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${sessionToken}`
            }
        });
    }
    // ==================== Guardian Recovery Flow ====================
    async initiateRecovery(identityDid, requesterDevice) {
        return this.request('/api/v1/identity/recovery/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity_did: identityDid, requester_device: requesterDevice }),
        });
    }
    async approveRecovery(recoveryId, guardianDid, sessionToken, signature) {
        return this.request(`/api/v1/identity/recovery/${recoveryId}/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                guardian_did: guardianDid,
                session_token: sessionToken,
                signature: signature
            }),
        });
    }
    async rejectRecovery(recoveryId, guardianDid, sessionToken, signature) {
        await this.request(`/api/v1/identity/recovery/${recoveryId}/reject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                guardian_did: guardianDid,
                session_token: sessionToken,
                signature: signature
            }),
        });
    }
    async completeRecovery(recoveryId) {
        return this.request(`/api/v1/identity/recovery/${recoveryId}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
    }
    async getRecoveryStatus(recoveryId) {
        return this.request(`/api/v1/identity/recovery/${recoveryId}/status`);
    }
    async getPendingRecoveries(sessionToken) {
        return this.request('/api/v1/identity/recovery/pending', {
            headers: {
                'Authorization': `Bearer ${sessionToken}`
            }
        });
    }
    async cancelRecovery(recoveryId) {
        await this.request(`/api/v1/guardian/recovery/cancel`, {
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
    /**
     * Get list of connected network peers
     * @returns Peer information including peer IDs, types, and connection status
     */
    async getNetworkPeers() {
        return this.request('/api/v1/blockchain/network/peers');
    }
    /**
     * Get comprehensive network statistics including mesh status and traffic
     * @returns Network stats with mesh status, traffic, and peer distribution
     */
    async getNetworkStats() {
        return this.request('/api/v1/blockchain/network/stats');
    }
    /**
     * Get current gas pricing information for transaction cost estimation
     * @returns Gas prices including base fee, priority fee, and estimated costs
     */
    async getGasInfo() {
        return this.request('/api/v1/network/gas');
    }
    /**
     * Add a peer to the network by address
     * @param request - Peer address and optional peer type
     * @returns Connection result with peer ID and status
     */
    async addNetworkPeer(request) {
        return this.request('/api/v1/blockchain/network/peer/add', {
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
    async removeNetworkPeer(peerId) {
        return this.request(`/api/v1/blockchain/network/peer/${peerId}`, {
            method: 'DELETE',
        });
    }
    // Legacy method (kept for backward compatibility)
    /**
     * @deprecated Use getNetworkPeers() instead
     */
    async getNetworkInfo() {
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
    async getWalletList(identityId) {
        return this.request(`/api/v1/wallet/list/${identityId}`);
    }
    /**
     * Get balance for a specific wallet type
     * @param walletType - Wallet type (Primary, UBI, Savings, Staking, etc.)
     * @param identityId - Identity ID (hex string)
     * @returns Detailed balance information for the wallet
     */
    async getWalletBalance(walletType, identityId) {
        const response = await this.request(`/api/v1/wallet/balance/${walletType}/${identityId}`);
        return response.balance.available_balance;
    }
    /**
     * Get comprehensive wallet statistics for an identity
     * @param identityId - Identity ID (hex string)
     * @returns Wallet statistics
     */
    async getWalletStatistics(identityId) {
        return this.request(`/api/v1/wallet/statistics/${identityId}`);
    }
    /**
     * Get transaction history for an identity
     * @param identityId - Identity ID (hex string)
     * @returns Transaction history
     */
    async getWalletTransactionHistory(identityId) {
        return this.request(`/api/v1/wallet/transactions/${identityId}`);
    }
    /**
     * Send a simple payment from primary wallet
     * @param request - Send request with from_identity, to_address, amount, memo
     * @returns Transaction result
     */
    async sendWalletPayment(request) {
        return this.request('/api/v1/wallet/send', {
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
    async transferBetweenWallets(request) {
        return this.request('/api/v1/wallet/transfer/cross-wallet', {
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
    async stakeTokens(identityId, amount) {
        const request = {
            identity_id: identityId,
            amount: amount,
        };
        return this.request('/api/v1/wallet/staking/stake', {
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
    async unstakeTokens(identityId, amount) {
        const request = {
            identity_id: identityId,
            amount: amount,
        };
        return this.request('/api/v1/wallet/staking/unstake', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
        });
    }
    // Legacy methods (kept for backward compatibility)
    /**
     * @deprecated Use getWalletList() instead
     */
    async getWallets(did) {
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
    async getTransactionHistory(address, walletType) {
        const response = await this.getWalletTransactionHistory(address);
        return response.transactions.map(tx => ({
            id: tx.tx_hash,
            from: tx.from_wallet || '',
            to: tx.to_address || '',
            amount: tx.amount,
            status: tx.status,
            timestamp: new Date(tx.timestamp * 1000).toISOString(),
            blockNumber: tx.block_height || undefined,
            hash: tx.tx_hash,
        }));
    }
    async getAssets(address) {
        return this.request(`/api/v1/wallet/assets?address=${encodeURIComponent(address)}`);
    }
    /**
     * @deprecated Use sendWalletPayment() instead
     */
    async sendTransaction(from, to, amount, metadata) {
        const request = {
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
    async getDaoProposals() {
        return this.request('/api/v1/dao/proposals/list');
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
        return this.request('/api/v1/dao/proposal/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(proposal),
        });
    }
    async submitVote(voterIdentityId, proposalId, voteChoice, justification) {
        await this.request('/api/v1/dao/vote/cast', {
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
    async getDaoTreasury() {
        const response = await this.request('/api/v1/dao/treasury/status');
        return response?.treasury?.total_balance || 0;
    }
    async getProposalDetails(proposalId) {
        return this.request(`/api/v1/dao/proposal/${proposalId}`);
    }
    async getDaoData() {
        return this.request('/api/v1/dao/data');
    }
    async getDaoDelegates() {
        return this.request('/api/v1/dao/delegates');
    }
    async getDelegateProfile(delegateId) {
        return this.request(`/api/v1/dao/delegates/${delegateId}`);
    }
    async registerDelegate(userDid, delegateInfo) {
        return this.request('/api/v1/dao/delegates/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_did: userDid, delegate_info: delegateInfo }),
        });
    }
    async revokeDelegation(userDid) {
        await this.request('/api/v1/dao/delegates/revoke', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_did: userDid }),
        });
    }
    async getTreasuryHistory(limit, offset) {
        const params = new URLSearchParams();
        if (limit)
            params.append('limit', limit.toString());
        if (offset)
            params.append('offset', offset.toString());
        const queryString = params.toString();
        const url = `/api/v1/dao/treasury/transactions${queryString ? '?' + queryString : ''}`;
        const response = await this.request(url);
        return response?.transactions || [];
    }
    async createSpendingProposal(proposalData) {
        return this.request('/api/v1/dao/proposals/spending', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(proposalData),
        });
    }
    async getVotingPower(userDid) {
        try {
            const response = await this.request(`/api/v1/dao/voting-power/${userDid}`);
            return response.votingPower || 0;
        }
        catch (error) {
            console.warn('⚠️ Failed to get voting power:', error);
            return 0;
        }
    }
    async getUserVotes(userDid) {
        return this.request(`/api/v1/dao/user-votes/${userDid}`);
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
    /**
     * Lookup contract by blockchain transaction hash
     * @param hash - Deployment transaction hash
     */
    async getContractByHash(hash) {
        return this.request(`/api/v1/blockchain/contract/${hash}`);
    }
    async getContractById(contractId) {
        return this.request(`/api/v1/contract/${contractId}`);
    }
    async resolveDomain(domainName) {
        return this.request(`/api/v1/web4/resolve/${encodeURIComponent(domainName)}`);
    }
    /**
     * Register a new Web4 domain with content
     * @param request - Domain registration request with owner, content, signature, fee
     * @returns Registration response with domain details and transaction hash
     */
    async registerWeb4Domain(request) {
        return this.request('/api/v1/web4/domains/register', {
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
    async resolveWeb4Domain(domain) {
        return this.request(`/api/v1/web4/resolve/${encodeURIComponent(domain)}`);
    }
    /**
     * Get full Web4 domain information including content mappings
     * @param domain - Domain name (e.g., "example.zhtp")
     * @returns Complete domain record with content hashes
     */
    async getWeb4Domain(domain) {
        return this.request(`/api/v1/web4/domains/${encodeURIComponent(domain)}`);
    }
    /**
     * Resolve Web4 domain via DHT network
     * @param domain - Domain name (e.g., "example.zhtp")
     */
    async resolveWeb4ViaDht(domain) {
        return this.request(`/api/v1/dht/web4/resolve/${encodeURIComponent(domain)}`);
    }
    /**
     * Get contract from DHT distributed storage
     * @param contractId - Contract identifier
     */
    async getContractFromDht(contractId) {
        return this.request(`/api/v1/dht/contract/${contractId}`);
    }
    // ==================== Blockchain Operations ====================
    async getBlockchainInfo() {
        return this.request('/api/v1/blockchain/status');
    }
    async getNodeStatus() {
        return this.request('/api/v1/protocol/info');
    }
    /**
     * @deprecated Use getNetworkPeers() instead
     */
    async getMeshPeers() {
        const response = await this.getNetworkPeers();
        return {
            peers: response.peers.map(p => p.peer_id),
            count: response.peer_count,
        };
    }
    // ==================== Smart Contract Operations ====================
    async deployContract(contractData, options) {
        return this.request('/api/v1/blockchain/contracts/deploy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...contractData, ...options }),
        });
    }
    async executeContract(contractId, functionName, args) {
        return this.request(`/api/v1/blockchain/contracts/${contractId}/call`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ functionName, args }),
        });
    }
    async queryContract(contractId, functionName, args) {
        return this.request(`/api/v1/blockchain/contracts/${contractId}/state`, {
            method: 'GET',
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
    async generateZkProof(request, sessionToken) {
        const response = await this.request('/api/v1/zkp/generate', {
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
    async verifyZkProof(proof) {
        const response = await this.request('/api/v1/zkp/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ proof }),
        });
        return response.valid;
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
    /**
     * Get protocol information including version, node ID, and supported features
     * @returns Protocol information with capabilities and uptime
     */
    async getProtocolInfo() {
        return this.request('/api/v1/protocol/info');
    }
    /**
     * Get health check status for the node
     * @returns Health status with checks for server, handlers, and memory
     */
    async getProtocolHealth() {
        return this.request('/api/v1/protocol/health');
    }
    /**
     * Get version information for server, protocol, and API
     * @returns Version details including build information
     */
    async getProtocolVersion() {
        return this.request('/api/v1/protocol/version');
    }
    /**
     * Get list of protocol capabilities and extensions
     * @returns Available capabilities with enabled status and descriptions
     */
    async getProtocolCapabilities() {
        return this.request('/api/v1/protocol/capabilities');
    }
    /**
     * Get protocol statistics including request counts and bandwidth
     * @returns Protocol metrics with request handling and performance stats
     */
    async getProtocolStats() {
        return this.request('/api/v1/protocol/stats');
    }
}
//# sourceMappingURL=zhtp-api-methods.js.map