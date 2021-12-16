import { createPersonaAccount, getAuthAndDateHeaders, signAndFetch } from 'src/in-house-liquidity'
import { FetchMock } from 'jest-fetch-mock/types'
import { mockMnemonic } from 'test/values'
import * as signatureUtils from '@celo/utils/lib/signatureUtils'
import networkConfig from 'src/geth/networkConfig'

jest.mock('src/backup/utils', () => ({
  ...(jest.requireActual('src/backup/utils') as any),
  getStoredMnemonic: jest.fn(() => mockMnemonic),
}))

const signMessage = jest.spyOn(signatureUtils, 'signMessage')

const MOCK_USER = {
  walletAddress: '0x2Ec2c5D904ed2964F791aDA2185B9c2241C371c0',
  accountMTWAddress: '0x8b2f81f995c910aede52116406452468946d7d52',
  privateKey: '7241c1f13452c1990acc737228dd8d4873ccaf14287c8ee0a59cdb3e07d7526d',
  publicKey: '02a54b261ef5f8c8f97b8fe8d867d00dab35b5f7b39441691b05382b6d47bf709b',
}

jest.mock('@celo/utils/lib/account', () => {
  return {
    generateKeys: jest.fn(() => ({
      address: MOCK_USER.walletAddress,
      privateKey: MOCK_USER.privateKey,
      publicKey: MOCK_USER.publicKey,
    })),
  }
})

describe('In House Liquidity Calls', () => {
  const mockFetch = fetch as FetchMock

  const date = new Date('2021-05-14T11:01:58.135Z')
  const expectedDateString = date.toUTCString()

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
        MOCK_USER.accountMTWAddress
      )

      expect(headers).toMatchObject({
        Date: expectedDateString,
        Authorization: `Valora ${MOCK_USER.walletAddress}:0x1c8689cf5de841119091ef4f0c49170c4130909b402dfba1af7bcab4f047a5f23735d0fe8ab631804cd51a098bf335cd2a8243d94630435e6d854fc96998f8a313`,
      })
      expect(signMessage).toHaveBeenCalledWith(
        `get /account/foo ${expectedDateString}`,
        `0x${MOCK_USER.privateKey}`,
        MOCK_USER.walletAddress
      )
    })
    it('creates the correct headers for a POST request', async () => {
      const headers = await getAuthAndDateHeaders(
        'POST',
        '/account/foo/create',
        MOCK_USER.accountMTWAddress,
        JSON.stringify({ accountAddress: MOCK_USER.accountMTWAddress })
      )

      expect(headers).toMatchObject({
        Date: expectedDateString,
        Authorization: `Valora ${MOCK_USER.walletAddress}:0x1c64a765496054c906c5fa36c85a972c715e11e03d0c90920b07574b600ac9fce52c94000db0f1c4613028cde3bbc988639ca3acc0701b16e591e864d804b4651a`,
      })
      expect(signMessage).toHaveBeenCalledWith(
        `post /account/foo/create ${expectedDateString} ${JSON.stringify({
          accountAddress: MOCK_USER.accountMTWAddress,
        })}`,
        `0x${MOCK_USER.privateKey}`,
        MOCK_USER.walletAddress
      )
    })
  })
  describe('signAndFetch', () => {
    it('calls fetch and attaches the correct signature', async () => {
      mockFetch.mockResponseOnce(JSON.stringify({}), { status: 201 })
      const body = { accountAddress: MOCK_USER.accountMTWAddress }

      const response = await signAndFetch('/persona/account/create', MOCK_USER.accountMTWAddress, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      expect(mockFetch).toHaveBeenCalledWith(
        `${networkConfig.inhouseLiquditiyUrl}/persona/account/create`,
        {
          body: JSON.stringify(body),
          headers: {
            Date: expectedDateString,
            Authorization: `Valora ${MOCK_USER.walletAddress}:0x1c47a7f493f2bc8db86ab2c146ea4e136977c5930a18e6e79301c4915cfd8328d5063001b9e0791b4a7fb36da35f756829769a661d93df4a0e18513a43ede8f682`,
            'Content-Type': 'application/json',
          },
          method: 'POST',
        }
      )
      expect(signMessage).toHaveBeenCalledWith(
        `post /persona/account/create ${expectedDateString} ${JSON.stringify(body)}`,
        `0x${MOCK_USER.privateKey}`,
        MOCK_USER.walletAddress
      )
      expect(response).toBeInstanceOf(Response)
    })
  })

  describe('createPersonaAccount', () => {
    it('calls the /persona/account/create endpoint', async () => {
      mockFetch.mockResponseOnce(JSON.stringify({}), { status: 201 })
      const response = await createPersonaAccount(MOCK_USER.accountMTWAddress)
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
