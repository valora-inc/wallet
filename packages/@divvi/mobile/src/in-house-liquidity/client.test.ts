import { SiweClient } from '@fiatconnect/fiatconnect-sdk'
import { getClient } from 'src/in-house-liquidity/client'
import { getKeychainAccounts } from 'src/web3/contracts'

jest.mock('src/web3/contracts', () => ({
  getKeychainAccounts: jest.fn(() => ({
    getAccounts: jest.fn(() => ['fake-account']),
  })),
}))

jest.mock('src/fiatconnect/clients')

jest.mock('src/statsig', () => ({
  getDynamicConfigParams: jest.fn().mockReturnValue({ cico: 30 }),
}))

describe('getClient', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('makes and returns a new client the first time', async () => {
    const ihlClient = await getClient()
    expect(getKeychainAccounts).toHaveBeenCalled()
    expect(ihlClient).toBeInstanceOf(SiweClient)
    expect(ihlClient).toHaveProperty('config.timeout', 30000)
  })

  it('returns an already existing client', async () => {
    const ihlClient = await getClient()
    expect(getKeychainAccounts).not.toHaveBeenCalled()
    expect(ihlClient).toBeInstanceOf(SiweClient)
  })
})
