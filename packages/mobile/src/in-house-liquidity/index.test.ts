import {
  createPersonaAccount,
  getAuthHeader,
  signAndFetch,
  createLinkToken,
  createFinclusiveBankAccount,
  exchangePlaidAccessToken,
  verifyDekAndMTW,
  getFinclusiveComplianceStatus,
} from 'src/in-house-liquidity'
import { FetchMock } from 'jest-fetch-mock/types'
import networkConfig from 'src/geth/networkConfig'
import { mockE164Number } from 'test/values'
import jwt from 'jsonwebtoken'

const MOCK_USER = {
  accountMTWAddress: '0xc549560d398567d6ff75fde721b1488348df86dc',
  dekPrivate: '0x5776c418c5f63c5d149a4605c9fa6e0a1bd684a17f1b7ec563515dd4a13a8a3c',
  dekPublicHex: '0x034e229e9b6503e42ac456fce7ef5c28230eedf8dd6f65c2806af3291ba107d354',
  dekPublicPem:
    '-----BEGIN PUBLIC KEY-----\nMDYwEAYHKoZIzj0CAQYFK4EEAAoDIgADTiKem2UD5CrEVvzn71woIw7t+N1vZcKA\navMpG6EH01Q=\n-----END PUBLIC KEY-----',
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

  const expectedJWTHeader = `eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9` // encoded version of {"alg": "ES256", "typ": "JWT"}
  const expectedJWTPayload = `eyJpc3MiOiItLS0tLUJFR0lOIFBVQkxJQyBLRVktLS0tLVxuTURZd0VBWUhLb1pJemowQ0FRWUZLNEVFQUFvRElnQURUaUtlbTJVRDVDckVWdnpuNzF3b0l3N3QrTjF2WmNLQVxuYXZNcEc2RUgwMVE9XG4tLS0tLUVORCBQVUJMSUMgS0VZLS0tLS0iLCJzdWIiOiIweGM1NDk1NjBkMzk4NTY3ZDZmZjc1ZmRlNzIxYjE0ODgzNDhkZjg2ZGMiLCJpYXQiOjE2NDE5NDU0MDAsImV4cCI6MTY0MTk0NTcwMH0` // encoded version of {"iss": "-----BEGIN PUBLIC KEY-----\nMDYwEAYHKoZIzj0CAQYFK4EEAAoDIgADTiKem2UD5CrEVvzn71woIw7t+N1vZcKA\navMpG6EH01Q=\n-----END PUBLIC KEY-----", "sub": "0xc549560d398567d6ff75fde721b1488348df86dc", "iat": 1641945400, "exp": 1641945700}
  const expectedAuthHeaderPrefix = `Bearer ${expectedJWTHeader}.${expectedJWTPayload}.`

  describe('getAuthHeader', () => {
    it('creates the correct headers for a GET request', async () => {
      const authHeader = await getAuthHeader({
        accountMTWAddress: MOCK_USER.accountMTWAddress,
        dekPrivate: MOCK_USER.dekPrivate,
      })

      // verify header and payload
      expect(authHeader).toContain(expectedAuthHeaderPrefix)

      // verify signature (non-deterministic, so a fixed value cannot be used)
      const token = authHeader.split(' ')[1]
      expect(jwt.verify(token, MOCK_USER.dekPublicPem, { algorithms: ['ES256'] })).toBeTruthy()
    })
  })

  describe('verifyDekAndMTW', () => {
    it('throws when dekPrivate is null', () => {
      expect(() =>
        verifyDekAndMTW({
          accountMTWAddress: MOCK_USER.accountMTWAddress,
          dekPrivate: null,
        })
      ).toThrow('Cannot call IHL because dekPrivate is null')
    })
    it('throws when accountMTWAddress is null', () => {
      expect(() =>
        verifyDekAndMTW({
          accountMTWAddress: null,
          dekPrivate: MOCK_USER.dekPrivate,
        })
      ).toThrow('Cannot call IHL because accountMTWAddress is null')
    })
  })

  describe('signAndFetch', () => {
    it('calls fetch with the correct params', async () => {
      mockFetch.mockResponseOnce(JSON.stringify({}), { status: 201 })
      const body = { accountAddress: MOCK_USER.accountMTWAddress }

      const response = await signAndFetch({
        path: '/persona/account/create',
        accountMTWAddress: MOCK_USER.accountMTWAddress,
        dekPrivate: MOCK_USER.dekPrivate,
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
            Authorization: expect.stringContaining(expectedAuthHeaderPrefix),
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
        accountMTWAddress: MOCK_USER.accountMTWAddress,
        dekPrivate: MOCK_USER.dekPrivate,
      })
      const expectedBody = JSON.stringify({ accountAddress: MOCK_USER.accountMTWAddress })

      // Calls Fetch Correctly
      expect(mockFetch).toHaveBeenCalledWith(
        `${networkConfig.inHouseLiquidityURL}/persona/account/create`,
        {
          body: expectedBody,
          headers: {
            Authorization: expect.stringContaining(expectedAuthHeaderPrefix),
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
        accountMTWAddress: MOCK_USER.accountMTWAddress,
        dekPrivate: MOCK_USER.dekPrivate,
        isAndroid: false,
        language: 'en',
        phoneNumber: mockE164Number,
      })
      const expectedBody = JSON.stringify({
        accountAddress: MOCK_USER.accountMTWAddress,
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
            Authorization: expect.stringContaining(expectedAuthHeaderPrefix),
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
        accountMTWAddress: MOCK_USER.accountMTWAddress,
        dekPrivate: MOCK_USER.dekPrivate,
        plaidAccessToken: 'foo',
      })
      const expectedBody = JSON.stringify({
        accountAddress: MOCK_USER.accountMTWAddress,
        plaidAccessToken: 'foo',
      })

      // Calls Fetch Correctly
      expect(mockFetch).toHaveBeenCalledWith(
        `${networkConfig.inHouseLiquidityURL}/account/bank-account`,
        {
          body: expectedBody,
          headers: {
            Authorization: expect.stringContaining(expectedAuthHeaderPrefix),
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
        accountMTWAddress: MOCK_USER.accountMTWAddress,
        dekPrivate: MOCK_USER.dekPrivate,
        publicToken: 'foo',
      })
      const expectedBody = JSON.stringify({
        publicToken: 'foo',
        accountAddress: MOCK_USER.accountMTWAddress,
      })

      // Calls Fetch Correctly
      expect(mockFetch).toHaveBeenCalledWith(
        `${networkConfig.inHouseLiquidityURL}/plaid/access-token/exchange`,
        {
          body: expectedBody,
          headers: {
            Authorization: expect.stringContaining(expectedAuthHeaderPrefix),
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
        accountMTWAddress: MOCK_USER.accountMTWAddress,
        dekPrivate: MOCK_USER.dekPrivate,
      })

      // Calls Fetch Correctly
      expect(mockFetch).toHaveBeenCalledWith(
        `${networkConfig.inHouseLiquidityURL}/account/${encodeURIComponent(
          MOCK_USER.accountMTWAddress
        )}/compliance-check-status`,
        {
          headers: {
            Authorization: expect.stringContaining(expectedAuthHeaderPrefix),
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
