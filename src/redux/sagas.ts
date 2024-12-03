import { UnknownAction } from '@reduxjs/toolkit'
import { sleep } from 'src/utils/sleep'
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
  checkAndroidMobileServicesSaga,
} from 'src/app/saga'
import { dappsSaga } from 'src/dapps/saga'
import { fetchDappsListCompleted } from 'src/dapps/slice'
import { earnSaga } from 'src/earn/saga'
import { fiatExchangesSaga } from 'src/fiatExchanges/saga'
import { fiatConnectSaga } from 'src/fiatconnect/saga'
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
import { fetchNftsCompleted } from 'src/nfts/slice'
import { pointsSaga } from 'src/points/saga'
import { positionsSaga } from 'src/positions/saga'
import { fetchPositionsSuccess, fetchShortcutsSuccess } from 'src/positions/slice'
import { priceHistorySaga } from 'src/priceHistory/saga'
import { fetchPriceHistorySuccess } from 'src/priceHistory/slice'
import {
  rewardsSendersFetched,
  setPhoneRecipientCache,
  updateAppRecipientCache,
} from 'src/recipients/reducer'
import { recipientsSaga } from 'src/recipients/saga'
import { sendSaga } from 'src/send/saga'
import { sentrySaga } from 'src/sentry/saga'
import { swapSaga } from 'src/swap/saga'
import { tokensSaga } from 'src/tokens/saga'
import { setTokenBalances } from 'src/tokens/slice'
import { transactionSaga } from 'src/transactions/saga'
import { updateTransactions } from 'src/transactions/slice'
import Logger from 'src/utils/Logger'
import { checkAccountExistenceSaga } from 'src/utils/accountChecker'
import { walletConnectSaga } from 'src/walletConnect/saga'
import { call, select, spawn, take, takeEvery } from 'typed-redux-saga'

// Actions that should not be logged along with their payload, particularly
// those containing API responses, as they add unnecessary noise to the logs.
const loggerPayloadBlocklist = [
  REHYDRATE,
  AppActions.PHONE_NUMBER_VERIFICATION_COMPLETED,
  AccountActions.SET_PHONE_NUMBER,
  ImportActions.IMPORT_BACKUP_PHRASE,
  setPhoneRecipientCache.toString(),
  updateAppRecipientCache.toString(),
  updateTransactions.type,
  setTokenBalances.type,
  fetchPriceHistorySuccess.type,
  rewardsSendersFetched.type,
  fetchDappsListCompleted.type,
  fetchNftsCompleted.type,
  fetchPositionsSuccess.type,
  fetchShortcutsSuccess.type,
  AppActions.UPDATE_REMOTE_CONFIG_VALUES,
  'transactionFeedV2Api/executeQuery/fulfilled',
]

function* loggerSaga() {
  const devModeActive: boolean = yield* select(devModeSelector)
  if (!devModeActive) {
    return
  }

  yield* takeEvery('*', (action: UnknownAction) => {
    if (
      action?.type &&
      (action.type.includes('IDENTITY/') || loggerPayloadBlocklist.includes(action.type))
    ) {
      // Log only action type, but not the payload as it can have sensitive
      // information or information that is not helpful for debugging. Excluding
      // all IDENTITY/ actions because high likelyhood they contain PII and the
      // blocklist may get out of date.
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
    yield* spawn(appRemoteFeatureFlagSaga)
    yield* spawn(loggerSaga)
    yield* spawn(appSaga)
    yield* spawn(i18nSaga)
    yield* spawn(sentrySaga)
    yield* spawn(networkInfoSaga)
    yield* spawn(accountSaga)
    yield* spawn(firebaseSaga)
    yield* spawn(tokensSaga)
    yield* spawn(positionsSaga)
    yield* spawn(localCurrencySaga)
    yield* spawn(transactionSaga)
    yield* spawn(homeSaga)
    yield* spawn(identitySaga)
    yield* spawn(recipientsSaga)
    yield* spawn(sendSaga)
    yield* spawn(jumpstartSaga)
    yield* spawn(importSaga)
    yield* spawn(checkAccountExistenceSaga)
    yield* spawn(fiatExchangesSaga)
    yield* spawn(walletConnectSaga)
    yield* spawn(checkAndroidMobileServicesSaga)
    yield* spawn(dappsSaga)
    yield* spawn(fiatConnectSaga)
    yield* spawn(swapSaga)
    yield* spawn(keylessBackupSaga)
    yield* spawn(nftsSaga)
    yield* spawn(priceHistorySaga)
    yield* spawn(pointsSaga)
    yield* spawn(earnSaga)
  } catch (error) {
    Logger.error('@rootSaga', 'Error while initializing sagas', error)
    // Propagate so it's handled by Sentry
    throw error
  } finally {
    sagasFinishedLoading = true
  }
}
