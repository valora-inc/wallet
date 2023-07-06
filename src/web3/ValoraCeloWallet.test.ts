import ValoraCeloWallet from 'src/web3/ValoraCeloWallet'
import { KeychainWallet } from 'src/web3/KeychainWallet'
import { ImportMnemonicAccount } from 'src/web3/KeychainSigner'
import KeychainAccountManager from 'src/web3/KeychainAccountManager'
import { mocked } from 'ts-jest/utils'
import { TypedDataDomain, TypedDataField } from 'ethers'
import { CeloTx } from '@celo/connect'
import { UNLOCK_DURATION } from 'src/web3/consts'

const MOCK_ADDRESS = '0x1234567890123456789012345678901234567890'
const MOCK_IMPORT_MNEMONIC_ACCOUNT: ImportMnemonicAccount = {
  address: MOCK_ADDRESS,
  createdAt: new Date(1482363367071),
}

const MOCK_TYPED_DATA_DOMAIN: TypedDataDomain = {
  name: 'Valora',
  version: '1',
  chainId: 42220,
}
const MOCK_TYPED_DATA_TYPES: Record<string, Array<TypedDataField>> = {
  EIP712Domain: [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    { name: 'chainId', type: 'uint256' },
  ],
  Message: [{ name: 'content', type: 'string' }],
}
const MOCK_TYPED_DATA_VALUE: Record<string, any> = {
  content: 'valora message',
}
const MOCK_TYPED_DATA_PRIMARY_TYPE = 'Message'

const MOCK_CELO_TX: CeloTx = {
  from: MOCK_ADDRESS,
} as CeloTx

jest.mock('src/web3/KeychainWallet')
// Since ValoraCeloWallet is a very thin wrapper over KeychainWallet,
// which already has extensive tests, we mock KeychainWallet for these tests.
describe('ValoraCeloWallet', () => {
  let valoraCeloWallet: ValoraCeloWallet
  let mockKeychainWallet = {
    isAccountUnlocked: jest.fn(),
    signTypedData: jest.fn(),
    signTransaction: jest.fn(),
    signPersonalMessage: jest.fn(),
    decrypt: jest.fn(),
    hasAccount: jest.fn(),
    getAccounts: jest.fn(),
    addAccount: jest.fn(),
    unlockAccount: jest.fn(),
    updateAccount: jest.fn(),
  }
  beforeEach(() => {
    jest.clearAllMocks()
    mocked(KeychainWallet).mockReturnValue(mockKeychainWallet as unknown as KeychainWallet)
    valoraCeloWallet = new ValoraCeloWallet(
      MOCK_IMPORT_MNEMONIC_ACCOUNT,
      new KeychainAccountManager()
    )
  })
  describe('signTypedData', () => {
    it('throws if not unlocked', async () => {
      mockKeychainWallet.isAccountUnlocked.mockReturnValueOnce(false)
      await expect(
        valoraCeloWallet.signTypedData(
          MOCK_ADDRESS,
          MOCK_TYPED_DATA_DOMAIN,
          MOCK_TYPED_DATA_TYPES,
          MOCK_TYPED_DATA_VALUE,
          MOCK_TYPED_DATA_PRIMARY_TYPE
        )
      ).rejects.toEqual(new Error('Authentication needed'))
    })
    it('returns typed data if unlocked', async () => {
      mockKeychainWallet.isAccountUnlocked.mockReturnValueOnce(true)
      mockKeychainWallet.signTypedData.mockReturnValueOnce('typed data')
      await expect(
        valoraCeloWallet.signTypedData(
          MOCK_ADDRESS,
          MOCK_TYPED_DATA_DOMAIN,
          MOCK_TYPED_DATA_TYPES,
          MOCK_TYPED_DATA_VALUE,
          MOCK_TYPED_DATA_PRIMARY_TYPE
        )
      ).resolves.toEqual('typed data')
      expect(mockKeychainWallet.signTypedData).toHaveBeenCalledTimes(1)
      expect(mockKeychainWallet.signTypedData).toHaveBeenCalledWith(MOCK_ADDRESS, {
        types: MOCK_TYPED_DATA_TYPES,
        domain: MOCK_TYPED_DATA_DOMAIN,
        message: MOCK_TYPED_DATA_VALUE,
        primaryType: MOCK_TYPED_DATA_PRIMARY_TYPE,
      })
    })
  })
  describe('signTransaction', () => {
    it('throws if not unlocked', async () => {
      mockKeychainWallet.isAccountUnlocked.mockReturnValueOnce(false)
      await expect(valoraCeloWallet.signTransaction(MOCK_CELO_TX)).rejects.toEqual(
        new Error('Authentication needed')
      )
    })
    it('returns encoded tx if unlocked', async () => {
      mockKeychainWallet.isAccountUnlocked.mockReturnValueOnce(true)
      mockKeychainWallet.signTransaction.mockResolvedValueOnce('some tx object')
      await expect(valoraCeloWallet.signTransaction(MOCK_CELO_TX)).resolves.toEqual(
        'some tx object'
      )
      expect(mockKeychainWallet.signTransaction).toHaveBeenCalledTimes(1)
      expect(mockKeychainWallet.signTransaction).toHaveBeenCalledWith(MOCK_CELO_TX)
    })
  })
  describe('signPersonalMessage', () => {
    it('throws if not unlocked', async () => {
      mockKeychainWallet.isAccountUnlocked.mockReturnValueOnce(false)
      await expect(valoraCeloWallet.signPersonalMessage(MOCK_ADDRESS, 'some data')).rejects.toEqual(
        new Error('Authentication needed')
      )
    })
    it('returns encoded tx if unlocked', async () => {
      mockKeychainWallet.isAccountUnlocked.mockReturnValueOnce(true)
      mockKeychainWallet.signPersonalMessage.mockResolvedValueOnce('some signed message')
      await expect(
        valoraCeloWallet.signPersonalMessage(MOCK_ADDRESS, 'some data')
      ).resolves.toEqual('some signed message')
      expect(mockKeychainWallet.signPersonalMessage).toHaveBeenCalledTimes(1)
      expect(mockKeychainWallet.signPersonalMessage).toHaveBeenCalledWith(MOCK_ADDRESS, 'some data')
    })
  })
  describe('decryptMessage', () => {
    it('throws if not unlocked', async () => {
      mockKeychainWallet.isAccountUnlocked.mockReturnValueOnce(false)
      await expect(
        valoraCeloWallet.decryptMessage(MOCK_ADDRESS, Buffer.from('some data'))
      ).rejects.toEqual(new Error('Authentication needed'))
    })
    it('returns plaintext if unlocked', async () => {
      mockKeychainWallet.isAccountUnlocked.mockReturnValueOnce(true)
      mockKeychainWallet.decrypt.mockResolvedValueOnce('some decrypted message')
      await expect(
        valoraCeloWallet.decryptMessage(MOCK_ADDRESS, Buffer.from('some data'))
      ).resolves.toEqual('some decrypted message')
      expect(mockKeychainWallet.decrypt).toHaveBeenCalledTimes(1)
      expect(mockKeychainWallet.decrypt).toHaveBeenCalledWith(
        MOCK_ADDRESS,
        Buffer.from('some data')
      )
    })
  })
  it('hasAccount is proxy to KeychainWallet', () => {
    mockKeychainWallet.hasAccount.mockReturnValueOnce(true)
    expect(valoraCeloWallet.hasAccount(MOCK_ADDRESS)).toBe(true)
    expect(mockKeychainWallet.hasAccount).toHaveBeenCalledTimes(1)
    expect(mockKeychainWallet.hasAccount).toHaveBeenCalledWith(MOCK_ADDRESS)
  })
  it('getAccounts is proxy to KeychainWallet', () => {
    const result = ['account 1', 'account 2']
    mockKeychainWallet.getAccounts.mockReturnValueOnce(result)
    expect(valoraCeloWallet.getAccounts()).toBe(result)
    expect(mockKeychainWallet.getAccounts).toHaveBeenCalledTimes(1)
    expect(mockKeychainWallet.getAccounts).toHaveBeenCalledWith()
  })
  it('addAccount is proxy to KeychainWallet', async () => {
    mockKeychainWallet.addAccount.mockResolvedValueOnce('some new account')
    await expect(valoraCeloWallet.addAccount('private key', 'password')).resolves.toEqual(
      'some new account'
    )
    expect(mockKeychainWallet.addAccount).toHaveBeenCalledTimes(1)
    expect(mockKeychainWallet.addAccount).toHaveBeenCalledWith('private key', 'password')
  })
  it('unlockAccount is proxy to KeychainWallet', async () => {
    mockKeychainWallet.unlockAccount.mockResolvedValueOnce(true)
    await expect(
      valoraCeloWallet.unlockAccount(MOCK_ADDRESS, 'password', UNLOCK_DURATION)
    ).resolves.toEqual(true)
    expect(mockKeychainWallet.unlockAccount).toHaveBeenCalledTimes(1)
    expect(mockKeychainWallet.unlockAccount).toHaveBeenCalledWith(
      MOCK_ADDRESS,
      'password',
      UNLOCK_DURATION
    )
  })
  it('isAccountUnlocked is proxy to KeychainWallet', () => {
    mockKeychainWallet.isAccountUnlocked.mockReturnValueOnce(true)
    expect(valoraCeloWallet.isAccountUnlocked(MOCK_ADDRESS)).toBe(true)
    expect(mockKeychainWallet.isAccountUnlocked).toHaveBeenCalledTimes(1)
    expect(mockKeychainWallet.isAccountUnlocked).toHaveBeenCalledWith(MOCK_ADDRESS)
  })
  it('updateAccount is proxy to KeychainWallet', async () => {
    mockKeychainWallet.updateAccount.mockResolvedValueOnce(true)
    await expect(
      valoraCeloWallet.updateAccount(MOCK_ADDRESS, 'password', 'new password')
    ).resolves.toEqual(true)
    expect(mockKeychainWallet.updateAccount).toHaveBeenCalledTimes(1)
    expect(mockKeychainWallet.updateAccount).toHaveBeenCalledWith(
      MOCK_ADDRESS,
      'password',
      'new password'
    )
  })
  it('getKeychainWallet returns KeychainWallet', () => {
    expect(valoraCeloWallet.getKeychainWallet()).toBe(mockKeychainWallet)
  })
})
