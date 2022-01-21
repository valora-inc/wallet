import { store } from 'src/redux/store'
import { createMockStore } from 'test/utils'
import { openLink } from 'react-native-plaid-link-sdk'
import { mockAccount, mockAccount2, mockPrivateDEK } from 'test/values'
import openPlaid from './openPlaid'
import { createLinkToken } from 'src/in-house-liquidity'

const mockSuccessResponse = new Response(JSON.stringify({ linkToken: 'foo' }), { status: 200 })
const mockFailResponse = new Response(null, { status: 404 })

jest.mock('react-native-plaid-link-sdk', () => ({
  openLink: jest.fn(),
}))

jest.mock('src/in-house-liquidity', () => ({
  createLinkToken: jest.fn(({ accountMTWAddress }) => {
    if (accountMTWAddress === 'bad-account') {
      return mockFailResponse
    }
    return mockSuccessResponse
  }),
}))

const MOCK_PHONE_NUMBER = '+18487623478'

const mockStore = {
  web3: {
    mtwAddress: mockAccount,
    account: mockAccount2,
    dataEncryptionKey: mockPrivateDEK,
  },
  i18n: {
    language: 'en-US',
  },
  account: {
    e164PhoneNumber: MOCK_PHONE_NUMBER,
  },
}

describe('openPlaid', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  it('calls IHL and openLink when pressed', async () => {
    jest.doMock('src/redux/store', () => ({
      store: createMockStore(mockStore),
      __esModule: true,
    }))
    await import('src/redux/store')
    await openPlaid()

    expect(createLinkToken).toHaveBeenCalledWith({
      accountMTWAddress: mockAccount,
      isAndroid: true,
      language: 'en',
      phoneNumber: MOCK_PHONE_NUMBER,
      dekPrivate: mockPrivateDEK,
    })

    expect(openLink).toHaveBeenCalledWith({
      tokenConfig: {
        token: 'foo',
      },
      onExit: expect.anything(),
      onSuccess: expect.anything(),
    })
  })
})
