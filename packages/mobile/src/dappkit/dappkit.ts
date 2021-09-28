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
import { call, select, takeLeading } from 'redux-saga/effects'
import { e164NumberSelector } from 'src/account/selectors'
import { DappKitEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { e164NumberToSaltSelector } from 'src/identity/reducer'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { navigateToURI } from 'src/utils/linking'
import Logger from 'src/utils/Logger'
import { getWeb3 } from 'src/web3/contracts'
import { getConnectedUnlockedAccount } from 'src/web3/saga'
import { currentAccountSelector } from 'src/web3/selectors'

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

export function getDefaultRequestTrackedProperties(request: DappKitRequest) {
  const { type: requestType, callback: requestCallback, requestId, dappName } = request
  const dappUrl = new URL(requestCallback).origin
  return {
    dappName,
    dappUrl,
    requestType,
    requestCallback,
    requestId,
  }
}

function* respondToAccountAuth(action: ApproveAccountAuthAction) {
  const defaultTrackedProperties = getDefaultRequestTrackedProperties(action.request)
  try {
    Logger.debug(TAG, 'Approving auth account')
    const account = yield select(currentAccountSelector)
    const phoneNumber = yield select(e164NumberSelector)
    const e164NumberToSalt = yield select(e164NumberToSaltSelector)
    const pepper = e164NumberToSalt[phoneNumber]
    navigateToURI(
      produceResponseDeeplink(
        action.request,
        AccountAuthResponseSuccess(account, phoneNumber, pepper)
      )
    )
    ValoraAnalytics.track(DappKitEvents.dappkit_request_accept_success, defaultTrackedProperties)
  } catch (error) {
    Logger.error(TAG, 'Failed to respond to account auth', error)
    ValoraAnalytics.track(DappKitEvents.dappkit_request_accept_error, {
      ...defaultTrackedProperties,
      error: error.message,
    })
  }
}

// TODO Error handling here
function* produceTxSignature(action: RequestTxSignatureAction) {
  const defaultTrackedProperties = getDefaultRequestTrackedProperties(action.request)
  try {
    ValoraAnalytics.track(DappKitEvents.dappkit_request_accept_start, defaultTrackedProperties)
    Logger.debug(TAG, 'Producing tx signature')

    yield call(getConnectedUnlockedAccount)
    const web3 = yield call(getWeb3)

    const rawTxs = yield Promise.all(
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
        Logger.debug(TAG, 'Signing tx with params', JSON.stringify(params))
        const signedTx = await web3.eth.signTransaction(params)
        return signedTx.raw
      })
    )

    Logger.debug(TAG, 'Txs signed, opening URL')
    navigateToURI(produceResponseDeeplink(action.request, SignTxResponseSuccess(rawTxs)))
    ValoraAnalytics.track(DappKitEvents.dappkit_request_accept_success, defaultTrackedProperties)
  } catch (error) {
    Logger.error(TAG, 'Failed to produce tx signature', error)
    ValoraAnalytics.track(DappKitEvents.dappkit_request_accept_error, {
      ...defaultTrackedProperties,
      error: error.message,
    })
  }
}

export function* dappKitSaga() {
  yield takeLeading(actions.APPROVE_ACCOUNT_AUTH, respondToAccountAuth)
  yield takeLeading(actions.REQUEST_TX_SIGNATURE, produceTxSignature)
}

export function handleDappkitDeepLink(deeplink: string) {
  try {
    const dappKitRequest = parseDappKitRequestDeeplink(deeplink)
    switch (dappKitRequest.type) {
      case DappKitRequestTypes.ACCOUNT_ADDRESS:
        ValoraAnalytics.track(
          DappKitEvents.dappkit_request_propose,
          getDefaultRequestTrackedProperties(dappKitRequest)
        )
        navigate(Screens.DappKitAccountAuth, { dappKitRequest })
        break
      case DappKitRequestTypes.SIGN_TX:
        ValoraAnalytics.track(
          DappKitEvents.dappkit_request_propose,
          getDefaultRequestTrackedProperties(dappKitRequest)
        )
        navigate(Screens.DappKitSignTxScreen, { dappKitRequest })
        break
      default:
        navigate(Screens.ErrorScreen, { errorMessage: 'Unsupported dapp request type' })
        Logger.warn(TAG, 'Unsupported dapp request type')
    }
  } catch (error) {
    navigate(Screens.ErrorScreen, { errorMessage: `Deep link not valid for dappkit: ${error}` })
    Logger.debug(TAG, `Deep link not valid for dappkit: ${error}`)
    ValoraAnalytics.track(DappKitEvents.dappkit_parse_deeplink_error, {
      deeplink,
      error: error.message,
    })
  }
}
