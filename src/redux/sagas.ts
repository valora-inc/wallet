import { sleep } from '@celo/utils/lib/async'
import { AnyAction } from 'redux'
// Import the actions included in the logger blocklist below.
import { REHYDRATE } from 'redux-persist'
import { call, select, spawn, takeEvery } from 'redux-saga/effects'
import { Actions as AccountActions } from 'src/account/actions'
import { accountSaga } from 'src/account/saga'
import { devModeSelector } from 'src/account/selectors'
import { analyticsSaga } from 'src/analytics/saga'
import {
  appInit,
  appRemoteFeatureFlagSaga,
  appSaga,
  appVersionSaga,
  checkAndroidMobileServicesSaga,
} from 'src/app/saga'
import { superchargeSaga } from 'src/consumerIncentives/saga'
import { dappKitSaga } from 'src/dappkit/dappkit'
import { escrowSaga } from 'src/escrow/saga'
import { Actions as ExchangeActions } from 'src/exchange/actions'
import { exchangeSaga } from 'src/exchange/saga'
import { feesSaga } from 'src/fees/saga'
import { fiatExchangesSaga } from 'src/fiatExchanges/saga'
import { firebaseSaga } from 'src/firebase/saga'
import { Actions as GethActions } from 'src/geth/actions'
import { gethSaga } from 'src/geth/saga'
import { goldTokenSaga } from 'src/goldToken/saga'
import { homeSaga } from 'src/home/saga'
import { i18nSaga } from 'src/i18n/saga'
import { identitySaga } from 'src/identity/saga'
import { Actions as ImportActions } from 'src/import/actions'
import { importSaga } from 'src/import/saga'
import { localCurrencySaga } from 'src/localCurrency/saga'
import { Actions as MapActions } from 'src/map/actions'
import { mapSaga } from 'src/map/saga'
import { networkInfoSaga } from 'src/networkInfo/saga'
import { paymentRequestSaga } from 'src/paymentRequest/saga'
import { pdfSaga } from 'src/pdf/saga'
import { setPhoneRecipientCache, updateValoraRecipientCache } from 'src/recipients/reducer'
import { recipientsSaga } from 'src/recipients/saga'
import { waitForRehydrate } from 'src/redux/persist-helper'
import { sendSaga } from 'src/send/saga'
import { sentrySaga } from 'src/sentry/saga'
import { stableTokenSaga } from 'src/stableToken/saga'
import { tokensSaga } from 'src/tokens/saga'
import { Actions as TransactionActions } from 'src/transactions/actions'
import { transactionSaga } from 'src/transactions/saga'
import { checkAccountExistenceSaga } from 'src/utils/accountChecker'
import Logger from 'src/utils/Logger'
import { vendorsSaga } from 'src/vendors/saga'
import { verifySaga } from 'src/verify/saga'
import { walletConnectSaga } from 'src/walletConnect/saga'
import { Actions as Web3Actions } from 'src/web3/actions'
import { web3Saga } from 'src/web3/saga'

const loggerBlocklist = [
  REHYDRATE,
  AccountActions.SET_PHONE_NUMBER,
  ExchangeActions.UPDATE_CELO_GOLD_EXCHANGE_RATE_HISTORY, // Not private, just noisy
  GethActions.SET_CHAIN_HEAD,
  GethActions.SET_GETH_CONNECTED,
  ImportActions.IMPORT_BACKUP_PHRASE,
  setPhoneRecipientCache.toString(),
  updateValoraRecipientCache.toString(),
  TransactionActions.NEW_TRANSACTIONS_IN_FEED,
  TransactionActions.UPDATE_RECENT_TX_RECIPIENT_CACHE,
  TransactionActions.UPDATE_TRANSACTIONS,
  Web3Actions.SET_DATA_ENCRYPTION_KEY,
  MapActions.SET_FOOD_FORESTS,
]

function* loggerSaga() {
  const devModeActive: boolean = yield select(devModeSelector)
  if (!devModeActive) {
    return
  }

  yield takeEvery('*', (action: AnyAction) => {
    if (
      action?.type &&
      (action.type.includes('IDENTITY/') || loggerBlocklist.includes(action.type))
    ) {
      // Log only action type, but not the payload as it can have
      // sensitive information. Excluding all IDENTITY/ actions because high likelyhood
      // they contain PII and the blocklist may get out of date.
      Logger.debug('redux/saga@logger', `${action.type} (payload not logged)`)
      return
    }
    try {
      Logger.debug('redux/saga@logger', JSON.stringify(action))
    } catch (err) {
      Logger.warn('redux/saga@logger', 'could not log action of type', action.type)
    }
  })
}

let sagasFinishedLoading = false
export async function waitUntilSagasFinishLoading() {
  while (!sagasFinishedLoading) {
    await sleep(100)
  }
}

export function* rootSaga() {
  try {
    // Delay all sagas until rehydrate is done
    // This prevents them from running with missing state
    yield call(waitForRehydrate)
    yield call(appInit)

    // Note, the order of these does matter in certain cases
    yield spawn(analyticsSaga)
    yield spawn(appVersionSaga)
    yield spawn(appRemoteFeatureFlagSaga)
    yield spawn(loggerSaga)
    yield spawn(appSaga)
    yield spawn(i18nSaga)
    yield spawn(sentrySaga)
    yield spawn(networkInfoSaga)
    yield spawn(gethSaga)
    yield spawn(web3Saga)
    yield spawn(accountSaga)
    yield spawn(firebaseSaga)
    yield spawn(tokensSaga)
    yield spawn(localCurrencySaga)
    yield spawn(transactionSaga)
    yield spawn(homeSaga)
    yield spawn(identitySaga)
    yield spawn(recipientsSaga)
    yield spawn(verifySaga)
    yield spawn(feesSaga)
    yield spawn(stableTokenSaga)
    yield spawn(goldTokenSaga)
    yield spawn(sendSaga)
    yield spawn(exchangeSaga)
    yield spawn(paymentRequestSaga)
    yield spawn(escrowSaga)
    yield spawn(importSaga)
    yield spawn(dappKitSaga)
    yield spawn(checkAccountExistenceSaga)
    yield spawn(fiatExchangesSaga)
    yield spawn(walletConnectSaga)
    yield spawn(superchargeSaga)
    yield spawn(checkAndroidMobileServicesSaga)
    yield spawn(vendorsSaga)
    yield spawn(pdfSaga)
    yield spawn(mapSaga)
  } catch (error) {
    Logger.error('@rootSaga', 'Error while initializing sagas', error)
    // Propagate so it's handled by Sentry
    throw error
  } finally {
    sagasFinishedLoading = true
  }
}
