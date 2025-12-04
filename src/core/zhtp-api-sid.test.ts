/**
 * Tests for ZhtpApi SID Methods
 * Comprehensive tests for backup, recovery, guardian, and citizenship operations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ZhtpApi } from './zhtp-api';
import { ApiConfig } from './types';

describe('ZhtpApi - SID Methods', () => {
  let api: ZhtpApi;
  const mockConfig: ApiConfig = {
    zhtpNodeUrl: 'http://localhost:8000',
    networkType: 'testnet',
    debugMode: false,
    enableBiometrics: true,
  };

  const mockConfigProvider = {
    getConfig: vi.fn().mockResolvedValue(mockConfig),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    api = new ZhtpApi(mockConfigProvider);
    await api.ensureInitialized();
    global.fetch = vi.fn();
  });

  describe('Backup Operations', () => {
    it('exportBackup should POST to /api/v1/identity/backup/export', async () => {
      const mockBackupData = {
        backup_data: 'encrypted_backup_data_base64',
        created_at: 1234567890,
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockBackupData),
      });

      const result = await api.exportBackup('test-identity', 'test-passphrase');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/identity/backup/export',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identity_id: 'test-identity',
            passphrase: 'test-passphrase',
          }),
        })
      );

      expect(result).toEqual(mockBackupData);
      expect(result.backup_data).toBe('encrypted_backup_data_base64');
      expect(result.created_at).toBe(1234567890);
    });

    it('importBackup should POST to /api/v1/identity/backup/import', async () => {
      const mockResponse = {
        status: 'success',
        identity: {
          identity_id: 'test-id-123',
          did: 'did:test:restored',
        },
        session_token: 'test-session-token',
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      const backupData = 'encrypted_backup_data_string';
      const result = await api.importBackup(backupData, 'test-passphrase');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/identity/backup/import',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            backup_data: backupData,
            passphrase: 'test-passphrase',
          }),
        })
      );

      expect(result.status).toBe('success');
      expect(result.identity.did).toBe('did:test:restored');
      expect(result.session_token).toBe('test-session-token');
    });

    it('verifyBackup should POST to /api/v1/identity/backup/verify', async () => {
      const mockVerification = {
        valid: true,
        version: '1.0',
        created_at: 1234567890,
        identity_id: 'test-identity',
        errors: [],
        warnings: [],
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockVerification),
      });

      const result = await api.verifyBackup('encrypted_backup_data');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/identity/backup/verify',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ backup_data: 'encrypted_backup_data' }),
        })
      );

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.identity_id).toBe('test-identity');
    });

    it('verifyBackup should handle invalid backups', async () => {
      const mockVerification = {
        valid: false,
        version: '',
        created_at: 0,
        errors: ['Invalid encryption', 'Corrupted data'],
        warnings: [],
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockVerification),
      });

      const result = await api.verifyBackup('corrupted_data');

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe('Seed Phrase Operations', () => {
    it('verifySeedPhrase should POST to /api/v1/identity/seed/verify', async () => {
      const mockVerification = {
        valid: true,
        wallet_id: 'wallet-123',
        wallet_type: 'primary',
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockVerification),
      });

      const seedPhrase = 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12 word13 word14 word15 word16 word17 word18 word19 word20';
      const result = await api.verifySeedPhrase('test-identity', seedPhrase);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/identity/seed/verify',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            identity_id: 'test-identity',
            seed_phrase: seedPhrase,
          }),
        })
      );

      expect(result.valid).toBe(true);
      expect(result.wallet_id).toBe('wallet-123');
      expect(result.wallet_type).toBe('primary');
    });

    it('verifySeedPhrase should handle invalid seeds', async () => {
      const mockVerification = {
        valid: false,
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockVerification),
      });

      const result = await api.verifySeedPhrase('test-identity', 'invalid seed');

      expect(result.valid).toBe(false);
      expect(result.wallet_id).toBeUndefined();
    });

    it('exportSeedPhrases should GET from /api/v1/identity/{id}/seeds', async () => {
      const mockSeeds = {
        primary: ['word1', 'word2', 'word3'],
        ubi: ['word4', 'word5', 'word6'],
        savings: ['word7', 'word8', 'word9'],
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockSeeds),
      });

      const result = await api.exportSeedPhrases('test-identity');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/identity/test-identity/seeds',
        expect.any(Object)
      );

      expect(result.primary).toHaveLength(3);
      expect(result.ubi).toHaveLength(3);
      expect(result.savings).toHaveLength(3);
    });
  });

  describe('Guardian Management', () => {
    it('addGuardian should POST to /api/v1/guardian/add', async () => {
      const mockResponse = {
        status: 'success',
        guardian_id: 'guardian-123',
        message: 'Guardian added successfully',
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      const guardianInfo = { relationship: 'family', trust_level: 'high' };
      const result = await api.addGuardian('identity-123', 'guardian-123', guardianInfo);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/guardian/add',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            identity_id: 'identity-123',
            guardian_id: 'guardian-123',
            relationship: 'family',
            trust_level: 'high',
          }),
        })
      );

      expect(result.status).toBe('success');
      expect(result.guardian_id).toBe('guardian-123');
    });

    it('listGuardians should GET from /api/v1/guardian/list/{id}', async () => {
      const mockGuardians = [
        {
          guardian_id: 'guardian-1',
          guardian_name: 'Alice',
          status: 'active' as const,
          added_at: 1234567890,
          relationship: 'family',
        },
        {
          guardian_id: 'guardian-2',
          guardian_name: 'Bob',
          status: 'pending' as const,
          added_at: 1234567900,
          relationship: 'friend',
        },
      ];

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockGuardians),
      });

      const result = await api.listGuardians('identity-123');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/guardian/list/identity-123',
        expect.any(Object)
      );

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('active');
      expect(result[1].status).toBe('pending');
    });

    it('removeGuardian should POST to /api/v1/guardian/remove', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      });

      await api.removeGuardian('identity-123', 'guardian-456');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/guardian/remove',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            identity_id: 'identity-123',
            guardian_id: 'guardian-456',
          }),
        })
      );
    });

    it('acceptGuardianInvite should POST to /api/v1/guardian/accept', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      });

      await api.acceptGuardianInvite('guardian-123', 'identity-456');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/guardian/accept',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            guardian_id: 'guardian-123',
            identity_id: 'identity-456',
          }),
        })
      );
    });

    it('declineGuardianInvite should POST to /api/v1/guardian/decline', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      });

      await api.declineGuardianInvite('guardian-123', 'identity-456');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/guardian/decline',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            guardian_id: 'guardian-123',
            identity_id: 'identity-456',
          }),
        })
      );
    });
  });

  describe('Guardian Recovery Flow', () => {
    it('initiateRecovery should POST to /api/v1/guardian/recovery/initiate', async () => {
      const mockSession = {
        recovery_id: 'recovery-789',
        identity_id: 'identity-123',
        status: 'initiated' as const,
        required_approvals: 3,
        current_approvals: 0,
        guardian_ids: ['g1', 'g2', 'g3', 'g4'],
        created_at: 1234567890,
        expires_at: 1234654290,
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockSession),
      });

      const guardianIds = ['g1', 'g2', 'g3', 'g4'];
      const result = await api.initiateRecovery('identity-123', guardianIds);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/guardian/recovery/initiate',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            identity_id: 'identity-123',
            guardian_ids: guardianIds,
          }),
        })
      );

      expect(result.recovery_id).toBe('recovery-789');
      expect(result.status).toBe('initiated');
      expect(result.required_approvals).toBe(3);
      expect(result.current_approvals).toBe(0);
    });

    it('approveRecovery should POST to /api/v1/guardian/recovery/approve', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      });

      await api.approveRecovery('guardian-123', 'recovery-789', true);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/guardian/recovery/approve',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            guardian_id: 'guardian-123',
            recovery_id: 'recovery-789',
            approval: true,
          }),
        })
      );
    });

    it('approveRecovery should handle rejection', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      });

      await api.approveRecovery('guardian-123', 'recovery-789', false);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/guardian/recovery/approve',
        expect.objectContaining({
          body: expect.stringContaining('"approval":false'),
        })
      );
    });

    it('getRecoveryStatus should GET from /api/v1/guardian/recovery/status/{id}', async () => {
      const mockStatus = {
        recovery_id: 'recovery-789',
        status: 'pending_approvals' as const,
        progress: {
          required: 3,
          approved: 2,
          declined: 0,
        },
        guardians: [
          {
            guardian_id: 'g1',
            status: 'approved' as const,
            responded_at: 1234567900,
          },
          {
            guardian_id: 'g2',
            status: 'approved' as const,
            responded_at: 1234567910,
          },
          {
            guardian_id: 'g3',
            status: 'pending' as const,
          },
        ],
        created_at: 1234567890,
        updated_at: 1234567910,
        expires_at: 1234654290,
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockStatus),
      });

      const result = await api.getRecoveryStatus('recovery-789');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/guardian/recovery/status/recovery-789',
        expect.any(Object)
      );

      expect(result.recovery_id).toBe('recovery-789');
      expect(result.status).toBe('pending_approvals');
      expect(result.progress.approved).toBe(2);
      expect(result.progress.required).toBe(3);
      expect(result.guardians).toHaveLength(3);
    });

    it('getRecoveryStatus should handle completed recovery', async () => {
      const mockStatus = {
        recovery_id: 'recovery-789',
        status: 'completed' as const,
        progress: {
          required: 3,
          approved: 3,
          declined: 0,
        },
        guardians: [],
        created_at: 1234567890,
        updated_at: 1234567920,
        expires_at: 1234654290,
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockStatus),
      });

      const result = await api.getRecoveryStatus('recovery-789');

      expect(result.status).toBe('completed');
      expect(result.progress.approved).toBe(3);
    });

    it('cancelRecovery should POST to /api/v1/guardian/recovery/cancel', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      });

      await api.cancelRecovery('recovery-789');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/guardian/recovery/cancel',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ recovery_id: 'recovery-789' }),
        })
      );
    });
  });

  describe('Citizenship Operations', () => {
    it('applyCitizenship should POST to /api/v1/identity/citizenship/apply', async () => {
      const mockCitizenship = {
        identity_id: 'identity-123',
        primary_wallet_id: 'wallet-1',
        ubi_wallet_id: 'wallet-2',
        savings_wallet_id: 'wallet-3',
        wallet_seed_phrases: {
          primary_wallet_seeds: { words: ['word1', 'word2'] },
          ubi_wallet_seeds: { words: ['word3', 'word4'] },
          savings_wallet_seeds: { words: ['word5', 'word6'] },
        },
        dao_registration: {
          voting_power: 100,
          soulbound_nft_issued: true,
          registered_at: 1234567890,
        },
        ubi_registration: {
          ubi_wallet_id: 'wallet-2',
          ubi_enabled: true,
        },
        web4_access: {
          web4_enabled: true,
        },
        welcome_bonus: {
          bonus_amount: 1000,
        },
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockCitizenship),
      });

      const applicationData = { referral_code: 'REF123' };
      const result = await api.applyCitizenship('identity-123', applicationData);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/identity/citizenship/apply',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            identity_id: 'identity-123',
            referral_code: 'REF123',
          }),
        })
      );

      expect(result.identity_id).toBe('identity-123');
      expect(result.dao_registration.voting_power).toBe(100);
      expect(result.welcome_bonus.bonus_amount).toBe(1000);
      expect(result.ubi_registration.ubi_enabled).toBe(true);
    });

    it('applyCitizenship should work without optional data', async () => {
      const mockCitizenship = {
        identity_id: 'identity-456',
        primary_wallet_id: 'wallet-1',
        ubi_wallet_id: 'wallet-2',
        savings_wallet_id: 'wallet-3',
        wallet_seed_phrases: {
          primary_wallet_seeds: { words: [] },
          ubi_wallet_seeds: { words: [] },
          savings_wallet_seeds: { words: [] },
        },
        dao_registration: {
          voting_power: 50,
          soulbound_nft_issued: true,
          registered_at: 1234567890,
        },
        ubi_registration: {
          ubi_wallet_id: 'wallet-2',
          ubi_enabled: true,
        },
        web4_access: {
          web4_enabled: true,
        },
        welcome_bonus: {
          bonus_amount: 1000,
        },
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockCitizenship),
      });

      const result = await api.applyCitizenship('identity-456');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/identity/citizenship/apply',
        expect.objectContaining({
          body: JSON.stringify({ identity_id: 'identity-456' }),
        })
      );

      expect(result.identity_id).toBe('identity-456');
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      // Re-initialize API for error tests
      api = new ZhtpApi(mockConfigProvider);
      await api.ensureInitialized();
    });

    it('should handle HTTP 400 errors in addGuardian', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: vi.fn().mockResolvedValue({ error: 'Invalid guardian ID' }),
      });

      await expect(api.addGuardian('id', 'invalid')).rejects.toThrow();
    });

    it('should handle HTTP 404 errors in getRecoveryStatus', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: vi.fn().mockResolvedValue({ error: 'Recovery not found' }),
      });

      await expect(api.getRecoveryStatus('invalid-id')).rejects.toThrow();
    });
  });
});
