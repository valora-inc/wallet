import { FetchMock } from 'jest-fetch-mock/types'
import { createPersonaAccount, verifyWalletAddress } from 'src/in-house-liquidity'
import networkConfig from 'src/web3/networkConfig'
import { mockAccount } from 'test/values'

const mockFetch = fetch as FetchMock

jest.mock('src/in-house-liquidity/client', () => ({
  getClient: jest.fn(() => ({
    fetch: jest.fn(mockFetch),
  })),
}))

const MOCK_USER = {
  walletAddress: mockAccount,
}

describe('In House Liquidity Calls', () => {
  beforeEach(() => {
    mockFetch.resetMocks()
    jest.clearAllMocks()
  })

  describe('createPersonaAccount', () => {
    it('calls the /persona/account/create endpoint', async () => {
      mockFetch.mockResponseOnce(JSON.stringify({}), { status: 201 })
      const response = await createPersonaAccount({
        walletAddress: MOCK_USER.walletAddress,
      })
      const expectedBody = JSON.stringify({ accountAddress: MOCK_USER.walletAddress })

      // Calls Fetch Correctly
      expect(mockFetch).toHaveBeenCalledWith(
        `${networkConfig.inHouseLiquidityURL}/persona/account/create`,
        {
          body: expectedBody,
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        }
      )
      // Returns nothing
      expect(response).toEqual(undefined)
    })
  })

  describe('verifyWalletAddress', () => {
    it('throws when walletAddress is null', () => {
      expect(() =>
        verifyWalletAddress({
          walletAddress: null,
        })
      ).toThrow('Cannot call IHL because walletAddress is null')
    })
  })
})
