import { FiatConnectClient } from '@fiatconnect/fiatconnect-sdk'
import { getFiatConnectClient, getSiweSigningFunction } from 'src/fiatconnect/clients'
import { REMOTE_CONFIG_VALUES_DEFAULTS } from 'src/firebase/remoteConfigValuesDefaults'
import { getPassword } from 'src/pincode/authentication'
import { getWalletAsync } from 'src/web3/contracts'
import ValoraCeloWallet from 'src/web3/ValoraCeloWallet'
import KeychainAccountManager from 'src/web3/KeychainAccountManager'

jest.mock('src/web3/contracts', () => ({
  getWalletAsync: jest.fn(() => ({
    getAccounts: jest.fn(() => ['fake-account']),
  })),
}))

jest.mock('src/pincode/authentication')

describe('getSigningFunction', () => {
  const wallet = new ValoraCeloWallet(
    {
      address: 'fake-address',
      createdAt: new Date(),
    },
    new KeychainAccountManager()
  )
  beforeEach(() => {
    wallet.getAccounts = jest.fn().mockReturnValue(['fakeAccount'])
    wallet.isAccountUnlocked = jest.fn().mockReturnValue(true)
    wallet.signPersonalMessage = jest.fn().mockResolvedValue('some signed message')
    wallet.unlockAccount = jest.fn().mockResolvedValue(undefined)
  })
  it('returns a signing function that signs a message', async () => {
    const signingFunction = getSiweSigningFunction(wallet)
    const signedMessage = await signingFunction('test')
    expect(wallet.signPersonalMessage).toHaveBeenCalled()
    expect(wallet.unlockAccount).not.toHaveBeenCalled()
    expect(signedMessage).toEqual('some signed message')
  })
  it('returns a signing function that attempts to unlock accout if locked', async () => {
    wallet.isAccountUnlocked = jest.fn().mockReturnValue(false)
    const signingFunction = getSiweSigningFunction(wallet)
    const signedMessage = await signingFunction('test')
    expect(wallet.signPersonalMessage).toHaveBeenCalled()
    expect(wallet.unlockAccount).toHaveBeenCalled()
    expect(getPassword).toHaveBeenCalled()
    expect(signedMessage).toEqual('some signed message')
  })
})

describe('getFiatConnectClient', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('makes and returns a new client the first time', async () => {
    const fcClient = await getFiatConnectClient('provider1', 'https://provider1.url')
    expect(getWalletAsync).toHaveBeenCalled()
    expect(fcClient).toBeInstanceOf(FiatConnectClient)
    expect(fcClient).toHaveProperty(
      'config.timeout',
      REMOTE_CONFIG_VALUES_DEFAULTS.networkTimeoutSeconds * 1000
    )
  })

  it('returns an already existing client', async () => {
    const fcClient = await getFiatConnectClient('provider1', 'https://provider1.url')
    expect(getWalletAsync).not.toHaveBeenCalled()
    expect(fcClient).toBeInstanceOf(FiatConnectClient)
  })

  it('returns a new client if provider url changes', async () => {
    const fcClient = await getFiatConnectClient('provider1', 'https://provider1.url/v2')
    expect(getWalletAsync).toHaveBeenCalled()
    expect(fcClient).toBeInstanceOf(FiatConnectClient)
  })

  it('returns a new client if provider API key changes', async () => {
    const fcClient = await getFiatConnectClient('provider1', 'api-key', 'https://provider1.url/v2')
    expect(getWalletAsync).toHaveBeenCalled()
    expect(fcClient).toBeInstanceOf(FiatConnectClient)
  })

  it('returns a new client for a different provider', async () => {
    const fcClient = await getFiatConnectClient('provider2', 'https://provider2.url')
    expect(getWalletAsync).toHaveBeenCalled()
    expect(fcClient).toBeInstanceOf(FiatConnectClient)
  })
})
