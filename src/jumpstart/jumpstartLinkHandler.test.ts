import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import networkConfig from 'src/web3/networkConfig'
import { mockAccount, mockAccount2 } from 'test/values'
import { jumpstartLinkHandler } from './jumpstartLinkHandler'

const mockErc20ClaimsCall = jest.fn()
jest.mock('src/web3/utils', () => ({
  ...(jest.requireActual('src/web3/utils') as any),
  getContract: jest.fn().mockImplementation(() => ({
    methods: {
      erc20Claims: (_: string, index: number) => ({
        call: () => mockErc20ClaimsCall(),
      }),
      erc721Claims: () => ({
        call: () => {
          throw new Error('execution reverted')
        },
      }),
    },
  })),
}))
jest.mock('src/web3/providers')
jest.mock('src/utils/fetchWithTimeout')

describe('jumpstartLinkHandler', () => {
  const privateKey = '0x1234567890abcdef'

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('claims any unclaimed funds associated with the private key', async () => {
    mockErc20ClaimsCall.mockResolvedValueOnce({ claimed: true })
    mockErc20ClaimsCall.mockResolvedValueOnce({ claimed: false })
    mockErc20ClaimsCall.mockRejectedValue(new Error('execution reverted'))

    jest
      .mocked(fetchWithTimeout)
      .mockResolvedValue(new Response(JSON.stringify({ result: { transactionHash: '0xHASH' } })))
    const contractAddress = '0xTEST'

    const result = await jumpstartLinkHandler(
      networkConfig.defaultNetworkId,
      contractAddress,
      privateKey,
      mockAccount2
    )

    expect(result).toEqual(['0xHASH'])
    expect(fetchWithTimeout).toHaveBeenCalledTimes(1)
    expect(fetchWithTimeout).toHaveBeenCalledWith(
      `https://api.alfajores.valora.xyz/walletJumpstart?index=1&beneficiary=${mockAccount}&signature=0xweb3-signature&sendTo=${mockAccount2}&assetType=erc20&networkId=celo-alfajores`,
      expect.any(Object),
      expect.any(Number)
    )
  })

  it('throws an error if all funds were already claimed', async () => {
    mockErc20ClaimsCall.mockResolvedValueOnce({ claimed: true })
    mockErc20ClaimsCall.mockResolvedValueOnce({ claimed: true })
    mockErc20ClaimsCall.mockRejectedValue(new Error('execution reverted'))

    await expect(
      jumpstartLinkHandler(networkConfig.defaultNetworkId, '0xTEST', privateKey, mockAccount2)
    ).rejects.toThrow('Already claimed all jumpstart rewards for celo-alfajores')

    expect(fetchWithTimeout).not.toHaveBeenCalled()
  })
})
