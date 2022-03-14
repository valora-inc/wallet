import {
  createPersonaAccount,
  signAndFetch,
  createLinkToken,
  createFinclusiveBankAccount,
  exchangePlaidAccessToken,
  getFinclusiveComplianceStatus,
} from 'src/in-house-liquidity'
import { FetchMock } from 'jest-fetch-mock/types'
import networkConfig from 'src/geth/networkConfig'
import { mockE164Number } from 'test/values'
import { GethNativeBridgeWallet } from '../geth/GethNativeBridgeWallet'

describe('In House Liquidity Calls', () => {
  const mockGetJWT = jest.fn().mockResolvedValue('mock_token')
  const MOCK_USER = {
    privateKey: 'c613bfdc491f266e35107050caedef9f1a9a01aff126b27ce620e10a7b859934',
    publicKey: '0359bf477833fa7fd48ffe95454dcc31134f11a39a6c01610041a37850d0ad16f5',
    walletAddress: '0x39845Bae1245693234dd32bA479828d5A42AD552',
    wallet: ({ getJWT: mockGetJWT } as unknown) as GethNativeBridgeWallet,
  }

  const mockFetch = fetch as FetchMock

  beforeAll(async () => {
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

  describe('signAndFetch', () => {
    it('calls fetch with the correct params', async () => {
      mockFetch.mockResponseOnce(JSON.stringify({}), { status: 201 })
      const body = { accountAddress: MOCK_USER.walletAddress }

      const response = await signAndFetch({
        path: '/persona/account/create',
        walletAddress: MOCK_USER.walletAddress,
        wallet: MOCK_USER.wallet,
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
            Authorization: 'Bearer mock_token',
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
        wallet: MOCK_USER.wallet,
      })
      const expectedBody = JSON.stringify({ accountAddress: MOCK_USER.walletAddress })

      // Calls Fetch Correctly
      expect(mockFetch).toHaveBeenCalledWith(
        `${networkConfig.inHouseLiquidityURL}/persona/account/create`,
        {
          body: expectedBody,
          headers: {
            Authorization: 'Bearer mock_token',
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
        wallet: MOCK_USER.wallet,
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
            Authorization: 'Bearer mock_token',
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
        wallet: MOCK_USER.wallet,
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
            Authorization: 'Bearer mock_token',
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
        wallet: MOCK_USER.wallet,
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
            Authorization: 'Bearer mock_token',
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
        jwt: 'mock_token',
      })

      // Calls Fetch Correctly
      expect(mockFetch).toHaveBeenCalledWith(
        `${networkConfig.inHouseLiquidityURL}/account/${encodeURIComponent(
          MOCK_USER.walletAddress
        )}/compliance-check-status`,
        {
          headers: {
            Authorization: 'Bearer mock_token',
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
