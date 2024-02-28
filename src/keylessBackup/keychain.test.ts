import { getSECP256k1PrivateKey, storeSECP256k1PrivateKey } from 'src/keylessBackup/keychain'
import { getPassword } from 'src/pincode/authentication'
import { retrieveStoredItem, storeItem } from 'src/storage/keychain'
import { generatePrivateKey } from 'viem/accounts'

jest.mock('src/pincode/authentication')
jest.mock('src/storage/keychain')

describe(storeSECP256k1PrivateKey, () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  const mockPrivateKey = generatePrivateKey()
  it('stores the private key on the keychain', async () => {
    jest.mocked(getPassword).mockResolvedValue('password')
    await storeSECP256k1PrivateKey(mockPrivateKey, '0x1234')
    expect(getPassword).toHaveBeenCalledWith('0x1234')
    expect(storeItem).toHaveBeenCalledWith({
      key: 'secp256k1PrivateKey',
      value: expect.any(String),
    })
  })
  it('throws an error if no account is found', async () => {
    await expect(storeSECP256k1PrivateKey(mockPrivateKey, null)).rejects.toThrow('No account found')
  })
})

describe(getSECP256k1PrivateKey, () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  const mockPrivateKey = generatePrivateKey()

  it('gets the private key from the keychain', async () => {
    jest.mocked(getPassword).mockResolvedValue('password')
    jest.mocked(retrieveStoredItem).mockResolvedValue(mockPrivateKey)
    await getSECP256k1PrivateKey('0x1234')
    expect(getPassword).toHaveBeenCalledWith('0x1234')
    expect(retrieveStoredItem).toHaveBeenCalledWith('secp256k1PrivateKey')
  })
  it('throws an error if no account is found', async () => {
    await expect(getSECP256k1PrivateKey(null)).rejects.toThrow('No account found')
  })
  it('throws an error if no private key is found', async () => {
    jest.mocked(retrieveStoredItem).mockResolvedValue(null)
    await expect(getSECP256k1PrivateKey('0x1234')).rejects.toThrow(
      'No private key found in storage'
    )
  })
})
