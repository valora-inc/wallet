import { createPersonaAccount } from 'src/inHouseLiquidity'
import { FetchMock } from 'jest-fetch-mock/types'
import { mockMnemonic, mockAccount } from 'test/values'
import networkConfig from 'src/geth/networkConfig'

jest.mock('src/backup/utils', () => ({
  ...(jest.requireActual('src/backup/utils') as any),
  getStoredMnemonic: jest.fn(() => mockMnemonic),
}))

jest.mock('@celo/utils/lib/signatureUtils', () => {
  const mockSignMessage = jest.fn(() => 'fake signature')
  const mockSerializeSignature = jest.fn(() => 'fake serialized signature')
  return {
    serializeSignature: mockSerializeSignature,
    signMessage: mockSignMessage,
  }
})

const expectedHeaders = {
  'Content-Type': 'application/json',
  authorization: 'Valora 0x0000000000000000000000000000000000007E57:fake serialized signature',
}

describe('In House Liquidity Calls', () => {
  const mockFetch = fetch as FetchMock

  beforeEach(() => {
    mockFetch.resetMocks()
  })

  describe('createPersonaAccount', () => {
    it('calls the /persona/account/create endpoint', async () => {
      mockFetch.mockResponseOnce(JSON.stringify({}), { status: 201 })
      const response = await createPersonaAccount(mockAccount)

      expect(mockFetch).toHaveBeenCalledWith(
        `${networkConfig.inhouseLiquditiyUrl}/persona/account/create`,
        {
          body: JSON.stringify({ accountMTWAddress: mockAccount }),
          headers: expectedHeaders,
          method: 'POST',
        }
      )
      expect(response).toBeInstanceOf(Response)
    })
  })
})
