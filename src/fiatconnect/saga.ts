import { Result } from '@badrap/result'
import { CeloTxReceipt } from '@celo/connect'
import {
  FiatConnectApiClient,
  FiatConnectClient,
  ResponseError,
} from '@fiatconnect/fiatconnect-sdk'
import { GetFiatAccountsResponse, TransferResponse } from '@fiatconnect/fiatconnect-types'
import BigNumber from 'bignumber.js'
import { call, put, select, spawn, takeLeading } from 'redux-saga/effects'
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
import { fiatConnectProvidersSelector, fiatConnectQuotesSelector } from 'src/fiatconnect/selectors'
import {
  createFiatConnectTransfer,
  createFiatConnectTransferCompleted,
  createFiatConnectTransferFailed,
  fetchFiatConnectProviders,
  fetchFiatConnectProvidersCompleted,
  fetchFiatConnectQuotes,
  fetchFiatConnectQuotesCompleted,
  fetchFiatConnectQuotesFailed,
  fetchQuoteAndFiatAccount,
  fetchQuoteAndFiatAccountCompleted,
  fetchQuoteAndFiatAccountFailed,
  fiatAccountRemove,
} from 'src/fiatconnect/slice'
import { quoteHasErrors } from 'src/fiatExchanges/quotes/normalizeQuotes'
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

export function* handleFetchQuoteAndFiatAccount({
  payload: params,
}: ReturnType<typeof fetchQuoteAndFiatAccount>) {
  const { flow, digitalAsset, cryptoAmount, providerId, fiatAccountId, fiatAccountType } = params

  try {
    Logger.info(TAG, `Fetching quote for ${providerId}`)
    yield put(
      fetchFiatConnectQuotes({
        flow,
        digitalAsset,
        cryptoAmount,
        providerIds: [providerId],
      })
    )
    const quotes: (FiatConnectQuoteSuccess | FiatConnectQuoteError)[] = yield select(
      fiatConnectQuotesSelector
    )
    const quote = quotes[0]
    if (quoteHasErrors(quote)) {
      throw new Error(`Quote has errors: ${quote.error}`)
    }
    if (!Object.keys(quote.fiatAccount).includes(fiatAccountType)) {
      throw new Error(
        `Provider ${providerId} no longer supports the fiatAccountType ${fiatAccountType}`
      )
    }
    const fiatConnectClient: FiatConnectApiClient = yield call(
      getFiatConnectClient,
      quote.provider.id,
      quote.provider.baseUrl
    )

    Logger.info(TAG, `Fetching fiatAccounts for ${providerId}`)
    const fiatAccountsResponse: Result<GetFiatAccountsResponse, ResponseError> = yield call(
      fiatConnectClient.getFiatAccounts
    )
    if (fiatAccountsResponse.isErr) {
      throw new Error(`FiatAccount has errors: ${fiatAccountsResponse.error.message}`)
    }
    const fiatAccount = fiatAccountsResponse.value[fiatAccountType]?.find(
      (account) => account.fiatAccountId === fiatAccountId
    )
    if (!fiatAccount) {
      // If the fiatAccountId we have saved does not match any the provider has, then it must have been deleted.
      // In that case, remove it from our redux state.
      yield put(fiatAccountRemove({ providerId, fiatAccountId, fiatAccountType }))
      throw new Error(
        `Error: FiatAccount not found. fiatAccountId: ${fiatAccountId}, providerId: ${providerId}`
      )
    }
    yield put(fetchQuoteAndFiatAccountCompleted({ fiatAccount }))
  } catch (error) {
    Logger.debug(TAG, 'Fetching Quote and FiatAccount failed...', error)
    yield put(
      fetchQuoteAndFiatAccountFailed({
        error: `handleFetchQuoteAndFiatAccount failed. ${error.message}`,
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
    Logger.error(TAG, 'Error in *handleFetchFiatConnectProviders ', error)
  }
}

export function* watchFetchFiatConnectProviders() {
  yield takeLeading(fetchFiatConnectProviders.type, handleFetchFiatConnectProviders)
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

function* watchFiatConnectTransfers() {
  yield takeLeading(createFiatConnectTransfer.type, handleCreateFiatConnectTransfer)
}

export function* watchFetchFiatConnectQuotes() {
  yield takeLeading(fetchFiatConnectQuotes.type, handleFetchFiatConnectQuotes)
}

export function* watchFetchQuoteAndFiatAccount() {
  yield takeLeading(fetchQuoteAndFiatAccount.type, handleFetchQuoteAndFiatAccount)
}

export function* fiatConnectSaga() {
  yield spawn(watchFetchFiatConnectQuotes)
  yield spawn(watchFetchQuoteAndFiatAccount)
  yield spawn(watchFiatConnectTransfers)
  yield spawn(watchFetchFiatConnectProviders)
}
