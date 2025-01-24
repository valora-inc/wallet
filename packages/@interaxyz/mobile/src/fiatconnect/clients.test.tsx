import { FiatConnectClient } from '@fiatconnect/fiatconnect-sdk'
import { getFiatConnectClient, getSiweSigningFunction } from 'src/fiatconnect/clients'
import { getPassword } from 'src/pincode/authentication'
import { getKeychainAccounts } from 'src/web3/contracts'
import { KeychainAccounts } from 'src/web3/KeychainAccounts'

jest.mock('src/web3/contracts', () => ({
  getKeychainAccounts: jest.fn(() => ({
    getAccounts: jest.fn(() => ['fake-account']),
  })),
}))

jest.mock('src/pincode/authentication')
jest.mock('src/statsig', () => ({
  getDynamicConfigParams: jest.fn().mockReturnValue({ cico: 30 }),
}))

describe('getSigningFunction', () => {
  const keychainAccounts = new KeychainAccounts()
  const signMessage = jest.fn().mockResolvedValue('some signed message')

  beforeEach(() => {
    keychainAccounts.getAccounts = jest.fn().mockReturnValue(['fakeAccount'])
    keychainAccounts.isUnlocked = jest.fn().mockReturnValue(true)
    keychainAccounts.getViemAccount = jest.fn().mockReturnValue({
      signMessage,
    })
    keychainAccounts.unlock = jest.fn().mockResolvedValue(undefined)
  })
  it('returns a signing function that signs a message', async () => {
    const signingFunction = getSiweSigningFunction(keychainAccounts)
    const signedMessage = await signingFunction('test')
    expect(signMessage).toHaveBeenCalled()
    expect(keychainAccounts.unlock).not.toHaveBeenCalled()
    expect(signedMessage).toEqual('some signed message')
  })
  it('returns a signing function that attempts to unlock accout if locked', async () => {
    keychainAccounts.isUnlocked = jest.fn().mockReturnValue(false)
    const signingFunction = getSiweSigningFunction(keychainAccounts)
    const signedMessage = await signingFunction('test')
    expect(signMessage).toHaveBeenCalled()
    expect(keychainAccounts.unlock).toHaveBeenCalled()
    expect(getPassword).toHaveBeenCalled()
    expect(signedMessage).toEqual('some signed message')
  })
})

describe('getFiatConnectClient', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('makes and returns a new client the first time', async () => {
    const fcClient = await getFiatConnectClient('provider1', 'https://provider1.url')
    expect(getKeychainAccounts).toHaveBeenCalled()
    expect(fcClient).toBeInstanceOf(FiatConnectClient)
    expect(fcClient).toHaveProperty('config.timeout', 30000)
  })

  it('returns an already existing client', async () => {
    const fcClient = await getFiatConnectClient('provider1', 'https://provider1.url')
    expect(getKeychainAccounts).not.toHaveBeenCalled()
    expect(fcClient).toBeInstanceOf(FiatConnectClient)
  })

  it('returns a new client if provider url changes', async () => {
    const fcClient = await getFiatConnectClient('provider1', 'https://provider1.url/v2')
    expect(getKeychainAccounts).toHaveBeenCalled()
    expect(fcClient).toBeInstanceOf(FiatConnectClient)
  })

  it('returns a new client if provider API key changes', async () => {
    const fcClient = await getFiatConnectClient('provider1', 'api-key', 'https://provider1.url/v2')
    expect(getKeychainAccounts).toHaveBeenCalled()
    expect(fcClient).toBeInstanceOf(FiatConnectClient)
  })

  it('returns a new client for a different provider', async () => {
    const fcClient = await getFiatConnectClient('provider2', 'https://provider2.url')
    expect(getKeychainAccounts).toHaveBeenCalled()
    expect(fcClient).toBeInstanceOf(FiatConnectClient)
  })
})
