import { getDynamicConfigParams } from 'src/statsig'
import Logger from 'src/utils/Logger'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import { mockAccount, mockAccount2 } from 'test/values'
import { jumpstartLinkHandler } from './jumpstartLinkHandler'

jest.mock('src/web3/providers')
jest.mock('src/web3/utils', () => ({
  ...(jest.requireActual('src/web3/utils') as any),
  getContract: jest.fn().mockImplementation(() => ({
    methods: {
      erc20Claims: (_: string, index: number) => ({
        call: () => {
          if (index === 0) {
            return { claimed: true }
          } else if (index === 1) {
            return { claimed: false }
          } else {
            throw new Error('execution reverted')
          }
        },
      }),
      erc721Claims: () => ({
        call: () => {
          throw new Error('execution reverted')
        },
      }),
    },
  })),
}))
jest.mock('src/utils/fetchWithTimeout')
jest.mock('src/statsig')
jest.mock('src/utils/Logger')

describe('jumpstartLinkHandler', () => {
  const privateKey = '0x1234567890abcdef'

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('calls executeClaims with correct parameters', async () => {
    ;(fetchWithTimeout as jest.Mock).mockImplementation(() => ({
      ok: true,
    }))
    jest.mocked(getDynamicConfigParams).mockReturnValue({ celo: { contractAddress: '0xTEST' } })

    await jumpstartLinkHandler(privateKey, mockAccount2)

    expect(fetchWithTimeout).toHaveBeenCalledTimes(1)
    expect(fetchWithTimeout).toHaveBeenCalledWith(
      `https://api.alfajores.valora.xyz/walletJumpstart?index=1&beneficiary=${mockAccount}&signature=0xweb3-signature&sendTo=${mockAccount2}&assetType=erc20`,
      expect.any(Object),
      expect.any(Number)
    )
  })

  it('fails when contract address is not provided in dynamic config', async () => {
    jest.mocked(getDynamicConfigParams).mockReturnValue({})

    await jumpstartLinkHandler(privateKey, mockAccount2)

    expect(fetchWithTimeout).not.toHaveBeenCalled()
    expect(Logger.error).toHaveBeenCalled()
  })
})
