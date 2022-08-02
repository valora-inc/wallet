import { signAndFetch, verifyWalletAddress, createPersonaAccount } from 'src/in-house-liquidity'
import { FetchMock } from 'jest-fetch-mock/types'
import networkConfig from 'src/web3/networkConfig'
import { mockAccount } from 'test/values'

const MOCK_USER = {
  walletAddress: mockAccount,
}

describe('In House Liquidity Calls', () => {
  const mockFetch = fetch as FetchMock

  beforeAll(() => {
    jest.useFakeTimers()
    jest.spyOn(Date, 'now').mockImplementation(() => 1641945400000)
  })

  afterAll(() => {
    jest.useRealTimers()
  })
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

  describe('signAndFetch', () => {
    it('calls fetch with the correct params', async () => {
      mockFetch.mockResponseOnce(JSON.stringify({}), { status: 201 })
      const body = { accountAddress: MOCK_USER.walletAddress }

      const response = await signAndFetch({
        path: '/persona/account/create',
        walletAddress: MOCK_USER.walletAddress,
        requestOptions: {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        },
      })

      // Calls fetch correctly
      expect(mockFetch).toHaveBeenCalledWith(
        `${networkConfig.inHouseLiquidityURL}/persona/account/create`,
        {
          body: JSON.stringify(body),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        }
      )

      // Returns the response object
      expect(response).toBeInstanceOf(Response)
    })
  })
})
