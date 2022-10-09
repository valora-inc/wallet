import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { select } from 'redux-saga/effects'
import { WalletConnectPairingOrigin } from 'src/analytics/types'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { appLock, dappSelected, openDeepLink, openUrl, setAppState } from 'src/app/actions'
import { DappSection } from 'src/app/reducers'
import { handleDeepLink, handleOpenDapp, handleOpenUrl, handleSetAppState } from 'src/app/saga'
import {
  activeDappSelector,
  activeScreenSelector,
  dappsWebViewEnabledSelector,
  getAppLocked,
  getLastTimeBackgrounded,
  getRequirePinOnAppOpen,
} from 'src/app/selectors'
import { handleDappkitDeepLink } from 'src/dappkit/dappkit'
import { FiatExchangeFlow } from 'src/fiatExchanges/utils'
import { receiveAttestationMessage } from 'src/identity/actions'
import { CodeInputType } from 'src/identity/verification'
import { navigate, replace } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { handlePaymentDeeplink } from 'src/send/utils'
import { navigateToURI } from 'src/utils/linking'
import { initialiseWalletConnect } from 'src/walletConnect/saga'
import { selectHasPendingState } from 'src/walletConnect/selectors'
import { handleWalletConnectDeepLink } from 'src/walletConnect/walletConnect'
import { mocked } from 'ts-jest/utils'

jest.mock('src/utils/time', () => ({
  clockInSync: () => true,
}))

jest.mock('src/dappkit/dappkit')

const MockedAnalytics = mocked(ValoraAnalytics)

describe('App saga', () => {
  beforeEach(() => {
    MockedAnalytics.track = jest.fn()
  })
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('Handles Dappkit deep link', async () => {
    const deepLink = 'kolektivo://wallet/dappkit?abcdsa'
    await expectSaga(handleDeepLink, openDeepLink(deepLink)).run()
    expect(handleDappkitDeepLink).toHaveBeenCalledWith(deepLink)
  })

  it('Handles verification deep link', async () => {
    await expectSaga(handleDeepLink, openDeepLink('kolektivo://wallet/v/12345'))
      .put(receiveAttestationMessage('12345', CodeInputType.DEEP_LINK))
      .run()
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
    const deepLink = `kolektivo://wallet/pay?${params.toString()}`

    await expectSaga(handleDeepLink, openDeepLink(deepLink))
      .provide([[matchers.call.fn(handlePaymentDeeplink), deepLink]])
      .run()
  })

  it('Handles cash in deep link', async () => {
    const deepLink = 'kolektivo://wallet/cashIn'
    await expectSaga(handleDeepLink, openDeepLink(deepLink)).run()
    expect(navigate).toHaveBeenCalledWith(Screens.FiatExchangeCurrency, {
      flow: FiatExchangeFlow.CashIn,
    })
  })

  it('Handles Bidali deep link', async () => {
    const deepLink = 'kolektivo://wallet/bidali'
    await expectSaga(handleDeepLink, openDeepLink(deepLink)).run()
    expect(navigate).toHaveBeenCalledWith(Screens.BidaliScreen, { currency: undefined })
  })

  it('Handles cash-in-success deep link', async () => {
    const deepLink = 'kolektivo://wallet/cash-in-success/simplex'
    await expectSaga(handleDeepLink, openDeepLink(deepLink)).run()
    expect(navigate).toHaveBeenCalledWith(Screens.CashInSuccess, { provider: 'simplex' })
  })

  it('Handles cash-in-success deep link with query params', async () => {
    const deepLink = 'kolektivo://wallet/cash-in-success/simplex?isApproved=true'
    await expectSaga(handleDeepLink, openDeepLink(deepLink)).run()
    expect(navigate).toHaveBeenCalledWith(Screens.CashInSuccess, { provider: 'simplex' })
  })

  it('Handles openScreen deep link with safe origin', async () => {
    const deepLink = `kolektivo://wallet/openScreen?screen=${Screens.FiatExchangeCurrency}&flow=CashIn`
    await expectSaga(handleDeepLink, openDeepLink(deepLink, true)).run()
    expect(navigate).toHaveBeenCalledWith(
      Screens.FiatExchangeCurrency,
      expect.objectContaining({ flow: FiatExchangeFlow.CashIn })
    )
  })

  it('Handles openScreen deep link without safe origin', async () => {
    const deepLink = `kolektivo://wallet/openScreen?screen=${Screens.FiatExchangeCurrency}&flow=CashIn`
    await expectSaga(handleDeepLink, openDeepLink(deepLink, false)).run()
    expect(navigate).not.toHaveBeenCalled()
  })

  describe('WalletConnect deeplinks', () => {
    const connectionString = encodeURIComponent(
      'wc:79a02f869d0f921e435a5e0643304548ebfa4a0430f9c66fe8b1a9254db7ef77@1?controller=false&publicKey=f661b0a9316a4ce0b6892bdce42bea0f45037f2c1bee9e118a3a4bc868a32a39&relay={"protocol":"waku"}'
    )
    const connectionLinks = [
      {
        name: 'Android',
        link: connectionString,
      },
      {
        name: 'iOS deeplink',
        link: `kolektivo://wallet/wc?uri=${connectionString}`,
      },
      {
        name: 'iOS universal link',
        link: `https://valoraapp.com/wc?uri=${connectionString}`,
      },
    ]

    it('handles loading time out', async () => {
      await expectSaga(handleDeepLink, openDeepLink(connectionLinks[0].link))
        .provide([
          [select(selectHasPendingState), false],
          [select(activeScreenSelector), Screens.WalletConnectLoading],
          [select(activeDappSelector), null],
          {
            race: () => ({ timedOut: true }),
          },
        ])
        .call(handleWalletConnectDeepLink, connectionLinks[0].link)
        .run()

      expect(navigate).toHaveBeenCalledWith(Screens.WalletConnectLoading, {
        origin: WalletConnectPairingOrigin.Deeplink,
      })
      expect(replace).toHaveBeenCalledWith(Screens.WalletConnectResult, {
        subtitle: 'timeoutSubtitle',
        title: 'timeoutTitle',
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
        expect(navigate).toHaveBeenCalledWith(Screens.WalletConnectLoading, {
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
      { name: 'iOS deeplink', link: `kolektivo://wallet/wc?uri=${actionString}` },
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
        expect(navigate).toHaveBeenCalledWith(Screens.WalletConnectLoading, {
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

  describe(handleOpenUrl, () => {
    const httpLink = 'http://example.com'
    const httpsLink = 'https://example.com'
    const celoLink = 'kolektivo://something'
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

  it('Handles set app state', async () => {
    await expectSaga(handleSetAppState, setAppState('active'))
      .provide([
        [select(getAppLocked), false],
        [select(getLastTimeBackgrounded), 0],
        [select(getRequirePinOnAppOpen), true],
      ])
      .put(appLock())
      .run()

    await expectSaga(handleSetAppState, setAppState('active'))
      .provide([
        [select(getAppLocked), true],
        [select(getLastTimeBackgrounded), 0],
        [select(getRequirePinOnAppOpen), true],
      ])
      .run()

    await expectSaga(handleSetAppState, setAppState('active'))
      .provide([
        [select(getAppLocked), false],
        [select(getLastTimeBackgrounded), Date.now()],
        [select(getRequirePinOnAppOpen), true],
      ])
      .run()

    await expectSaga(handleSetAppState, setAppState('active'))
      .provide([
        [select(getAppLocked), false],
        [select(getLastTimeBackgrounded), 0],
        [select(getRequirePinOnAppOpen), false],
      ])
      .run()

    await expectSaga(handleSetAppState, setAppState('active'))
      .provide([
        [select(getAppLocked), false],
        [select(getLastTimeBackgrounded), 0],
        [select(getRequirePinOnAppOpen), true],
      ])
      .run()
  })

  describe('Handles opening a dapp', () => {
    const baseDapp = {
      id: 'dapp',
      categoryId: 'some category',
      iconUrl: 'https://someIcon.url',
      name: 'Dapp',
      description: 'some description',
      dappUrl: 'https://someDapp.url',
      isFeatured: false,
    }

    it('opens a web view', async () => {
      await expectSaga(handleOpenDapp, dappSelected({ ...baseDapp, openedFrom: DappSection.All }))
        .provide([[select(dappsWebViewEnabledSelector), true]])
        .run()

      expect(navigate).toHaveBeenCalledWith(Screens.WebViewScreen, {
        uri: baseDapp.dappUrl,
      })
    })

    it('opens a deep link', async () => {
      await expectSaga(
        handleOpenDapp,
        dappSelected({
          ...baseDapp,
          dappUrl: 'kolektivo://wallet/bidali',
          openedFrom: DappSection.All,
        })
      )
        .provide([[select(dappsWebViewEnabledSelector), true]])
        .run()

      expect(navigate).toHaveBeenCalledWith(Screens.BidaliScreen, { currency: undefined })
    })
  })
})
