import {
  AccountAuthRequest,
  AccountAuthResponseSuccess,
  DappKitRequest,
  DappKitRequestTypes,
  parseDappKitRequestDeeplink,
  produceResponseDeeplink,
  SignTxRequest,
  SignTxResponseSuccess,
} from '@celo/utils/lib/dappkit'
import { e164NumberSelector } from 'src/account/selectors'
import { showMessage } from 'src/alert/actions'
import { DappKitEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { getDappRequestOrigin } from 'src/app/utils'
import { activeDappSelector } from 'src/dapps/selectors'
import { ActiveDapp } from 'src/dapps/types'
import i18n from 'src/i18n'
import { e164NumberToSaltSelector } from 'src/identity/selectors'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { SentryTransactionHub } from 'src/sentry/SentryTransactionHub'
import { SentryTransaction } from 'src/sentry/SentryTransactions'
import { ensureError } from 'src/utils/ensureError'
import { navigateToURI } from 'src/utils/linking'
import Logger from 'src/utils/Logger'
import { safely } from 'src/utils/safely'
import { getWeb3 } from 'src/web3/contracts'
import { getConnectedUnlockedAccount } from 'src/web3/saga'
import { currentAccountSelector } from 'src/web3/selectors'
import { call, put, select, takeLeading } from 'typed-redux-saga'

const TAG = 'dappkit/dappkit'

export enum actions {
  APPROVE_ACCOUNT_AUTH = 'DAPPKIT/APPROVE_ACCOUNT_AUTH',
  REQUEST_TX_SIGNATURE = 'DAPPKIT/REQUEST_TX_SIGNATURE',
}

export interface ApproveAccountAuthAction {
  type: actions.APPROVE_ACCOUNT_AUTH
  request: AccountAuthRequest
}

export const approveAccountAuth = (request: AccountAuthRequest): ApproveAccountAuthAction => ({
  type: actions.APPROVE_ACCOUNT_AUTH,
  request,
})

export interface RequestTxSignatureAction {
  type: actions.REQUEST_TX_SIGNATURE
  request: SignTxRequest
}

export const requestTxSignature = (request: SignTxRequest): RequestTxSignatureAction => ({
  type: actions.REQUEST_TX_SIGNATURE,
  request,
})

export function getDefaultRequestTrackedProperties(
  request: DappKitRequest,
  activeDapp: ActiveDapp | null
) {
  const { type: requestType, callback: requestCallback, requestId, dappName } = request
  const dappUrl = new URL(requestCallback).origin
  return {
    dappRequestOrigin: getDappRequestOrigin(activeDapp),
    dappName,
    dappUrl,
    requestType,
    requestCallback,
    requestId,
  }
}

function* handleNavigationWithDeeplink(dappkitDeeplink: string) {
  const activeDapp = yield* select(activeDappSelector)

  if (activeDapp) {
    yield* put(showMessage(i18n.t('inAppConnectionSuccess', { dappName: activeDapp.name })))
    navigate(Screens.WebViewScreen, {
      uri: activeDapp.dappUrl,
      dappkitDeeplink,
    })
  } else {
    navigateToURI(dappkitDeeplink)
    // prevent staying on dappkit confirmation screen
    navigateBack()
  }
}

function* respondToAccountAuth(action: ApproveAccountAuthAction) {
  const activeDapp: ActiveDapp | null = yield* select(activeDappSelector)
  const defaultTrackedProperties = getDefaultRequestTrackedProperties(action.request, activeDapp)
  try {
    ValoraAnalytics.track(DappKitEvents.dappkit_request_accept_start, defaultTrackedProperties)
    Logger.debug(TAG, 'Approving auth account')
    const account = yield* select(currentAccountSelector)
    const phoneNumber = yield* select(e164NumberSelector)
    const e164NumberToSalt = yield* select(e164NumberToSaltSelector)
    if (!account) {
      throw new Error('Account is not set')
    }
    if (!phoneNumber) {
      throw new Error('Phone number is not set')
    }
    const pepper = e164NumberToSalt[phoneNumber]
    if (!pepper) {
      throw new Error('Pepper is not set')
    }
    const responseDeeplink = produceResponseDeeplink(
      action.request,
      AccountAuthResponseSuccess(account, phoneNumber, pepper)
    )

    yield* call(handleNavigationWithDeeplink, responseDeeplink)

    ValoraAnalytics.track(DappKitEvents.dappkit_request_accept_success, defaultTrackedProperties)
    SentryTransactionHub.finishTransaction(SentryTransaction.dappkit_connection)
  } catch (err) {
    const error = ensureError(err)
    Logger.error(TAG, 'Failed to respond to account auth', error)
    ValoraAnalytics.track(DappKitEvents.dappkit_request_accept_error, {
      ...defaultTrackedProperties,
      error: error.message,
    })
  }
}

// TODO Error handling here
function* produceTxSignature(action: RequestTxSignatureAction) {
  const activeDapp: ActiveDapp | null = yield* select(activeDappSelector)
  const defaultTrackedProperties = getDefaultRequestTrackedProperties(action.request, activeDapp)
  try {
    ValoraAnalytics.track(DappKitEvents.dappkit_request_accept_start, defaultTrackedProperties)
    Logger.debug(TAG, 'Producing tx signature')

    yield* call(getConnectedUnlockedAccount)
    // Call Sentry performance monitoring after entering pin if required
    SentryTransactionHub.startTransaction(SentryTransaction.dappkit_transaction)
    const web3 = yield* call(getWeb3)

    const rawTxs = (yield* call(
      Promise.all,
      action.request.txs.map(async (tx) => {
        // TODO offload this logic to walletkit or contractkit, otherwise they
        // could diverge again and create another bug
        // See https://github.com/celo-org/celo-monorepo/issues/3045

        // In walletKit we use web3.eth.getCoinbase() to get gateway fee recipient
        // but that's throwing errors here. Not sure why, but txs work without it.
        const gatewayFeeRecipient = undefined
        const gatewayFee = undefined
        const gas = Math.round(tx.estimatedGas * 1.5)

        const params: any = {
          from: tx.from,
          gasPrice: '0',
          gas,
          data: tx.txData,
          nonce: tx.nonce,
          value: tx.value,
          feeCurrency: tx.feeCurrencyAddress,
          gatewayFeeRecipient,
          gatewayFee,
        }
        if (tx.to) {
          params.to = tx.to
        }
        Logger.debug(TAG, 'Signing tx with params', params)
        const signedTx = await web3.eth.signTransaction(params)
        return signedTx.raw
      })
    )) as string[]

    Logger.debug(TAG, 'Txs signed, opening URL')
    const responseDeeplink = produceResponseDeeplink(action.request, SignTxResponseSuccess(rawTxs))
    yield* call(handleNavigationWithDeeplink, responseDeeplink)
    ValoraAnalytics.track(DappKitEvents.dappkit_request_accept_success, defaultTrackedProperties)
    SentryTransactionHub.finishTransaction(SentryTransaction.dappkit_transaction)
  } catch (err) {
    const error = ensureError(err)
    Logger.error(TAG, 'Failed to produce tx signature', error)
    ValoraAnalytics.track(DappKitEvents.dappkit_request_accept_error, {
      ...defaultTrackedProperties,
      error: error.message,
    })
  }
}

export function* dappKitSaga() {
  yield* takeLeading(actions.APPROVE_ACCOUNT_AUTH, safely(respondToAccountAuth))
  yield* takeLeading(actions.REQUEST_TX_SIGNATURE, safely(produceTxSignature))
}

export function* handleDappkitDeepLink(deeplink: string) {
  const activeDapp: ActiveDapp | null = yield* select(activeDappSelector)
  try {
    const dappKitRequest = parseDappKitRequestDeeplink(deeplink)
    switch (dappKitRequest.type) {
      case DappKitRequestTypes.ACCOUNT_ADDRESS:
        ValoraAnalytics.track(
          DappKitEvents.dappkit_request_propose,
          getDefaultRequestTrackedProperties(dappKitRequest, activeDapp)
        )
        navigate(Screens.DappKitAccountScreen, { dappKitRequest })
        break
      case DappKitRequestTypes.SIGN_TX:
        ValoraAnalytics.track(
          DappKitEvents.dappkit_request_propose,
          getDefaultRequestTrackedProperties(dappKitRequest, activeDapp)
        )
        navigate(Screens.DappKitSignTxScreen, { dappKitRequest })
        break
      default:
        navigate(Screens.ErrorScreen, { errorMessage: 'Unsupported dapp request type' })
        Logger.warn(TAG, 'Unsupported dapp request type')
    }
  } catch (err) {
    const error = ensureError(err)
    navigate(Screens.ErrorScreen, { errorMessage: `Deep link not valid for dappkit: ${error}` })
    Logger.debug(TAG, `Deep link not valid for dappkit: ${error}`)
    ValoraAnalytics.track(DappKitEvents.dappkit_parse_deeplink_error, {
      dappRequestOrigin: getDappRequestOrigin(activeDapp),
      deeplink,
      error: error.message,
    })
  }
}
