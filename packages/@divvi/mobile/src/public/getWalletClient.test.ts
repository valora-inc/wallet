import { celoAlfajores } from 'viem/chains'
import { getViemWallet } from '../web3/contracts'
import { getWalletClient } from './getWalletClient'

jest.mock('../web3/contracts')

describe('getWalletClient', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    jest.mocked(getViemWallet).mockReturnValue({} as any)
  })

  it('should return the correct wallet client', async () => {
    const walletClient = await getWalletClient({ networkId: 'celo-alfajores' })
    expect(walletClient).toBeDefined()
    expect(getViemWallet).toHaveBeenCalledWith(celoAlfajores)
  })

  it('should throw an error if the networkId is not yet supported', async () => {
    // Tests only use testnet networks, in the future we'll be able to remove this check
    await expect(getWalletClient({ networkId: 'celo-mainnet' })).rejects.toThrow()
  })
})
