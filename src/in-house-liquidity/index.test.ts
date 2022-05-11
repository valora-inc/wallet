import {
  createPersonaAccount,
  signAndFetch,
  createLinkToken,
  createFinclusiveBankAccount,
  exchangePlaidAccessToken,
  verifyWalletAddress,
  getFinclusiveComplianceStatus,
} from 'src/in-house-liquidity'
import { FetchMock } from 'jest-fetch-mock/types'
import networkConfig from 'src/geth/networkConfig'
import { mockE164Number, mockAccount } from 'test/values'

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

  describe('createLinkToken', () => {
    it('calls the /plaid/link-token/create endpoint', async () => {
      mockFetch.mockResponseOnce(JSON.stringify({ linkToken: 'foo-token' }), { status: 201 })
      const linkToken = await createLinkToken({
        walletAddress: MOCK_USER.walletAddress,
        isAndroid: false,
        language: 'en',
        phoneNumber: mockE164Number,
      })
      const expectedBody = JSON.stringify({
        accountAddress: MOCK_USER.walletAddress,
        isAndroid: false,
        language: 'en',
        phoneNumber: mockE164Number,
      })

      // Calls Fetch Correctly
      expect(mockFetch).toHaveBeenCalledWith(
        `${networkConfig.inHouseLiquidityURL}/plaid/link-token/create`,
        {
          body: expectedBody,
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        }
      )
      // Returns the token
      expect(linkToken).toEqual('foo-token')
    })
  })
  describe('createFinclusiveBankAccount', () => {
    it('calls the /account/bank-account endpoint', async () => {
      mockFetch.mockResponseOnce(JSON.stringify({}), { status: 201 })
      const response = await createFinclusiveBankAccount({
        walletAddress: MOCK_USER.walletAddress,
        plaidAccessToken: 'foo',
      })
      const expectedBody = JSON.stringify({
        accountAddress: MOCK_USER.walletAddress,
        plaidAccessToken: 'foo',
      })

      // Calls Fetch Correctly
      expect(mockFetch).toHaveBeenCalledWith(
        `${networkConfig.inHouseLiquidityURL}/account/bank-account`,
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
  describe('exchangePlaidAccessToken', () => {
    it('calls the /account/bank-account endpoint', async () => {
      mockFetch.mockResponseOnce(JSON.stringify({ accessToken: 'bar-token' }), { status: 201 })
      const response = await exchangePlaidAccessToken({
        walletAddress: MOCK_USER.walletAddress,
        publicToken: 'foo',
      })
      const expectedBody = JSON.stringify({
        publicToken: 'foo',
        accountAddress: MOCK_USER.walletAddress,
      })

      // Calls Fetch Correctly
      expect(mockFetch).toHaveBeenCalledWith(
        `${networkConfig.inHouseLiquidityURL}/plaid/access-token/exchange`,
        {
          body: expectedBody,
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        }
      )
      // Returns the exchanged token
      expect(response).toEqual('bar-token')
    })
  })
  describe('getFinclusiveComplianceStatus', () => {
    it('calls the /account/{accoundAddress}/compliance-check-status endpoint', async () => {
      mockFetch.mockResponseOnce(JSON.stringify({ complianceCheckStatus: 1 }), { status: 200 })
      const response = await getFinclusiveComplianceStatus({
        walletAddress: MOCK_USER.walletAddress,
      })

      // Calls Fetch Correctly
      expect(mockFetch).toHaveBeenCalledWith(
        `${networkConfig.inHouseLiquidityURL}/account/${encodeURIComponent(
          MOCK_USER.walletAddress
        )}/compliance-check-status`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'GET',
        }
      )
      // Returns the exchanged token
      expect(response).toEqual(1)
    })
  })
})
