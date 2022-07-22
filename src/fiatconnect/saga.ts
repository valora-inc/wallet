import { Result } from '@badrap/result'
import { CeloTxReceipt } from '@celo/connect'
import {
  FiatConnectApiClient,
  FiatConnectClient,
  ResponseError,
} from '@fiatconnect/fiatconnect-sdk'
import { GetFiatAccountsResponse, TransferResponse } from '@fiatconnect/fiatconnect-types'
import BigNumber from 'bignumber.js'
import { call, put, select, spawn, takeEvery, takeLeading } from 'redux-saga/effects'
import {
  fiatConnectCashInEnabledSelector,
  fiatConnectCashOutEnabledSelector,
} from 'src/app/selectors'
import { FeeType, State as FeeEstimatesState } from 'src/fees/reducer'
import { feeEstimatesSelector } from 'src/fees/selectors'
import {
  fetchQuotes,
  FiatConnectProviderInfo,
  FiatConnectQuoteError,
  FiatConnectQuoteSuccess,
  getFiatConnectProviders,
} from 'src/fiatconnect'
import { getFiatConnectClient } from 'src/fiatconnect/clients'
import {
  cachedFiatAccountsSelector,
  fiatAccountsSelector,
  fiatConnectProvidersSelector,
} from 'src/fiatconnect/selectors'
import {
  createFiatConnectTransfer,
  createFiatConnectTransferCompleted,
  createFiatConnectTransferFailed,
  fetchFiatAccounts,
  fetchFiatAccountsCompleted,
  fetchFiatAccountsFailed,
  fetchFiatConnectProviders,
  fetchFiatConnectProvidersCompleted,
  fetchFiatConnectProvidersFailed,
  fetchFiatConnectQuotes,
  fetchFiatConnectQuotesCompleted,
  fetchFiatConnectQuotesFailed,
  FiatAccount,
  fiatAccountUsed,
} from 'src/fiatconnect/slice'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { UserLocationData } from 'src/networkInfo/saga'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import { buildAndSendPayment } from 'src/send/saga'
import { TokenBalance } from 'src/tokens/reducer'
import { tokensListSelector } from 'src/tokens/selectors'
import { newTransactionContext } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'
import { v4 as uuidv4 } from 'uuid'

const TAG = 'FiatConnectSaga'

export function* handleFetchFiatConnectQuotes({
  payload: params,
}: ReturnType<typeof fetchFiatConnectQuotes>) {
  const { flow, digitalAsset, cryptoAmount } = params
  const userLocation: UserLocationData = yield select(userLocationDataSelector)
  const localCurrency: LocalCurrencyCode = yield select(getLocalCurrencyCode)
  const fiatConnectCashInEnabled: boolean = yield select(fiatConnectCashInEnabledSelector)
  const fiatConnectCashOutEnabled: boolean = yield select(fiatConnectCashOutEnabledSelector)
  const fiatConnectProviders: FiatConnectProviderInfo[] | null = yield select(
    fiatConnectProvidersSelector
  )

  try {
    // null fiatConnectProviders means the providers have never successfully been fetched
    if (!fiatConnectProviders) {
      throw new Error('Error fetching fiatconnect providers')
    }
    const quotes: (FiatConnectQuoteSuccess | FiatConnectQuoteError)[] = yield call(fetchQuotes, {
      localCurrency,
      digitalAsset,
      cryptoAmount,
      country: userLocation?.countryCodeAlpha2 || 'US',
      flow,
      fiatConnectCashInEnabled,
      fiatConnectCashOutEnabled,
      fiatConnectProviders,
    })
    yield put(fetchFiatConnectQuotesCompleted({ quotes }))
  } catch (error) {
    Logger.error(TAG, 'Could not fetch fiatconnect quotes', error)
    yield put(fetchFiatConnectQuotesFailed({ error: 'Could not fetch fiatconnect quotes' }))
  }
}

export function* handleFetchFiatAccounts({
  payload: params,
}: ReturnType<typeof fetchFiatAccounts>) {
  const { providerId, baseUrl } = params

  try {
    const fiatConnectClient: FiatConnectApiClient = yield call(
      getFiatConnectClient,
      providerId,
      baseUrl
    )
    const fiatAccountsResponse: Result<GetFiatAccountsResponse, ResponseError> = yield call([
      fiatConnectClient,
      'getFiatAccounts',
    ])

    const fiatAccountsResults = fiatAccountsResponse.unwrap()
    const fiatAccounts: FiatAccount[] = Object.values(fiatAccountsResults)
      .flat()
      .map((accountData) => ({
        providerId,
        supportedFlows: [],
        ...accountData,
      })) as FiatAccount[]
    yield put(fetchFiatAccountsCompleted({ fiatAccounts }))
  } catch (error) {
    Logger.debug(TAG, 'Fetching FiatAccounts failed...', error)
    yield put(
      fetchFiatAccountsFailed({
        error: `handleFetchFiatAccounts failed. ${error}`,
      })
    )
  }
}

export function* handleFetchFiatConnectProviders() {
  const account: string = yield select(currentAccountSelector)
  try {
    if (!account) {
      throw new Error('Cannot fetch fiatconnect providers without an account')
    }
    const providers: FiatConnectProviderInfo[] = yield call(getFiatConnectProviders, account)
    yield put(fetchFiatConnectProvidersCompleted({ providers }))
  } catch (error) {
    yield put(fetchFiatConnectProvidersFailed())
    Logger.error(TAG, 'Error in *handleFetchFiatConnectProviders ', error)
  }
}

export function* handleCreateFiatConnectTransfer({
  payload: params,
}: ReturnType<typeof createFiatConnectTransfer>) {
  const { flow, fiatConnectQuote, fiatAccountId } = params
  const quoteId = fiatConnectQuote.getQuoteId()

  if (flow === CICOFlow.CashOut) {
    try {
      Logger.info(TAG, 'Starting transfer out..')
      const fiatConnectClient: FiatConnectClient = yield call(
        getFiatConnectClient,
        fiatConnectQuote.getProviderId(),
        fiatConnectQuote.getProviderBaseUrl()
      )
      const result: Result<TransferResponse, ResponseError> = yield call(
        [fiatConnectClient, 'transferOut'],
        {
          idempotencyKey: uuidv4(),
          data: { quoteId, fiatAccountId },
        }
      )
      const transferResult = result.unwrap()

      Logger.info(
        TAG,
        'Transfer out succeeded. Starting transaction..',
        JSON.stringify(transferResult)
      )

      const tokenList: TokenBalance[] = yield select(tokensListSelector)
      const tokenInfo = tokenList.find(
        (token) => token.symbol === fiatConnectQuote.getCryptoType()
      )!

      const feeEstimates: FeeEstimatesState['estimates'] = yield select(feeEstimatesSelector)
      const feeInfo = feeEstimates[tokenInfo.address]?.[FeeType.SEND]?.feeInfo

      const context = newTransactionContext(TAG, 'Send crypto to provider for transfer out')

      const { receipt, error }: { receipt: CeloTxReceipt; error: any } = yield call(
        buildAndSendPayment,
        context,
        transferResult.transferAddress,
        new BigNumber(fiatConnectQuote.getCryptoAmount()),
        tokenInfo.address,
        '',
        feeInfo!
      )

      if (error) {
        throw error
      }

      yield put(
        createFiatConnectTransferCompleted({
          flow,
          quoteId,
          txHash: receipt.transactionHash,
        })
      )
    } catch (err) {
      Logger.error(TAG, 'Transfer out failed..', err)
      yield put(createFiatConnectTransferFailed({ flow, quoteId }))
    }
  } else {
    throw new Error('not implemented')
  }
}

/**
 * This saga is meant to only run when a user succesfully fetches fiatConnectProviders
 * and only actually fetches fiatAccounts when cachedFiatAccounts has not been instantiated yet.
 * This is designed to replenish the cache in a scenario where the user restored their wallet and lost redux state.
 */
export function* handleFetchAndCacheFiatAccounts({
  payload: params,
}: ReturnType<typeof fetchFiatConnectProvidersCompleted>) {
  const cachedFiatAccounts: FiatAccount[] | null = yield select(cachedFiatAccountsSelector)

  if (!cachedFiatAccounts) {
    const { providers } = params
    for (const { id, baseUrl } of providers) {
      try {
        yield put(fetchFiatAccounts({ providerId: id, baseUrl }))
        const fiatAccounts: FiatAccount[] = yield select(fiatAccountsSelector)
        for (const fiatAccount of fiatAccounts) {
          yield put(fiatAccountUsed(fiatAccount))
        }
      } catch (error) {
        Logger.error(TAG, `Failed to retrieve FiatAccounts for provider ${id}`, error)
      }
    }
  }
}

function* watchFiatConnectTransfers() {
  yield takeLeading(createFiatConnectTransfer.type, handleCreateFiatConnectTransfer)
}

export function* watchFetchFiatConnectQuotes() {
  yield takeLeading(fetchFiatConnectQuotes.type, handleFetchFiatConnectQuotes)
}

export function* watchFetchFiatAccounts() {
  yield takeEvery(fetchFiatAccounts.type, handleFetchFiatAccounts)
}

export function* watchFetchFiatConnectProviders() {
  yield takeLeading(fetchFiatConnectProviders.type, handleFetchFiatConnectProviders)
}

function* watchFetchFiatConnectProvidersCompleted() {
  yield takeLeading(fetchFiatConnectProvidersCompleted.type, handleFetchAndCacheFiatAccounts)
}

export function* fiatConnectSaga() {
  yield spawn(watchFetchFiatConnectQuotes)
  yield spawn(watchFetchFiatAccounts)
  yield spawn(watchFiatConnectTransfers)
  yield spawn(watchFetchFiatConnectProviders)
  yield spawn(watchFetchFiatConnectProvidersCompleted)
}
