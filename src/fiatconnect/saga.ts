import { Result } from '@badrap/result'
import { CeloTxReceipt } from '@celo/connect'
import {
  FiatConnectApiClient,
  FiatConnectClient,
  ResponseError,
} from '@fiatconnect/fiatconnect-sdk'
import {
  FiatAccountSchemas,
  FiatAccountType,
  FiatConnectError,
  GetFiatAccountsResponse,
  KycStatus as FiatConnectKycStatus,
  PostFiatAccountResponse,
  TransferResponse,
} from '@fiatconnect/fiatconnect-types'
import BigNumber from 'bignumber.js'
import { all, call, delay, put, select, spawn, takeLeading } from 'redux-saga/effects'
import { KycStatus as PersonaKycStatus } from 'src/account/reducer'
import { showError, showMessage } from 'src/alert/actions'
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
import { fiatConnectProvidersSelector } from 'src/fiatconnect/selectors'
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
  kycTryAgain,
  kycTryAgainCompleted,
  refetchQuote,
  refetchQuoteCompleted,
  refetchQuoteFailed,
  selectFiatConnectQuote,
  selectFiatConnectQuoteCompleted,
  submitFiatAccount,
  submitFiatAccountCompleted,
  submitFiatAccountKycApproved,
} from 'src/fiatconnect/slice'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { normalizeFiatConnectQuotes } from 'src/fiatExchanges/quotes/normalizeQuotes'
import { CICOFlow } from 'src/fiatExchanges/utils'
import i18n from 'src/i18n'
import { deleteKyc, getKycStatus, GetKycStatusResponse, postKyc } from 'src/in-house-liquidity'
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
import { CiCoCurrency, Currency, resolveCICOCurrency } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'
import { v4 as uuidv4 } from 'uuid'

const TAG = 'FiatConnectSaga'

const KYC_WAIT_TIME_MILLIS = 3000

export function* handleFetchFiatConnectQuotes({
  payload: params,
}: ReturnType<typeof fetchFiatConnectQuotes>) {
  const { flow, digitalAsset, cryptoAmount, providerIds } = params
  try {
    const quotes: (FiatConnectQuoteSuccess | FiatConnectQuoteError)[] = yield call(_getQuotes, {
      flow,
      digitalAsset,
      cryptoAmount,
      providerIds,
    })
    yield put(fetchFiatConnectQuotesCompleted({ quotes }))
  } catch (error) {
    Logger.error(TAG, 'Could not fetch fiatconnect quotes', error)
    yield put(fetchFiatConnectQuotesFailed({ error: 'Could not fetch fiatconnect quotes' }))
  }
}

/**
 * Handles Refetching a single quote for the Review Screen
 */
export function* handleRefetchQuote({ payload: params }: ReturnType<typeof refetchQuote>) {
  const { quote, flow, fiatAccount } = params
  try {
    const newQuote: FiatConnectQuote = yield call(_getSpecificQuote, {
      flow,
      digitalAsset: resolveCICOCurrency(quote.getCryptoType()),
      cryptoAmount: parseFloat(quote.getCryptoAmount()),
      providerId: quote.getProviderId(),
      fiatAccountType: fiatAccount.fiatAccountType,
    })
    yield put(refetchQuoteCompleted())
    navigate(Screens.FiatConnectReview, {
      flow,
      normalizedQuote: newQuote,
      fiatAccount,
      shouldRefetchQuote: false,
    })
  } catch (error) {
    Logger.debug(TAG, 'handleRefetchQuote: could not refetch quote', error)
    yield put(refetchQuoteFailed({ error: 'could not refetch quote' }))
  }
}

export function* handleSubmitFiatAccount({
  payload: params,
}: ReturnType<typeof submitFiatAccount>): any {
  const { flow, quote, fiatAccountData } = params
  const fiatAccountSchema = quote.getFiatAccountSchema()

  const fiatConnectClient: FiatConnectApiClient = yield call(
    getFiatConnectClient,
    quote.getProviderId(),
    quote.getProviderBaseUrl(),
    quote.getProviderApiKey()
  )
  const postFiatAccountResponse: Result<PostFiatAccountResponse, ResponseError> = yield call(
    [fiatConnectClient, 'addFiatAccount'],
    {
      fiatAccountSchema,
      data: fiatAccountData as FiatAccountSchemas[typeof fiatAccountSchema],
    }
  )

  if (postFiatAccountResponse.isOk) {
    yield put(
      showMessage(
        i18n.t('fiatDetailsScreen.addFiatAccountSuccess', { provider: quote.getProviderName() })
      )
    )
    ValoraAnalytics.track(FiatExchangeEvents.cico_fiat_details_success, {
      flow,
      provider: quote.getProviderId(),
      fiatAccountSchema,
    })
    // Record this fiat account as the most recently used
    const { fiatAccountId, fiatAccountType } = postFiatAccountResponse.value
    yield put(
      fiatAccountUsed({
        providerId: quote.getProviderId(),
        fiatAccountId,
        fiatAccountType,
        flow,
        cryptoType: quote.getCryptoType(),
        fiatType: quote.getFiatType(),
      })
    )

    // If KYC is required, only proceed to Review screen if it's been approved.
    // If any unexpected error is encountered, just show the pending screen,
    // since the account has already been added. Otherwise, show the appropriate
    // status screen.
    const kycSchema = quote.getKycSchema()
    if (kycSchema) {
      try {
        // If and only if KYC is required, we wait a bit to give KYC some time to process.
        yield delay(KYC_WAIT_TIME_MILLIS)
        const getKycStatusResponse = yield call(getKycStatus, {
          providerInfo: quote.quote.provider,
          kycSchemas: [kycSchema],
        })
        const fiatConnectKycStatus = getKycStatusResponse.kycStatus[kycSchema]
        switch (fiatConnectKycStatus) {
          case FiatConnectKycStatus.KycApproved:
            yield put(submitFiatAccountKycApproved())
            yield delay(500) // Allow user to admire green checkmark
            break
          // Denied, Expired, and Pending all fall through to the default case.
          case FiatConnectKycStatus.KycDenied:
            navigate(Screens.KycDenied, {
              flow,
              quote,
              retryable: true, // TODO: Get this dynamically once IHL supports it
            })
          case FiatConnectKycStatus.KycExpired:
            navigate(Screens.KycExpired, {
              flow,
              quote,
            })
          case FiatConnectKycStatus.KycPending:
            navigate(Screens.KycPending, {
              flow,
              quote,
            })
          default:
            yield delay(500) // to avoid a screen flash
            yield put(submitFiatAccountCompleted())
            return
        }
      } catch (error) {
        Logger.error(
          TAG,
          `Error while checking KYC status after successfully submitting fiat account: ${error}`
        )
        navigate(Screens.KycPending, {
          flow,
          quote,
        })
        yield delay(500) // to avoid a screen flash
        yield put(submitFiatAccountCompleted())
        return
      }
    }

    navigate(Screens.FiatConnectReview, {
      flow,
      normalizedQuote: quote,
      fiatAccount: postFiatAccountResponse.value,
    })
    yield delay(500) // to avoid a screen flash
    yield put(submitFiatAccountCompleted())
  } else {
    yield put(submitFiatAccountCompleted())
    Logger.error(
      TAG,
      `Error adding fiat account: ${
        postFiatAccountResponse.error.fiatConnectError ?? postFiatAccountResponse.error.message
      }`
    )
    ValoraAnalytics.track(FiatExchangeEvents.cico_fiat_details_error, {
      flow,
      provider: quote.getProviderId(),
      fiatAccountSchema,
      fiatConnectError: postFiatAccountResponse.error.fiatConnectError,
      error: postFiatAccountResponse.error.message,
    })
    if (postFiatAccountResponse.error.fiatConnectError === FiatConnectError.ResourceExists) {
      yield put(
        showError(
          i18n.t('fiatDetailsScreen.addFiatAccountResourceExist', {
            provider: quote.getProviderName(),
          })
        )
      )
    } else {
      yield put(
        showError(
          i18n.t('fiatDetailsScreen.addFiatAccountFailed', { provider: quote.getProviderName() })
        )
      )
    }
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
    const [normalizedQuote, fiatAccount]: [FiatConnectQuote, FiatAccount | null] = yield all([
      call(_getSpecificQuote, {
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
    const kycSchema = normalizedQuote.getKycSchema()
    if (kycSchema) {
      const getKycStatusResponse: GetKycStatusResponse = yield call(getKycStatus, {
        providerInfo: normalizedQuote.getProviderInfo(),
        kycSchemas: [kycSchema],
      })

      const kycStatus = getKycStatusResponse.kycStatus[kycSchema]

      switch (kycStatus) {
        case FiatConnectKycStatus.KycNotCreated:
          // If no KYC with stored provider, navigate to SelectProvider
          throw new Error('KYC not created')
        case FiatConnectKycStatus.KycApproved:
          // If KYC approved with provider, continue to FiatConnectReview
          break
        // On any other KYC state, navigate to corresponding KYC screen
        case FiatConnectKycStatus.KycPending:
          yield put(attemptReturnUserFlowCompleted())
          navigate(Screens.KycPending, {
            flow: normalizedQuote.flow,
            quote: normalizedQuote,
          })
          return
        case FiatConnectKycStatus.KycDenied:
          yield put(attemptReturnUserFlowCompleted())
          navigate(Screens.KycDenied, {
            flow: normalizedQuote.flow,
            quote: normalizedQuote,
            retryable: true, // TODO: Get this dynamically once IHL supports it
          })
          return
        case FiatConnectKycStatus.KycExpired:
          yield put(attemptReturnUserFlowCompleted())
          navigate(Screens.KycExpired, {
            flow: normalizedQuote.flow,
            quote: normalizedQuote,
          })
          return
        default:
          throw new Error(
            `Unrecognized FiatConnect KYC status "${kycStatus}" while attempting to handle quote selection for provider ${normalizedQuote.getProviderId()}`
          )
      }
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

export function* _getQuotes({
  digitalAsset,
  cryptoAmount,
  flow,
  providerIds,
}: {
  digitalAsset: CiCoCurrency
  cryptoAmount: number
  flow: CICOFlow
  providerIds?: string[]
}) {
  const userLocation: UserLocationData = yield select(userLocationDataSelector)
  const localCurrency: LocalCurrencyCode = yield select(getLocalCurrencyCode)
  const fiatConnectCashInEnabled: boolean = yield select(fiatConnectCashInEnabledSelector)
  const fiatConnectCashOutEnabled: boolean = yield select(fiatConnectCashOutEnabledSelector)
  const fiatConnectProviders: FiatConnectProviderInfo[] | null = yield select(
    fiatConnectProvidersSelector
  )
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
  return quotes
}

export function* _getSpecificQuote({
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
  const quotes: (FiatConnectQuoteSuccess | FiatConnectQuoteError)[] = yield call(_getQuotes, {
    flow,
    digitalAsset,
    cryptoAmount,
    providerIds: [providerId],
  })
  const normalizedQuotes = normalizeFiatConnectQuotes(flow, quotes)
  const normalizedQuote = normalizedQuotes.find((q) => q.getFiatAccountType() === fiatAccountType)
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
    fiatConnectProvider.baseUrl,
    fiatConnectProvider.apiKey
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
    // If KYC is required for the quote, check that the user has correct KYC on file
    // with the quote's provider
    let getKycStatusResponse: GetKycStatusResponse
    const kycSchema = quote.getKycSchema()
    if (kycSchema) {
      getKycStatusResponse = yield call(getKycStatus, {
        providerInfo: quote.getProviderInfo(),
        kycSchemas: [kycSchema],
      })
      const fiatConnectKycStatus = getKycStatusResponse.kycStatus[kycSchema]
      switch (fiatConnectKycStatus) {
        case FiatConnectKycStatus.KycNotCreated:
          if (getKycStatusResponse.persona === PersonaKycStatus.Approved) {
            // If user has Persona KYC on file, just submit it and continue to account management
            yield call(postKyc, {
              providerInfo: quote.quote.provider,
              kycSchema,
            })
            break
          } else {
            // If no Persona KYC on file, navigate to Persona
            navigate(Screens.KycLanding, {
              flow: quote.flow,
              quote,
              personaKycStatus: getKycStatusResponse.persona,
              step: 'one',
            })
            yield put(selectFiatConnectQuoteCompleted())
            return
          }
        // If approved or pending, continue as normal and handle account management
        case FiatConnectKycStatus.KycApproved:
        case FiatConnectKycStatus.KycPending:
          break
        // If denied or expired, skip account management and
        // navigate to the KYC status screen
        case FiatConnectKycStatus.KycDenied:
          navigate(Screens.KycDenied, {
            flow: quote.flow,
            quote,
            retryable: true, // TODO: Get this dynamically once IHL supports it
          })
          yield put(selectFiatConnectQuoteCompleted())
          return
        case FiatConnectKycStatus.KycExpired:
          navigate(Screens.KycExpired, {
            flow: quote.flow,
            quote,
          })
          yield put(selectFiatConnectQuoteCompleted())
          return
        default:
          throw new Error(
            `Unrecognized FiatConnect KYC status "${fiatConnectKycStatus}" while attempting to handle quote selection for provider ${quote.getProviderId()}`
          )
      }
    }

    // Check for an existing fiatAccount and navigate to Review if we find one
    // TODO: Also verify that fiatSchemaType matches once it is added to the fiatAccount spec
    const fiatAccount: FiatAccount = yield call(_getFiatAccount, {
      fiatConnectProviders: [quote.quote.provider],
      providerId: quote.getProviderId(),
      fiatAccountType: quote.getFiatAccountType(),
    })

    // This is expected when the user has not yet created a fiatAccount with the provider
    if (!fiatAccount) {
      // If the quote has kyc, navigate to the second step of the KycLanding page
      if (kycSchema) {
        navigate(Screens.KycLanding, {
          quote,
          flow: quote.flow,
          step: 'two',
        })
      } else {
        navigate(Screens.FiatConnectLinkAccount, {
          quote,
          flow: quote.flow,
        })
        yield delay(500) // to avoid a screen flash
      }

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

    // If the quote required KYC, only proceed to the Review screen if it's approved
    if (
      kycSchema &&
      getKycStatusResponse!.kycStatus[kycSchema] !== FiatConnectKycStatus.KycApproved
    ) {
      navigate(Screens.KycPending, {
        flow: quote.flow,
        quote,
      })
    } else {
      navigate(Screens.FiatConnectReview, {
        flow: quote.flow,
        normalizedQuote: quote,
        fiatAccount,
      })
    }

    yield delay(500) // to avoid a screen flash
    yield put(selectFiatConnectQuoteCompleted())
  } catch (error) {
    // Error while attempting fetching the fiatConnect account
    Logger.debug(
      TAG,
      `handleSelectFiatConnectQuote* Error while attempting to handle quote selection for provider ${quote.getProviderId()}`,
      error
    )
    yield put(selectFiatConnectQuoteCompleted())
    yield put(showError(ErrorMessages.PROVIDER_FETCH_FAILED))
    const amount = {
      crypto: parseFloat(quote.getCryptoAmount()),
      fiat: parseFloat(quote.getFiatAmount()),
    }
    navigate(Screens.SelectProvider, {
      flow: quote.flow,
      selectedCrypto: quote.getCryptoType(),
      amount: amount,
    })
  }
}

export function* fetchFiatAccountsSaga(
  providerId: string,
  baseUrl: string,
  apiKey: string | undefined
) {
  const fiatConnectClient: FiatConnectApiClient = yield call(
    getFiatConnectClient,
    providerId,
    baseUrl,
    apiKey
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
        fiatConnectQuote.getProviderBaseUrl(),
        fiatConnectQuote.getProviderApiKey()
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

export function* handleKycTryAgain({ payload }: ReturnType<typeof kycTryAgain>) {
  const { quote, flow } = payload

  try {
    const kycSchema = quote.getKycSchema()
    if (!kycSchema) {
      // it is impossible for kyc schema to be undefined on the quote, but
      // throwing explicitly so its logged
      throw new Error('No KYC Schema found in quote')
    }
    yield call(deleteKyc, {
      providerInfo: quote.getProviderInfo(),
      kycSchema,
    })

    navigate(Screens.KycLanding, { quote, flow, step: 'one' })
  } catch (error) {
    Logger.error(TAG, 'Kyc try again failed', error)
    yield put(showError(ErrorMessages.KYC_TRY_AGAIN_FAILED))
  } finally {
    yield put(kycTryAgainCompleted())
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

function* watchRefetchQuote() {
  yield takeLeading(refetchQuote.type, handleRefetchQuote)
}

function* watchSubmitFiatAccount() {
  yield takeLeading(submitFiatAccount.type, handleSubmitFiatAccount)
}

function* watchKycTryAgain() {
  yield takeLeading(kycTryAgain.type, handleKycTryAgain)
}

export function* fiatConnectSaga() {
  yield spawn(watchFetchFiatConnectQuotes)
  yield spawn(watchFiatConnectTransfers)
  yield spawn(watchFetchFiatConnectProviders)
  yield spawn(watchAttemptReturnUserFlow)
  yield spawn(watchSelectFiatConnectQuote)
  yield spawn(watchRefetchQuote)
  yield spawn(watchSubmitFiatAccount)
  yield spawn(watchKycTryAgain)
}
