import { storeEncryptedMnemonic } from 'src/keylessBackup/index'
import { mocked } from 'ts-jest/utils'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'

jest.mock('src/utils/fetchWithTimeout')

describe(storeEncryptedMnemonic, () => {
  it('throws error if non-409 error status', async () => {
    mocked(fetchWithTimeout).mockResolvedValueOnce({ status: 500, ok: false } as any)
    await expect(() =>
      storeEncryptedMnemonic({
        encryptedMnemonic: 'encrypted',
        encryptionAddress: 'address',
      })
    ).rejects.toThrow('Failed to post encrypted mnemonic with status 500')
  })
  it('resolves if 409 or success status', async () => {
    mocked(fetchWithTimeout).mockResolvedValueOnce({ status: 409, ok: false } as any)
    expect(
      await storeEncryptedMnemonic({
        encryptedMnemonic: 'encrypted',
        encryptionAddress: 'address',
      })
    ).toBeUndefined()
    mocked(fetchWithTimeout).mockResolvedValueOnce({ status: 200, ok: true } as any)
    expect(
      await storeEncryptedMnemonic({
        encryptedMnemonic: 'encrypted',
        encryptionAddress: 'address',
      })
    ).toBeUndefined()
  })
})
