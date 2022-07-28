import { Result } from '@badrap/result'
import { CeloTxReceipt } from '@celo/connect'
import {
  FiatConnectApiClient,
  FiatConnectClient,
  ResponseError,
} from '@fiatconnect/fiatconnect-sdk'
import {
  FiatAccountType,
  GetFiatAccountsResponse,
  TransferResponse,
} from '@fiatconnect/fiatconnect-types'
import BigNumber from 'bignumber.js'
import { all, call, delay, put, select, spawn, takeLeading } from 'redux-saga/effects'
import { showError } from 'src/alert/actions'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
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
  attemptReturnUserFlow,
  attemptReturnUserFlowCompleted,
  createFiatConnectTransfer,
  createFiatConnectTransferCompleted,
  createFiatConnectTransferFailed,
  fetchFiatConnectProviders,
  fetchFiatConnectProvidersCompleted,
  fetchFiatConnectQuotes,
  fetchFiatConnectQuotesCompleted,
  fetchFiatConnectQuotesFailed,
  FiatAccount,
  fiatAccountUsed,
  selectFiatConnectQuote,
  selectFiatConnectQuoteCompleted,
} from 'src/fiatconnect/slice'
import { normalizeFiatConnectQuotes } from 'src/fiatExchanges/quotes/normalizeQuotes'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { UserLocationData } from 'src/networkInfo/saga'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import { buildAndSendPayment } from 'src/send/saga'
import { tokensListSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import { newTransactionContext } from 'src/transactions/types'
import { CiCoCurrency, Currency } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'
import { v4 as uuidv4 } from 'uuid'

const TAG = 'FiatConnectSaga'

export function* handleFetchFiatConnectQuotes({
  payload: params,
}: ReturnType<typeof fetchFiatConnectQuotes>) {
  const { flow, digitalAsset, cryptoAmount, providerIds } = params
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
      fiatConnectProviders: providerIds
        ? fiatConnectProviders.filter(({ id }) => providerIds.includes(id))
        : fiatConnectProviders,
    })
    yield put(fetchFiatConnectQuotesCompleted({ quotes }))
  } catch (error) {
    Logger.error(TAG, 'Could not fetch fiatconnect quotes', error)
    yield put(fetchFiatConnectQuotesFailed({ error: 'Could not fetch fiatconnect quotes' }))
  }
}
/**
 * This saga attempts to fetch a quote and matching fiatAccount for a provider that the user
 * has previously used in the CICO flow.
 * If successful: Navigates the user to the FiatConnectReview screen
 * If fail: Navigates the user to the SelectProvider screen
 */
export function* handleAttemptReturnUserFlow({
  payload: params,
}: ReturnType<typeof attemptReturnUserFlow>): any {
  const { amount, flow, selectedCrypto, providerId, fiatAccountId, fiatAccountType } = params
  const digitalAsset = {
    [Currency.Celo]: CiCoCurrency.CELO,
    [Currency.Dollar]: CiCoCurrency.CUSD,
    [Currency.Euro]: CiCoCurrency.CEUR,
  }[selectedCrypto]
  const fiatConnectProviders: FiatConnectProviderInfo[] | null = yield select(
    fiatConnectProvidersSelector
  )
  try {
    const [normalizedQuote, fiatAccount] = yield all([
      call(_getQuote, {
        digitalAsset,
        cryptoAmount: amount.crypto,
        flow,
        providerId,
        fiatAccountType,
      }),
      call(_getFiatAccount, {
        fiatConnectProviders,
        providerId,
        fiatAccountId,
      }),
    ])
    if (!fiatAccount) {
      throw new Error('Could not find fiat account')
    }
    // Successfully found quote and fiatAccount
    yield put(attemptReturnUserFlowCompleted())
    navigate(Screens.FiatConnectReview, {
      flow,
      normalizedQuote,
      fiatAccount,
    })
  } catch (error) {
    // Failed to find a quote and fiatAccount
    Logger.debug(
      TAG,
      'Failed to use previous fiatAccount to take user directly to Review Screen',
      error
    )
    yield put(attemptReturnUserFlowCompleted())
    // Navigate to Select Provider Screen
    navigate(Screens.SelectProvider, {
      flow,
      selectedCrypto,
      amount,
    })
  }
}

function* _getQuote({
  digitalAsset,
  cryptoAmount,
  flow,
  providerId,
  fiatAccountType,
}: {
  digitalAsset: CiCoCurrency
  cryptoAmount: number
  flow: CICOFlow
  providerId: string
  fiatAccountType: FiatAccountType
}) {
  // Fetch Quote associated with the cached providerId
  yield put(
    fetchFiatConnectQuotes({
      digitalAsset,
      cryptoAmount,
      flow,
      providerIds: [providerId],
    })
  )
  const quotes: (FiatConnectQuoteSuccess | FiatConnectQuoteError)[] = yield select(
    fiatConnectQuotesSelector
  )
  const normalizedQuotes = normalizeFiatConnectQuotes(flow, quotes)
  const normalizedQuote = normalizedQuotes.find(
    (q) => q.getFiatAccountType() === fiatAccountType && q.getProviderId() === providerId
  )
  if (!normalizedQuote) {
    throw new Error('Could not find quote')
  }
  return normalizedQuote
}

function* _getFiatAccount({
  fiatConnectProviders,
  providerId,
  fiatAccountId,
  fiatAccountType,
}: {
  fiatConnectProviders: FiatConnectProviderInfo[] | null
  providerId: string
  fiatAccountId?: string
  fiatAccountType?: FiatAccountType
}) {
  // Get the provider info
  const fiatConnectProvider = fiatConnectProviders?.find((provider) => provider.id === providerId)
  if (!fiatConnectProvider) {
    throw new Error('Could not find provider')
  }
  // Fetch Fiat Account associated with the cached providerId / fiatAccountId
  const fiatAccounts: FiatAccount[] = yield call(
    fetchFiatAccountsSaga,
    providerId,
    fiatConnectProvider.baseUrl
  )

  let fiatAccount: FiatAccount | undefined
  if (fiatAccountType) {
    fiatAccount = fiatAccounts.find((account) => account.fiatAccountType === fiatAccountType)
  } else if (fiatAccountId) {
    fiatAccount = fiatAccounts.find((account) => account.fiatAccountId === fiatAccountId)
  }
  return fiatAccount || null
}

export function* handleSelectFiatConnectQuote({
  payload: params,
}: ReturnType<typeof selectFiatConnectQuote>) {
  const { quote } = params
  try {
    // Check for an existing fiatAccount and navigate to Review if we find one
    // TODO: Also verify that fiatSchemaType matches once it is added to the fiatAccount spec
    const fiatAccount: FiatAccount = yield call(_getFiatAccount, {
      fiatConnectProviders: [quote.quote.provider],
      providerId: quote.getProviderId(),
      fiatAccountType: quote.getFiatAccountType(),
    })
    if (!fiatAccount) {
      // This is expected when the user has not yet created a fiatAccount with the provider
      navigate(Screens.FiatDetailsScreen, {
        quote,
        flow: quote.flow,
      })
      yield delay(500) // to avoid a screen flash
      yield put(selectFiatConnectQuoteCompleted())
      return
    }
    // Save the fiatAccount in cache
    yield put(
      fiatAccountUsed({
        providerId: quote.getProviderId(),
        fiatAccountId: fiatAccount.fiatAccountId,
        fiatAccountType: quote.getFiatAccountType(),
        flow: quote.flow,
        cryptoType: quote.getCryptoType(),
        fiatType: quote.getFiatType(),
      })
    )
    navigate(Screens.FiatConnectReview, {
      flow: quote.flow,
      normalizedQuote: quote,
      fiatAccount,
    })
    yield delay(500) // to avoid a screen flash
    yield put(selectFiatConnectQuoteCompleted())
  } catch (error) {
    // Error while attempting fetching the fiatConnect account
    Logger.debug(
      TAG,
      `handleSelectFiatConnectQuote* Error while attempting to fetch the fiatAccount for provider ${quote.getProviderId()}`,
      error
    )
    yield put(showError(ErrorMessages.PROVIDER_FETCH_FAILED))
  }
}

export function* fetchFiatAccountsSaga(providerId: string, baseUrl: string) {
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
  const fiatAccounts = Object.values(fiatAccountsResults)
    .flat()
    .map(
      (accountData) =>
        ({
          providerId,
          ...accountData,
        } as FiatAccount)
    )
  return fiatAccounts
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

      if (result.isErr) {
        ValoraAnalytics.track(FiatExchangeEvents.cico_fc_transfer_api_error, {
          flow,
          fiatConnectError: result.error.fiatConnectError,
          error: result.error.message,
          provider: fiatConnectQuote.getProviderId(),
        })
        throw result.error
      }

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
        ValoraAnalytics.track(FiatExchangeEvents.cico_fc_transfer_tx_error, {
          flow,
          error: error.message,
          transferAddress: transferResult.transferAddress,
          provider: fiatConnectQuote.getProviderId(),
        })
        throw error
      }

      ValoraAnalytics.track(FiatExchangeEvents.cico_fc_transfer_success, {
        txHash: receipt.transactionHash,
        transferAddress: transferResult.transferAddress,
        provider: fiatConnectQuote.getProviderId(),
        flow,
      })
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

export function* watchFetchFiatConnectProviders() {
  yield takeLeading(fetchFiatConnectProviders.type, handleFetchFiatConnectProviders)
}

export function* watchAttemptReturnUserFlow() {
  yield takeLeading(attemptReturnUserFlow.type, handleAttemptReturnUserFlow)
}

function* watchSelectFiatConnectQuote() {
  yield takeLeading(selectFiatConnectQuote.type, handleSelectFiatConnectQuote)
}

export function* fiatConnectSaga() {
  yield spawn(watchFetchFiatConnectQuotes)
  yield spawn(watchFiatConnectTransfers)
  yield spawn(watchFetchFiatConnectProviders)
  yield spawn(watchAttemptReturnUserFlow)
  yield spawn(watchSelectFiatConnectQuote)
}
