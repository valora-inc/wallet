import { getPublicClient } from './getPublicClient'

describe('getPublicClient', () => {
  it('should return the correct public client', () => {
    const publicClient = getPublicClient({ networkId: 'celo-alfajores' })
    expect(publicClient).toBeDefined()
  })

  it('should throw an error if the networkId is not yet supported', () => {
    // Tests only use testnet networks, in the future we'll be able to remove this check
    expect(() => getPublicClient({ networkId: 'celo-mainnet' })).toThrow()
  })
})
