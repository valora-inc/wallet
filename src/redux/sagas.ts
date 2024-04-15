import { sleep } from '@celo/utils/lib/async'
import { UnknownAction } from '@reduxjs/toolkit'
// Import the actions included in the logger blocklist below.
import { REHYDRATE } from 'redux-persist'
import { Actions as AccountActions } from 'src/account/actions'
import { accountSaga } from 'src/account/saga'
import { devModeSelector } from 'src/account/selectors'
import { analyticsSaga } from 'src/analytics/saga'
import { Actions as AppActions } from 'src/app/actions'
import {
  appInit,
  appRemoteFeatureFlagSaga,
  appSaga,
  appVersionSaga,
  checkAndroidMobileServicesSaga,
} from 'src/app/saga'
import { superchargeSaga } from 'src/consumerIncentives/saga'
import { dappKitSaga } from 'src/dappkit/dappkit'
import { dappsSaga } from 'src/dapps/saga'
import { escrowSaga } from 'src/escrow/saga'
import { Actions as ExchangeActions } from 'src/exchange/actions'
import { feesSaga } from 'src/fees/saga'
import { fiatConnectSaga } from 'src/fiatconnect/saga'
import { fiatExchangesSaga } from 'src/fiatExchanges/saga'
import { firebaseSaga } from 'src/firebase/saga'
import { homeSaga } from 'src/home/saga'
import { i18nSaga } from 'src/i18n/saga'
import { identitySaga } from 'src/identity/saga'
import { Actions as ImportActions } from 'src/import/actions'
import { importSaga } from 'src/import/saga'
import { jumpstartSaga } from 'src/jumpstart/saga'
import { keylessBackupSaga } from 'src/keylessBackup/saga'
import { localCurrencySaga } from 'src/localCurrency/saga'
import { networkInfoSaga } from 'src/networkInfo/saga'
import { nftsSaga } from 'src/nfts/saga'
import { positionsSaga } from 'src/positions/saga'
import { priceHistorySaga } from 'src/priceHistory/saga'
import { setPhoneRecipientCache, updateValoraRecipientCache } from 'src/recipients/reducer'
import { recipientsSaga } from 'src/recipients/saga'
import { sendSaga } from 'src/send/saga'
import { sentrySaga } from 'src/sentry/saga'
import { swapSaga } from 'src/swap/saga'
import { tokensSaga } from 'src/tokens/saga'
import { Actions as TransactionActions } from 'src/transactions/actions'
import { transactionSaga } from 'src/transactions/saga'
import { checkAccountExistenceSaga } from 'src/utils/accountChecker'
import Logger from 'src/utils/Logger'
import { walletConnectSaga } from 'src/walletConnect/saga'
import { Actions as Web3Actions } from 'src/web3/actions'
import { web3Saga } from 'src/web3/saga'
import { pointsSaga } from 'src/points/saga'
import { call, select, spawn, take, takeEvery } from 'typed-redux-saga'

const loggerBlocklist = [
  REHYDRATE,
  AppActions.PHONE_NUMBER_VERIFICATION_COMPLETED,
  AccountActions.SET_PHONE_NUMBER,
  ExchangeActions.UPDATE_CELO_GOLD_EXCHANGE_RATE_HISTORY, // Not private, just noisy
  ImportActions.IMPORT_BACKUP_PHRASE,
  setPhoneRecipientCache.toString(),
  updateValoraRecipientCache.toString(),
  TransactionActions.UPDATE_RECENT_TX_RECIPIENT_CACHE,
  TransactionActions.UPDATE_TRANSACTIONS,
  Web3Actions.SET_DATA_ENCRYPTION_KEY,
]

function* loggerSaga() {
  const devModeActive: boolean = yield* select(devModeSelector)
  if (!devModeActive) {
    return
  }

  yield* takeEvery('*', (action: UnknownAction) => {
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
      Logger.debug('redux/saga@logger', action)
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
    yield* take(REHYDRATE)

    yield* call(appInit)

    // Note, the order of these does matter in certain cases
    yield* spawn(analyticsSaga)
    yield* spawn(appVersionSaga)
    yield* spawn(appRemoteFeatureFlagSaga)
    yield* spawn(loggerSaga)
    yield* spawn(appSaga)
    yield* spawn(i18nSaga)
    yield* spawn(sentrySaga)
    yield* spawn(networkInfoSaga)
    yield* spawn(web3Saga)
    yield* spawn(accountSaga)
    yield* spawn(firebaseSaga)
    yield* spawn(tokensSaga)
    yield* spawn(positionsSaga)
    yield* spawn(localCurrencySaga)
    yield* spawn(transactionSaga)
    yield* spawn(homeSaga)
    yield* spawn(identitySaga)
    yield* spawn(recipientsSaga)
    yield* spawn(feesSaga)
    yield* spawn(sendSaga)
    yield* spawn(jumpstartSaga)
    yield* spawn(escrowSaga)
    yield* spawn(importSaga)
    yield* spawn(dappKitSaga)
    yield* spawn(checkAccountExistenceSaga)
    yield* spawn(fiatExchangesSaga)
    yield* spawn(walletConnectSaga)
    yield* spawn(superchargeSaga)
    yield* spawn(checkAndroidMobileServicesSaga)
    yield* spawn(dappsSaga)
    yield* spawn(fiatConnectSaga)
    yield* spawn(swapSaga)
    yield* spawn(keylessBackupSaga)
    yield* spawn(nftsSaga)
    yield* spawn(priceHistorySaga)
    yield* spawn(pointsSaga)
  } catch (error) {
    Logger.error('@rootSaga', 'Error while initializing sagas', error)
    // Propagate so it's handled by Sentry
    throw error
  } finally {
    sagasFinishedLoading = true
  }
}
