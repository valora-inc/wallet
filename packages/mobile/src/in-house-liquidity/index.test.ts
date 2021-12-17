import { createPersonaAccount, getAuthAndDateHeaders, signAndFetch } from 'src/in-house-liquidity'
import { FetchMock } from 'jest-fetch-mock/types'
import * as dataEncryptionKey from 'src/web3/dataEncryptionKey'
import networkConfig from 'src/geth/networkConfig'

const signWithDEK = jest.spyOn(dataEncryptionKey, 'signWithDEK')

const MOCK_USER = {
  walletAddress: '0x2Ec2c5D904ed2964F791aDA2185B9c2241C371c0',
  accountMTWAddress: '0x8b2f81f995c910aede52116406452468946d7d52',
  dataEncryptionKey: '0x0287d1ab6da9ee77a6743ce30936f0bd28d7f197b466d47871e207c3417db91b3b',
}

jest.mock('src/web3/contracts', () => ({
  getContractKitAsync: jest.fn(() => ({
    contracts: {
      getAccounts: jest.fn(() => ({
        getDataEncryptionKey: jest.fn(() => MOCK_USER.dataEncryptionKey),
      })),
    },
  })),
}))

describe('In House Liquidity Calls', () => {
  const mockFetch = fetch as FetchMock

  const date = new Date('2021-05-14T11:01:58.135Z')
  const expectedDateString = date.toUTCString()

  beforeEach(() => {
    mockFetch.resetMocks()
    jest.clearAllMocks()
  })

  describe('getAuthAndDateHeaders', () => {
    it('creates the correct headers for a GET request', async () => {
      const headers = await getAuthAndDateHeaders({
        httpVerb: 'GET',
        date,
        requestPath: '/account/foo',
        accountMTWAddress: MOCK_USER.accountMTWAddress,
        walletAddress: MOCK_USER.walletAddress,
      })

      // Creates the correct Headers
      expect(headers).toMatchObject({
        Date: expectedDateString,
        Authorization: expect.stringContaining(`Valora ${MOCK_USER.walletAddress}:`),
      })

      // Calls signMessage with the expected parameters
      expect(signWithDEK).toHaveBeenCalledWith({
        message: `get /account/foo ${expectedDateString}`,
        dataEncryptionKey: MOCK_USER.dataEncryptionKey,
      })
    })
    it('creates the correct headers for a POST request', async () => {
      const headers = await getAuthAndDateHeaders({
        httpVerb: 'POST',
        requestPath: '/account/foo/create',
        date,
        accountMTWAddress: MOCK_USER.accountMTWAddress,
        walletAddress: MOCK_USER.walletAddress,
        requestBody: JSON.stringify({ accountAddress: MOCK_USER.accountMTWAddress }),
      })
      // Creates the correct Headers
      expect(headers).toMatchObject({
        Date: expectedDateString,
        Authorization: expect.stringContaining(`Valora ${MOCK_USER.walletAddress}:`),
      })

      // Calls signMessage with the expected parameters
      expect(signWithDEK).toHaveBeenCalledWith({
        message: `post /account/foo/create ${expectedDateString} ${JSON.stringify({
          accountAddress: MOCK_USER.accountMTWAddress,
        })}`,
        dataEncryptionKey: MOCK_USER.dataEncryptionKey,
      })
    })
  })
  describe('signAndFetch', () => {
    it('calls fetch with the correct params', async () => {
      mockFetch.mockResponseOnce(JSON.stringify({}), { status: 201 })
      const body = { accountAddress: MOCK_USER.accountMTWAddress }

      const response = await signAndFetch({
        path: '/persona/account/create',
        accountMTWAddress: MOCK_USER.accountMTWAddress,
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
            Date: expect.anything(),
            Authorization: expect.stringContaining(`Valora ${MOCK_USER.walletAddress}:`),
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
        walletAddress: MOCK_USER.walletAddress,
      })
      const expectedBody = JSON.stringify({ accountAddress: MOCK_USER.accountMTWAddress })

      // Calls Fetch Correctly
      expect(mockFetch).toHaveBeenCalledWith(
        `${networkConfig.inHouseLiquidityURL}/persona/account/create`,
        {
          body: expectedBody,
          headers: {
            Date: expect.anything(),
            Authorization: expect.stringContaining(`Valora ${MOCK_USER.walletAddress}:`),
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
