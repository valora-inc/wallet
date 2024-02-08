import { SiweClient } from '@fiatconnect/fiatconnect-sdk'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { getEncryptedMnemonic, storeEncryptedMnemonic } from 'src/keylessBackup/index'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import networkConfig from 'src/web3/networkConfig'
import { generatePrivateKey } from 'viem/accounts'

const mockSiweFetch = jest.fn()
const mockSiweLogin = jest.fn()

jest.mock('src/utils/fetchWithTimeout')
jest.mock('@fiatconnect/fiatconnect-sdk', () => ({
  SiweClient: jest.fn().mockImplementation(() => ({
    fetch: mockSiweFetch,
    login: mockSiweLogin,
  })),
}))
jest.mock('src/statsig', () => ({
  getDynamicConfigParams: jest.fn().mockReturnValue({ default: 10 }),
}))

describe(storeEncryptedMnemonic, () => {
  it('throws error and logs analytics event if error status', async () => {
    // 500 error
    jest.mocked(fetchWithTimeout).mockResolvedValueOnce({
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
    jest.mocked(fetchWithTimeout).mockResolvedValueOnce({
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
    jest.mocked(fetchWithTimeout).mockResolvedValueOnce({ status: 200, ok: true } as any)
    expect(
      await storeEncryptedMnemonic({
        encryptedMnemonic: 'encrypted',
        encryptionAddress: 'address',
      })
    ).toBeUndefined()
  })
})

describe(getEncryptedMnemonic, () => {
  it('returns encrypted mnemonic', async () => {
    mockSiweFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: () => Promise.resolve({ encryptedMnemonic: 'encrypted-mnemonic' }),
    } as any)
    expect(
      await getEncryptedMnemonic({
        encryptionPrivateKey: generatePrivateKey(),
        encryptionAddress: 'address',
      })
    ).toEqual('encrypted-mnemonic')
    expect(mockSiweLogin).toHaveBeenCalledWith()
    expect(mockSiweFetch).toHaveBeenCalledWith(networkConfig.cabGetEncryptedMnemonicUrl)
    expect(jest.mocked(SiweClient)).toHaveBeenCalledWith(
      {
        accountAddress: 'address',
        chainId: 44787,
        clockUrl: networkConfig.cabClockUrl,
        loginUrl: networkConfig.cabLoginUrl,
        sessionDurationMs: 300000,
        statement: 'Sign in with Ethereum',
        timeout: 10000,
        version: '1',
      },
      expect.any(Function)
    )
  })

  it('throws if non 200 response', async () => {
    mockSiweFetch.mockResolvedValueOnce({
      status: 404,
      ok: false,
      json: () => Promise.resolve({ message: 'not found' }),
    } as any)
    await expect(() =>
      getEncryptedMnemonic({
        encryptionPrivateKey: generatePrivateKey(),
        encryptionAddress: 'address',
      })
    ).rejects.toThrow('Failed to get encrypted mnemonic with status 404, message not found')
    expect(mockSiweLogin).toHaveBeenCalledWith()
    expect(mockSiweFetch).toHaveBeenCalledWith(networkConfig.cabGetEncryptedMnemonicUrl)
    expect(jest.mocked(SiweClient)).toHaveBeenCalledWith(
      {
        accountAddress: 'address',
        chainId: 44787,
        clockUrl: networkConfig.cabClockUrl,
        loginUrl: networkConfig.cabLoginUrl,
        sessionDurationMs: 300000,
        statement: 'Sign in with Ethereum',
        timeout: 10000,
        version: '1',
      },
      expect.any(Function)
    )
  })
})
