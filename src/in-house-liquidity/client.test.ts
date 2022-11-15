import { SiweClient } from '@fiatconnect/fiatconnect-sdk'
import { REMOTE_CONFIG_VALUES_DEFAULTS } from 'src/firebase/remoteConfigValuesDefaults'
import { getClient } from 'src/in-house-liquidity/client'
import { getWalletAsync } from 'src/web3/contracts'

jest.mock('src/web3/contracts', () => ({
  getWalletAsync: jest.fn(() => ({
    getAccounts: jest.fn(() => ['fake-account']),
  })),
}))

jest.mock('src/fiatconnect/clients')

describe('getClient', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('makes and returns a new client the first time', async () => {
    const ihlClient = await getClient()
    expect(getWalletAsync).toHaveBeenCalled()
    expect(ihlClient).toBeInstanceOf(SiweClient)
    expect(ihlClient).toHaveProperty(
      'config.timeout',
      REMOTE_CONFIG_VALUES_DEFAULTS.networkTimeoutSeconds * 1000
    )
  })

  it('returns an already existing client', async () => {
    const ihlClient = await getClient()
    expect(getWalletAsync).not.toHaveBeenCalled()
    expect(ihlClient).toBeInstanceOf(SiweClient)
  })
})
