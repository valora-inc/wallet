import { createPersonaAccount, getAuthAndDateHeaders, signAndFetch } from 'src/in-house-liquidity'
import { FetchMock } from 'jest-fetch-mock/types'
import * as odisUtils from '@celo/identity/lib/odis/query'
import networkConfig from 'src/geth/networkConfig'

const signWithDEK = jest.spyOn(odisUtils, 'signWithDEK')

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

  const expectedSigner: odisUtils.EncryptionKeySigner = {
    authenticationMethod: odisUtils.AuthenticationMethod.ENCRYPTION_KEY,
    rawKey: MOCK_USER.dataEncryptionKey,
  }

  beforeEach(() => {
    mockFetch.resetMocks()
    jest.spyOn(global, 'Date').mockImplementationOnce(() => date as any)
    jest.clearAllMocks()
  })

  describe('getAuthAndDateHeaders', () => {
    it('creates the correct headers for a GET request', async () => {
      const headers = await getAuthAndDateHeaders(
        'GET',
        '/account/foo',
        MOCK_USER.accountMTWAddress,
        MOCK_USER.walletAddress
      )

      // Creates the correct Headers
      expect(headers).toMatchObject({
        Date: expectedDateString,
        Authorization: expect.stringContaining(`Valora ${MOCK_USER.walletAddress}:`),
      })

      // Calls signMessage with the expected parameters
      expect(signWithDEK).toHaveBeenCalledWith(
        `get /account/foo ${expectedDateString}`,
        expectedSigner
      )
    })
    it('creates the correct headers for a POST request', async () => {
      const headers = await getAuthAndDateHeaders(
        'POST',
        '/account/foo/create',
        MOCK_USER.accountMTWAddress,
        MOCK_USER.walletAddress,
        JSON.stringify({ accountAddress: MOCK_USER.accountMTWAddress })
      )
      // Creates the correct Headers
      expect(headers).toMatchObject({
        Date: expectedDateString,
        Authorization: expect.stringContaining(`Valora ${MOCK_USER.walletAddress}:`),
      })

      // Calls signMessage with the expected parameters
      expect(signWithDEK).toHaveBeenCalledWith(
        `post /account/foo/create ${expectedDateString} ${JSON.stringify({
          accountAddress: MOCK_USER.accountMTWAddress,
        })}`,
        expectedSigner
      )
    })
  })
  describe('signAndFetch', () => {
    it('calls fetch and attaches the correct signature', async () => {
      mockFetch.mockResponseOnce(JSON.stringify({}), { status: 201 })
      const body = { accountAddress: MOCK_USER.accountMTWAddress }

      const response = await signAndFetch(
        '/persona/account/create',
        MOCK_USER.accountMTWAddress,
        MOCK_USER.walletAddress,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      )

      // Calls fetch correctly
      expect(mockFetch).toHaveBeenCalledWith(
        `${networkConfig.inhouseLiquditiyUrl}/persona/account/create`,
        {
          body: JSON.stringify(body),
          headers: {
            Date: expectedDateString,
            Authorization: expect.stringContaining(`Valora ${MOCK_USER.walletAddress}:`),
            'Content-Type': 'application/json',
          },
          method: 'POST',
        }
      )

      // Calls signMessage witht the expected parameters
      expect(signWithDEK).toHaveBeenCalledWith(
        `post /persona/account/create ${expectedDateString} ${JSON.stringify(body)}`,
        expectedSigner
      )

      // Returns the response object
      expect(response).toBeInstanceOf(Response)
    })
  })

  describe('createPersonaAccount', () => {
    it('calls the /persona/account/create endpoint', async () => {
      mockFetch.mockResponseOnce(JSON.stringify({}), { status: 201 })
      const response = await createPersonaAccount(
        MOCK_USER.accountMTWAddress,
        MOCK_USER.walletAddress
      )
      const expectedBody = JSON.stringify({ accountAddress: MOCK_USER.accountMTWAddress })

      // Calls Fetch Correctly
      expect(mockFetch).toHaveBeenCalledWith(
        `${networkConfig.inhouseLiquditiyUrl}/persona/account/create`,
        {
          body: expectedBody,
          headers: {
            Date: expectedDateString,
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
