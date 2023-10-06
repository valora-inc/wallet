import * as DEK from '@celo/cryptographic-utils/lib/dataEncryptionKey'
import { BIOMETRY_TYPE } from 'react-native-keychain'
import * as RNLocalize from 'react-native-localize'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { EffectProviders, StaticProvider } from 'redux-saga-test-plan/providers'
import { call, select } from 'redux-saga/effects'
import { AppEvents, InviteEvents } from 'src/analytics/Events'
import { HooksEnablePreviewOrigin, WalletConnectPairingOrigin } from 'src/analytics/types'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import {
  appLock,
  inAppReviewRequested,
  inviteLinkConsumed,
  openDeepLink,
  openUrl,
  setAppState,
  setSupportedBiometryType,
} from 'src/app/actions'
import {
  appInit,
  handleDeepLink,
  handleOpenUrl,
  handleSetAppState,
  requestInAppReview,
} from 'src/app/saga'
import {
  getLastTimeBackgrounded,
  getRequirePinOnAppOpen,
  inAppReviewLastInteractionTimestampSelector,
  sentryNetworkErrorsSelector,
} from 'src/app/selectors'
import { handleDappkitDeepLink } from 'src/dappkit/dappkit'
import { activeDappSelector } from 'src/dapps/selectors'
import { FiatExchangeFlow } from 'src/fiatExchanges/utils'
import { resolveDynamicLink } from 'src/firebase/firebase'
import { initI18n } from 'src/i18n'
import {
  allowOtaTranslationsSelector,
  currentLanguageSelector,
  otaTranslationsAppVersionSelector,
} from 'src/i18n/selectors'
import { jumpstartLinkHandler } from 'src/jumpstart/jumpstartLinkHandler'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { handleEnableHooksPreviewDeepLink } from 'src/positions/saga'
import { allowHooksPreviewSelector } from 'src/positions/selectors'
import { handlePaymentDeeplink } from 'src/send/utils'
import { initializeSentry } from 'src/sentry/Sentry'
import { getFeatureGate, patchUpdateStatsigUser } from 'src/statsig'
import { navigateToURI } from 'src/utils/linking'
import Logger from 'src/utils/Logger'
import { ONE_DAY_IN_MILLIS } from 'src/utils/time'
import { initialiseWalletConnect } from 'src/walletConnect/saga'
import { selectHasPendingState } from 'src/walletConnect/selectors'
import { WalletConnectRequestType } from 'src/walletConnect/types'
import { handleWalletConnectDeepLink } from 'src/walletConnect/walletConnect'
import { walletAddressSelector } from 'src/web3/selectors'
import { createMockStore } from 'test/utils'

jest.mock('src/dappkit/dappkit')
jest.mock('src/analytics/ValoraAnalytics')
jest.mock('src/sentry/Sentry')
jest.mock('src/sentry/SentryTransactionHub')
jest.mock('src/statsig')
jest.mock('src/jumpstart/jumpstartLinkHandler')
jest.mock('src/positions/saga')
jest.mock('react-native-in-app-review', () => ({
  RequestInAppReview: () => mockRequestInAppReview(),
  isAvailable: () => mockIsInAppReviewAvailable(),
}))

const mockRequestInAppReview = jest.fn()
const mockIsInAppReviewAvailable = jest.fn()

jest.unmock('src/pincode/authentication')

jest.mock('src/i18n', () => ({
  ...(jest.requireActual('src/i18n') as any),
  initI18n: jest.fn().mockResolvedValue(jest.fn()),
  t: jest.fn(),
}))

jest.mock('src/utils/Logger')

const mockedDEK = jest.mocked(DEK)
mockedDEK.compressedPubKey = jest.fn().mockReturnValue('publicKeyForUser')

describe('handleDeepLink', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('Handles Dappkit deep link', async () => {
    const deepLink = 'celo://wallet/dappkit?abcdsa'
    await expectSaga(handleDeepLink, openDeepLink(deepLink)).run()
    expect(handleDappkitDeepLink).toHaveBeenCalledWith(deepLink)
  })

  it('Handles payment deep link', async () => {
    const data = {
      address: '0xf7f551752A78Ce650385B58364225e5ec18D96cB',
      displayName: 'Super 8',
      currencyCode: 'PHP',
      amount: '500',
      comment: '92a53156-c0f2-11ea-b3de-0242ac13000',
    }

    const params = new URLSearchParams(data)
    const deepLink = `celo://wallet/pay?${params.toString()}`

    await expectSaga(handleDeepLink, openDeepLink(deepLink))
      .provide([[matchers.call.fn(handlePaymentDeeplink), deepLink]])
      .run()
  })

  it('Handles cash in deep link', async () => {
    const deepLink = 'celo://wallet/cashIn'
    await expectSaga(handleDeepLink, openDeepLink(deepLink)).run()
    expect(navigate).toHaveBeenCalledWith(Screens.FiatExchangeCurrency, {
      flow: FiatExchangeFlow.CashIn,
    })
  })

  it('Handles Bidali deep link', async () => {
    const deepLink = 'celo://wallet/bidali'
    await expectSaga(handleDeepLink, openDeepLink(deepLink)).run()
    expect(navigate).toHaveBeenCalledWith(Screens.BidaliScreen, { currency: undefined })
  })

  it('Handles cash-in-success deep link', async () => {
    const deepLink = 'celo://wallet/cash-in-success/simplex'
    await expectSaga(handleDeepLink, openDeepLink(deepLink)).run()
    expect(navigate).toHaveBeenCalledWith(Screens.CashInSuccess, { provider: 'simplex' })
  })

  it('Handles cash-in-success deep link with query params', async () => {
    const deepLink = 'celo://wallet/cash-in-success/simplex?isApproved=true'
    await expectSaga(handleDeepLink, openDeepLink(deepLink)).run()
    expect(navigate).toHaveBeenCalledWith(Screens.CashInSuccess, { provider: 'simplex' })
  })

  it('Handles openScreen deep link with safe origin', async () => {
    const deepLink = `celo://wallet/openScreen?screen=${Screens.FiatExchangeCurrency}&flow=CashIn`
    await expectSaga(handleDeepLink, openDeepLink(deepLink, true)).run()
    expect(navigate).toHaveBeenCalledWith(
      Screens.FiatExchangeCurrency,
      expect.objectContaining({ flow: FiatExchangeFlow.CashIn })
    )
  })

  it('Handles openScreen deep link without safe origin', async () => {
    const deepLink = `celo://wallet/openScreen?screen=${Screens.FiatExchangeCurrency}&flow=CashIn`
    await expectSaga(handleDeepLink, openDeepLink(deepLink, false)).run()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('Handles long share deep link', async () => {
    const deepLink = 'https://celo.org/share/abc123'
    await expectSaga(handleDeepLink, openDeepLink(deepLink)).put(inviteLinkConsumed('abc123')).run()

    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(InviteEvents.opened_via_invite_url, {
      inviterAddress: 'abc123',
    })
  })

  it('Handles short share deep link', async () => {
    const deepLink = 'https://vlra.app/someShortLink'
    await expectSaga(handleDeepLink, openDeepLink(deepLink))
      .provide([[call(resolveDynamicLink, deepLink), 'https://celo.org/share/abc123']])
      .put(inviteLinkConsumed('abc123'))
      .run()

    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(InviteEvents.opened_via_invite_url, {
      inviterAddress: 'abc123',
    })
  })

  it('Handles jumpstart links', async () => {
    const deepLink = 'celo://wallet/jumpstart/0xPrivateKey'
    await expectSaga(handleDeepLink, openDeepLink(deepLink))
      .provide([[select(walletAddressSelector), '0xwallet']])
      .run()

    expect(jumpstartLinkHandler).toHaveBeenCalledWith('0xPrivateKey', '0xwallet')
  })

  it('Handles hooks enable preview links', async () => {
    const deepLink = 'celo://wallet/hooks/enablePreview?hooksApiUrl=https://192.168.0.42:18000'
    await expectSaga(handleDeepLink, openDeepLink(deepLink))
      .provide([[select(allowHooksPreviewSelector), true]])
      .run()

    expect(handleEnableHooksPreviewDeepLink).toHaveBeenCalledWith(
      deepLink,
      HooksEnablePreviewOrigin.Deeplink
    )
  })
})

describe('WalletConnect deeplinks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const connectionString = encodeURIComponent(
    'wc:79a02f869d0f921e435a5e0643304548ebfa4a0430f9c66fe8b1a9254db7ef77@2?relay-protocol=irn&symKey=f661b0a9316a4ce0b6892bdce42bea0f45037f2c1bee9e118a3a4bc868a32a39'
  )
  const connectionLinks = [
    {
      name: 'Android',
      link: connectionString,
    },
    {
      name: 'iOS deeplink',
      link: `celo://wallet/wc?uri=${connectionString}`,
    },
    {
      name: 'iOS universal link',
      link: `https://valoraapp.com/wc?uri=${connectionString}`,
    },
  ]

  it('handles loading time out for a deep link', async () => {
    await expectSaga(handleDeepLink, openDeepLink(connectionLinks[0].link))
      .provide([
        [select(selectHasPendingState), false],
        [select(activeDappSelector), null],
        {
          race: () => ({ timedOut: true }),
        },
      ])
      .call(handleWalletConnectDeepLink, connectionLinks[0].link)
      .run()

    expect(navigate).toHaveBeenNthCalledWith(1, Screens.WalletConnectRequest, {
      type: WalletConnectRequestType.Loading,
      origin: WalletConnectPairingOrigin.Deeplink,
    })
    expect(navigate).toHaveBeenNthCalledWith(2, Screens.WalletConnectRequest, {
      type: WalletConnectRequestType.TimeOut,
    })
  })

  for (const { name, link } of connectionLinks) {
    it(`handles ${name} connection links correctly`, async () => {
      await expectSaga(handleDeepLink, openDeepLink(link))
        .provide([
          [select(selectHasPendingState), false],
          {
            race: () => ({ timedOut: false }),
          },
        ])
        .call(handleWalletConnectDeepLink, link)
        .call(
          initialiseWalletConnect,
          decodeURIComponent(connectionString),
          WalletConnectPairingOrigin.Deeplink
        )
        .run()
      expect(navigate).toHaveBeenCalledWith(Screens.WalletConnectRequest, {
        type: WalletConnectRequestType.Loading,
        origin: WalletConnectPairingOrigin.Deeplink,
      })
    })

    it(`handles ${name} connection links correctly when there's a pending request`, async () => {
      await expectSaga(handleDeepLink, openDeepLink(link))
        .provide([
          [select(selectHasPendingState), true],
          {
            race: () => ({ timedOut: false }),
          },
        ])
        .call(handleWalletConnectDeepLink, link)
        .call(
          initialiseWalletConnect,
          decodeURIComponent(connectionString),
          WalletConnectPairingOrigin.Deeplink
        )
        .run()
      expect(navigate).not.toHaveBeenCalled()
    })
  }

  // action requests are incomplete URLs, wallets should handle presenting
  // the user with the request.
  const actionString = 'wc:1234'
  const actionLinks = [
    { name: 'Android', link: actionString },
    { name: 'iOS deeplink', link: `celo://wallet/wc?uri=${actionString}` },
    { name: 'iOS universal link', link: `https://valoraapp.com/wc?uri=${actionString}` },
  ]
  for (const { name, link } of actionLinks) {
    it(`handles ${name} action links correctly`, async () => {
      await expectSaga(handleDeepLink, openDeepLink(link))
        .provide([
          [select(selectHasPendingState), false],
          {
            race: () => ({ timedOut: false }),
          },
        ])
        .call(handleWalletConnectDeepLink, link)
        .not.call(initialiseWalletConnect)
        .run()
      expect(navigate).toHaveBeenCalledWith(Screens.WalletConnectRequest, {
        type: WalletConnectRequestType.Loading,
        origin: WalletConnectPairingOrigin.Deeplink,
      })
    })

    it(`handles ${name} action links correctly when there's a pending request`, async () => {
      await expectSaga(handleDeepLink, openDeepLink(link))
        .provide([[select(selectHasPendingState), true]])
        .call(handleWalletConnectDeepLink, link)
        .not.call(initialiseWalletConnect)
        .run()
      expect(navigate).not.toHaveBeenCalled()
    })
  }
})

describe('handleOpenUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const httpLink = 'http://example.com'
  const httpsLink = 'https://example.com'
  const celoLink = 'celo://something'
  const otherDeepLink = 'other://deeplink'

  describe('when openExternal is `false` or not specified', () => {
    it('opens http links using WebViewScreen', async () => {
      await expectSaga(handleOpenUrl, openUrl(httpLink)).not.call.fn(handleDeepLink).run()
      expect(navigate).toHaveBeenCalledWith(Screens.WebViewScreen, { uri: httpLink })
      expect(navigateToURI).not.toHaveBeenCalled()
    })

    it('opens http or https links using WebViewScreen', async () => {
      await expectSaga(handleOpenUrl, openUrl(httpsLink)).not.call.fn(handleDeepLink).run()
      expect(navigate).toHaveBeenCalledWith(Screens.WebViewScreen, { uri: httpsLink })
      expect(navigateToURI).not.toHaveBeenCalled()
    })

    it('opens celo links directly', async () => {
      await expectSaga(handleOpenUrl, openUrl(celoLink))
        .call(handleDeepLink, openDeepLink(celoLink))
        .run()
      expect(navigate).not.toHaveBeenCalled()
      expect(navigateToURI).not.toHaveBeenCalled()
    })

    // openExternal is more of a preference, that's why we still open other links externally
    // because we wouldn't know what to do with them anyway
    it('opens other links externally', async () => {
      await expectSaga(handleOpenUrl, openUrl(otherDeepLink)).not.call.fn(handleDeepLink).run()
      expect(navigate).not.toHaveBeenCalled()
      expect(navigateToURI).toHaveBeenCalledWith(otherDeepLink)
    })
  })

  describe('when openExternal is `true`', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('opens http links externally', async () => {
      await expectSaga(handleOpenUrl, openUrl(httpLink, true)).not.call.fn(handleDeepLink).run()
      expect(navigate).not.toHaveBeenCalled()
      expect(navigateToURI).toHaveBeenCalledWith(httpLink)
    })

    it('opens https links externally', async () => {
      await expectSaga(handleOpenUrl, openUrl(httpsLink, true)).not.call.fn(handleDeepLink).run()
      expect(navigate).not.toHaveBeenCalled()
      expect(navigateToURI).toHaveBeenCalledWith(httpsLink)
    })

    // openExternal is more of a preference, that's why we still handle these directly
    it('opens celo links directly', async () => {
      await expectSaga(handleOpenUrl, openUrl(celoLink, true))
        .call(handleDeepLink, openDeepLink(celoLink))
        .run()
      expect(navigate).not.toHaveBeenCalled()
      expect(navigateToURI).not.toHaveBeenCalled()
    })

    it('opens other links externally', async () => {
      await expectSaga(handleOpenUrl, openUrl(otherDeepLink, true))
        .not.call.fn(handleDeepLink)
        .run()
      expect(navigate).not.toHaveBeenCalled()
      expect(navigateToURI).toHaveBeenCalledWith(otherDeepLink)
    })
  })
})

describe('handleSetAppState', () => {
  describe('on app active', () => {
    it('refreshes statsig and requires pin if pin required on app opened and do not lock period has passed', async () => {
      await expectSaga(handleSetAppState, setAppState('active'))
        .provide([
          [select(getLastTimeBackgrounded), 0],
          [select(getRequirePinOnAppOpen), true],
        ])
        .put(appLock())
        .call(patchUpdateStatsigUser)
        .run()
    })

    it('refreshes statsig and does not require pin if pin not required on app open', async () => {
      await expectSaga(handleSetAppState, setAppState('active'))
        .provide([
          [select(getLastTimeBackgrounded), 0],
          [select(getRequirePinOnAppOpen), false],
        ])
        .not.put(appLock())
        .call(patchUpdateStatsigUser)
        .run()
    })

    it('refreshes statsig and does not require pin if do not lock period has not passed', async () => {
      await expectSaga(handleSetAppState, setAppState('active'))
        .provide([
          [select(getLastTimeBackgrounded), Date.now()],
          [select(getRequirePinOnAppOpen), true],
        ])
        .not.put(appLock())
        .call(patchUpdateStatsigUser)
        .run()
    })
  })

  describe('on app inactive', () => {
    it('does nothing', async () => {
      await expectSaga(handleSetAppState, setAppState('inactive'))
        .provide([
          [select(getLastTimeBackgrounded), 0],
          [select(getRequirePinOnAppOpen), true],
        ])
        .not.put(appLock())
        .not.call(patchUpdateStatsigUser)
        .run()
    })
  })
})

describe('appInit', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const defaultProviders: (EffectProviders | StaticProvider)[] = [
    [select(allowOtaTranslationsSelector), true],
    [select(otaTranslationsAppVersionSelector), '1'],
    [select(currentLanguageSelector), 'nl-NL'],
    [select(sentryNetworkErrorsSelector), ['network error']],
  ]

  it('should initialise the correct components, with the stored language', async () => {
    await expectSaga(appInit)
      .provide(defaultProviders)
      .put(setSupportedBiometryType(BIOMETRY_TYPE.TOUCH_ID))
      .run()

    expect(initializeSentry).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.init).toHaveBeenCalledTimes(1)
    // Ensure the right context is used
    // Note: switch to mock.contexts[0] when we upgrade to jest >= 28
    // See https://jestjs.io/docs/mock-function-api/#mockfnmockcontexts
    expect(jest.mocked(ValoraAnalytics.init).mock.instances[0]).toBe(ValoraAnalytics)
    expect(initI18n).toHaveBeenCalledWith('nl-NL', true, '1')
  })

  it('should initialise with the best language', async () => {
    jest
      .spyOn(RNLocalize, 'findBestAvailableLanguage')
      .mockReturnValue({ languageTag: 'de-DE', isRTL: true })

    await expectSaga(appInit)
      .provide([[select(currentLanguageSelector), null], ...defaultProviders])
      .put(setSupportedBiometryType(BIOMETRY_TYPE.TOUCH_ID))
      .run()

    expect(initializeSentry).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.init).toHaveBeenCalledTimes(1)
    expect(initI18n).toHaveBeenCalledWith('de-DE', true, '1')
  })

  it('should initialise with the app fallback language', async () => {
    jest.spyOn(RNLocalize, 'findBestAvailableLanguage').mockReturnValue(undefined)

    await expectSaga(appInit)
      .provide([[select(currentLanguageSelector), null], ...defaultProviders])
      .put(setSupportedBiometryType(BIOMETRY_TYPE.TOUCH_ID))
      .run()

    expect(initializeSentry).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.init).toHaveBeenCalledTimes(1)
    expect(initI18n).toHaveBeenCalledWith('en-US', true, '1')
  })
})

describe(requestInAppReview, () => {
  const now = 1482363367071

  beforeAll(() => {
    jest.useFakeTimers({
      now,
    })
  })

  const oneDayAgo = now - ONE_DAY_IN_MILLIS
  const fourMonthsAndADayAgo = now - ONE_DAY_IN_MILLIS * 121

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.each`
    lastInteractionTimestamp | lastInteraction
    ${null}                  | ${null}
    ${fourMonthsAndADayAgo}  | ${'121 days ago'}
  `(
    `Should show when isAvailable: true, Last Interaction: $lastInteraction and Wallet Address: 0xTest`,
    async ({ lastInteractionTimestamp }) => {
      jest.mocked(getFeatureGate).mockReturnValue(true)
      mockIsInAppReviewAvailable.mockReturnValue(true)
      mockRequestInAppReview.mockResolvedValue(true)

      await expectSaga(requestInAppReview)
        .withState(
          createMockStore({
            web3: { account: '0xTest' },
          }).getState()
        )
        .provide([[select(inAppReviewLastInteractionTimestampSelector), lastInteractionTimestamp]])
        .put(inAppReviewRequested(now))
        .run()

      expect(mockRequestInAppReview).toHaveBeenCalledTimes(1)
      expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(AppEvents.in_app_review_impression)
    }
  )

  it.each`
    lastInteractionTimestamp | isAvailable | lastInteraction   | featureGate | walletAddress
    ${fourMonthsAndADayAgo}  | ${false}    | ${'121 days ago'} | ${true}     | ${'0xTest'}
    ${oneDayAgo}             | ${true}     | ${'1 day ago'}    | ${true}     | ${'0xTest'}
    ${fourMonthsAndADayAgo}  | ${true}     | ${'121 days ago'} | ${false}    | ${'0xTest'}
    ${fourMonthsAndADayAgo}  | ${true}     | ${'121 days ago'} | ${true}     | ${null}
  `(
    `Should not show when Device Available: $isAvailable, Feature Gate: $featureGate, Last Interaction: $lastInteraction and Wallet Address: $walletAddress`,
    async ({ lastInteractionTimestamp, isAvailable, featureGate, walletAddress }) => {
      jest.mocked(getFeatureGate).mockReturnValue(featureGate)
      mockIsInAppReviewAvailable.mockReturnValue(isAvailable)
      mockRequestInAppReview.mockResolvedValue(true)

      await expectSaga(requestInAppReview)
        .withState(
          createMockStore({
            web3: { account: walletAddress },
          }).getState()
        )
        .provide([[select(inAppReviewLastInteractionTimestampSelector), lastInteractionTimestamp]])
        .not.put(inAppReviewRequested(expect.anything()))
        .run()

      expect(mockRequestInAppReview).not.toHaveBeenCalled()
      expect(ValoraAnalytics.track).not.toHaveBeenCalled()
    }
  )

  it('Should handle error from react-native-in-app-review', async () => {
    jest.mocked(getFeatureGate).mockReturnValue(true)
    mockIsInAppReviewAvailable.mockReturnValue(true)
    mockRequestInAppReview.mockRejectedValue(new Error('🤖💥'))

    await expectSaga(requestInAppReview)
      .withState(
        createMockStore({
          web3: { account: '0xTest' },
        }).getState()
      )
      .provide([[select(inAppReviewLastInteractionTimestampSelector), null]])
      .not.put(inAppReviewRequested(expect.anything()))
      .run()

    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(AppEvents.in_app_review_error, {
      error: '🤖💥',
    })
    expect(Logger.error).toHaveBeenLastCalledWith(
      'app/saga',
      'Error while calling InAppReview.RequestInAppReview',
      new Error('🤖💥')
    )
  })
})
