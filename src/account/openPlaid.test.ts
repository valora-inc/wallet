import { LinkEventMetadata, LinkEventName, openLink } from 'react-native-plaid-link-sdk'
import { CICOEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { createLinkToken } from 'src/in-house-liquidity'
import { mockAccount } from 'test/values'
import openPlaid, { handleOnEvent } from './openPlaid'

jest.mock('react-native-plaid-link-sdk', () => ({
  ...(jest.requireActual('react-native-plaid-link-sdk') as any),
  openLink: jest.fn(),
}))

jest.mock('src/analytics/ValoraAnalytics')

jest.mock('src/in-house-liquidity', () => ({
  ...(jest.requireActual('src/in-house-liquidity') as any),
  createLinkToken: jest.fn(({ walletAddress }) => {
    if (walletAddress === 'bad-account') {
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
      walletAddress: mockAccount,
      locale: 'en-US',
      phoneNumber: MOCK_PHONE_NUMBER,
      onSuccess,
      onExit,
    })
    expect(createLinkToken).toHaveBeenCalledWith({
      walletAddress: mockAccount,
      isAndroid: true,
      language: 'en',
      phoneNumber: MOCK_PHONE_NUMBER,
    })

    expect(openLink).toHaveBeenCalledWith({
      tokenConfig: {
        token: 'foo',
        noLoadingState: false,
      },
      onExit: onExit,
      onSuccess: onSuccess,
    })
  })
  it('does not call openLink if IHL fails', async () => {
    await openPlaid({
      walletAddress: 'bad-account',
      locale: 'en-US',
      phoneNumber: MOCK_PHONE_NUMBER,
      onSuccess,
      onExit,
    })
    expect(createLinkToken).toHaveBeenCalledWith({
      walletAddress: 'bad-account',
      isAndroid: true,
      language: 'en',
      phoneNumber: MOCK_PHONE_NUMBER,
    })

    expect(openLink).not.toHaveBeenCalled()
  })
})

describe('handleOnEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const linkSessionId = '1234567'
  const institutionId = 'abcd'
  const institutionName = 'Chase Bank'
  const errorType = 'Network Error'
  const errorCode = '500'

  const eventMap: [LinkEventName, CICOEvents, any][] = [
    [LinkEventName.OPEN, CICOEvents.plaid_open_link_flow, { linkSessionId }],
    [
      LinkEventName.SELECT_INSTITUTION,
      CICOEvents.plaid_select_institution,
      { linkSessionId, institutionId, institutionName },
    ],
    [LinkEventName.SUBMIT_CREDENTIALS, CICOEvents.plaid_submit_credentials, { linkSessionId }],
    [LinkEventName.EXIT, CICOEvents.plaid_exit, { linkSessionId }],
    [LinkEventName.HANDOFF, CICOEvents.plaid_handoff, { linkSessionId }],
    [LinkEventName.ERROR, CICOEvents.plaid_error, { linkSessionId, errorCode, errorType }],
  ]

  it.each(eventMap)(
    'Logs the correct log for the cooresponding event',
    (eventName, analyticsEvent, analyticsMetadata) => {
      handleOnEvent({
        eventName,
        metadata: {
          linkSessionId,
          institutionId,
          institutionName,
          errorType,
          errorCode,
        } as LinkEventMetadata,
      })
      expect(ValoraAnalytics.track).toHaveBeenLastCalledWith(analyticsEvent, analyticsMetadata)
    }
  )
})
