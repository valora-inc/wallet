import { storeEncryptedMnemonic } from 'src/keylessBackup/index'
import { mocked } from 'ts-jest/utils'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'

jest.mock('src/utils/fetchWithTimeout')

describe(storeEncryptedMnemonic, () => {
  it('throws error and logs analytics event if error status', async () => {
    // 500 error
    mocked(fetchWithTimeout).mockResolvedValueOnce({
      status: 500,
      ok: false,
      json: async () => ({ message: 'bad news' }),
    } as any)
    await expect(() =>
      storeEncryptedMnemonic({
        encryptedMnemonic: 'encrypted',
        encryptionAddress: 'address',
      })
    ).rejects.toThrow('Failed to post encrypted mnemonic with status 500, message bad news')
    expect(ValoraAnalytics.track).toHaveBeenCalledWith('cab_post_encrypted_mnemonic_failed', {
      backupAlreadyExists: false,
    })

    // 409 error (backup exists)
    mocked(fetchWithTimeout).mockResolvedValueOnce({
      status: 409,
      ok: false,
      json: async () => ({ message: 'backup exists' }),
    } as any)
    await expect(() =>
      storeEncryptedMnemonic({
        encryptedMnemonic: 'encrypted',
        encryptionAddress: 'address',
      })
    ).rejects.toThrow('Failed to post encrypted mnemonic with status 409, message backup exists')
    expect(ValoraAnalytics.track).toHaveBeenCalledWith('cab_post_encrypted_mnemonic_failed', {
      backupAlreadyExists: true,
    })
  })
  it('resolves if success status', async () => {
    mocked(fetchWithTimeout).mockResolvedValueOnce({ status: 200, ok: true } as any)
    expect(
      await storeEncryptedMnemonic({
        encryptedMnemonic: 'encrypted',
        encryptionAddress: 'address',
      })
    ).toBeUndefined()
  })
})
