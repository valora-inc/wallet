import { openLink } from 'react-native-plaid-link-sdk'
import { mockAccount, mockPrivateDEK } from 'test/values'
import openPlaid from './openPlaid'
import { createLinkToken } from 'src/in-house-liquidity'

jest.mock('react-native-plaid-link-sdk', () => ({
  openLink: jest.fn(),
}))

jest.mock('src/in-house-liquidity', () => ({
  createLinkToken: jest.fn(({ accountMTWAddress }) => {
    if (accountMTWAddress === 'bad-account') {
      throw new Error('It failed')
    }
    return Promise.resolve('foo')
  }),
}))

const MOCK_PHONE_NUMBER = '+18487623478'

const onSuccess = jest.fn()
const onExit = jest.fn()

describe('openPlaid', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls IHL and openLink', async () => {
    await openPlaid({
      accountMTWAddress: mockAccount,
      locale: 'en-US',
      phoneNumber: MOCK_PHONE_NUMBER,
      dekPrivate: mockPrivateDEK,
      onSuccess,
      onExit,
    })
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
      onExit: onExit,
      onSuccess: onSuccess,
    })
  })
  it('does not call openLink if IHL fails', async () => {
    await openPlaid({
      accountMTWAddress: 'bad-account',
      locale: 'en-US',
      phoneNumber: MOCK_PHONE_NUMBER,
      dekPrivate: mockPrivateDEK,
      onSuccess,
      onExit,
    })
    expect(createLinkToken).toHaveBeenCalledWith({
      accountMTWAddress: 'bad-account',
      isAndroid: true,
      language: 'en',
      phoneNumber: MOCK_PHONE_NUMBER,
      dekPrivate: mockPrivateDEK,
    })

    expect(openLink).not.toHaveBeenCalled()
  })
})
