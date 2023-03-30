import * as DEK from '@celo/cryptographic-utils/lib/dataEncryptionKey'
import { FetchMock } from 'jest-fetch-mock/types'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { call, select } from 'redux-saga/effects'
import { e164NumberSelector } from 'src/account/selectors'
import { InviteEvents } from 'src/analytics/Events'
import { WalletConnectPairingOrigin } from 'src/analytics/types'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import {
  appLock,
  inviteLinkConsumed,
  openDeepLink,
  openUrl,
  phoneNumberVerificationMigrated,
  setAppState,
} from 'src/app/actions'
import {
  handleDeepLink,
  handleOpenUrl,
  handleSetAppState,
  runCentralPhoneVerificationMigration,
} from 'src/app/saga'
import {
  getAppLocked,
  getLastTimeBackgrounded,
  getRequirePinOnAppOpen,
  inviterAddressSelector,
  odisV1EOLSelector,
  shouldRunVerificationMigrationSelector,
} from 'src/app/selectors'
import { handleDappkitDeepLink } from 'src/dappkit/dappkit'
import { activeDappSelector } from 'src/dapps/selectors'
import { FiatExchangeFlow } from 'src/fiatExchanges/utils'
import { resolveDynamicLink } from 'src/firebase/firebase'
import { fetchPhoneHashPrivate } from 'src/identity/privateHashing'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { retrieveSignedMessage } from 'src/pincode/authentication'
import { handlePaymentDeeplink } from 'src/send/utils'
import { navigateToURI } from 'src/utils/linking'
import Logger from 'src/utils/Logger'
import { initialiseWalletConnect } from 'src/walletConnect/saga'
import { selectHasPendingState } from 'src/walletConnect/selectors'
import { WalletConnectRequestType } from 'src/walletConnect/types'
import { handleWalletConnectDeepLink } from 'src/walletConnect/walletConnect'
import networkConfig from 'src/web3/networkConfig'
import {
  dataEncryptionKeySelector,
  mtwAddressSelector,
  walletAddressSelector,
} from 'src/web3/selectors'
import { mocked } from 'ts-jest/utils'

jest.mock('src/dappkit/dappkit')
jest.mock('src/analytics/ValoraAnalytics')

const mockFetch = fetch as FetchMock
jest.unmock('src/pincode/authentication')

const mockedDEK = mocked(DEK)
mockedDEK.compressedPubKey = jest.fn().mockReturnValue('publicKeyForUser')

const loggerWarnSpy = jest.spyOn(Logger, 'warn')

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
})

describe('WalletConnect deeplinks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

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
  it('handles setting app state', async () => {
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
})

describe('runCentralPhoneVerificationMigration', () => {
  beforeEach(() => {
    mockFetch.resetMocks()
  })

  it('should run successfully', async () => {
    mockFetch.mockResponse(JSON.stringify({ message: 'OK' }))

    await expectSaga(runCentralPhoneVerificationMigration)
      .provide([
        [select(odisV1EOLSelector), false],
        [select(dataEncryptionKeySelector), 'someDEK'],
        [select(shouldRunVerificationMigrationSelector), true],
        [select(inviterAddressSelector), '0x123'],
        [select(mtwAddressSelector), undefined],
        [select(walletAddressSelector), '0xabc'],
        [select(e164NumberSelector), '+31619777888'],
        [call(retrieveSignedMessage), 'someSignedMessage'],
        [
          call(fetchPhoneHashPrivate, '+31619777888'),
          { pepper: 'somePepper', phoneHash: 'somePhoneHash' },
        ],
      ])
      .put(phoneNumberVerificationMigrated())
      .run()

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(`${networkConfig.migratePhoneVerificationUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: 'Valora 0xabc:someSignedMessage',
      },
      body: '{"clientPlatform":"android","clientVersion":"0.0.1","publicDataEncryptionKey":"publicKeyForUser","phoneNumber":"+31619777888","pepper":"somePepper","phoneHash":"somePhoneHash","inviterAddress":"0x123"}',
    })
  })

  it('should warn if the verification service fails', async () => {
    mockFetch.mockResponse(JSON.stringify({ message: 'Not OK' }), { status: 500 })

    await expectSaga(runCentralPhoneVerificationMigration)
      .provide([
        [select(odisV1EOLSelector), false],
        [select(dataEncryptionKeySelector), 'someDEK'],
        [select(shouldRunVerificationMigrationSelector), true],
        [select(inviterAddressSelector), undefined],
        [select(mtwAddressSelector), '0x123'],
        [select(walletAddressSelector), '0xabc'],
        [select(e164NumberSelector), '+31619777888'],
        [call(retrieveSignedMessage), 'someSignedMessage'],
        [
          call(fetchPhoneHashPrivate, '+31619777888'),
          { pepper: 'somePepper', phoneHash: 'somePhoneHash' },
        ],
      ])
      .not.put(phoneNumberVerificationMigrated())
      .run()

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(`${networkConfig.migratePhoneVerificationUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: 'Valora 0xabc:someSignedMessage',
      },
      body: '{"clientPlatform":"android","clientVersion":"0.0.1","publicDataEncryptionKey":"publicKeyForUser","phoneNumber":"+31619777888","pepper":"somePepper","phoneHash":"somePhoneHash","mtwAddress":"0x123"}',
    })
    expect(loggerWarnSpy).toHaveBeenCalled()
  })

  it('should not run if migration conditions are not met', async () => {
    await expectSaga(runCentralPhoneVerificationMigration)
      .provide([
        [select(odisV1EOLSelector), false],
        [select(dataEncryptionKeySelector), 'someDEK'],
        [select(shouldRunVerificationMigrationSelector), false],
      ])
      .not.put(phoneNumberVerificationMigrated())
      .run()

    await expectSaga(runCentralPhoneVerificationMigration)
      .provide([
        [select(odisV1EOLSelector), true],
        [select(dataEncryptionKeySelector), 'someDEK'],
        [select(shouldRunVerificationMigrationSelector), true],
      ])
      .not.put(phoneNumberVerificationMigrated())
      .run()

    expect(mockFetch).not.toHaveBeenCalled()
  })

  // this is true for users who created accounts before app version 1.32 and
  // have never unlocked their account to generate the signed message
  it('should not run if migration conditions there is no signed message', async () => {
    await expectSaga(runCentralPhoneVerificationMigration)
      .provide([
        [select(odisV1EOLSelector), false],
        [select(dataEncryptionKeySelector), 'someDEK'],
        [select(shouldRunVerificationMigrationSelector), true],
        [select(inviterAddressSelector), undefined],
        [select(mtwAddressSelector), undefined],
        [select(walletAddressSelector), '0xabc'],
        [select(e164NumberSelector), '+31619777888'],
        [call(retrieveSignedMessage), null],
      ])
      .not.put(phoneNumberVerificationMigrated())
      .run()

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should not run if no DEK can be found', async () => {
    await expectSaga(runCentralPhoneVerificationMigration)
      .provide([
        [select(odisV1EOLSelector), false],
        [select(dataEncryptionKeySelector), null],
        [select(shouldRunVerificationMigrationSelector), true],
      ])
      .not.put(phoneNumberVerificationMigrated())
      .run()

    expect(mockFetch).not.toHaveBeenCalled()
    expect(loggerWarnSpy).toHaveBeenCalled()
  })
})
