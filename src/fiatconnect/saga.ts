import { Result } from '@badrap/result'
import { FiatConnectApiClient, ResponseError } from '@fiatconnect/fiatconnect-sdk'
import {
  FiatAccountSchema,
  FiatAccountType,
  FiatConnectError,
  KycStatus as FiatConnectKycStatus,
  GetFiatAccountsResponse,
  PostFiatAccountRequestBody,
  PostFiatAccountResponse,
  TransferResponse,
} from '@fiatconnect/fiatconnect-types'
import BigNumber from 'bignumber.js'
import { KycStatus as PersonaKycStatus } from 'src/account/reducer'
import { showError, showMessage } from 'src/alert/actions'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import {
  fiatConnectCashInEnabledSelector,
  fiatConnectCashOutEnabledSelector,
} from 'src/app/selectors'
import { FeeInfo } from 'src/fees/saga'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { normalizeFiatConnectQuotes } from 'src/fiatExchanges/quotes/normalizeQuotes'
import { CICOFlow } from 'src/fiatExchanges/utils'
import {
  FiatConnectProviderInfo,
  FiatConnectQuoteError,
  FiatConnectQuoteSuccess,
  fetchQuotes,
  getFiatConnectProviders,
} from 'src/fiatconnect'
import { getFiatConnectClient } from 'src/fiatconnect/clients'
import { fiatConnectProvidersSelector } from 'src/fiatconnect/selectors'
import {
  FiatAccount,
  attemptReturnUserFlow,
  attemptReturnUserFlowCompleted,
  cacheFiatConnectTransfer,
  cacheQuoteParams,
  createFiatConnectTransfer,
  createFiatConnectTransferCompleted,
  createFiatConnectTransferFailed,
  createFiatConnectTransferTxProcessing,
  fetchFiatConnectProviders,
  fetchFiatConnectProvidersCompleted,
  fetchFiatConnectProvidersFailed,
  fetchFiatConnectQuotes,
  fetchFiatConnectQuotesCompleted,
  fetchFiatConnectQuotesFailed,
  fiatAccountUsed,
  kycTryAgain,
  kycTryAgainCompleted,
  personaFinished,
  postKyc as postKycAction,
  refetchQuote,
  refetchQuoteCompleted,
  refetchQuoteFailed,
  selectFiatConnectQuote,
  selectFiatConnectQuoteCompleted,
  submitFiatAccount,
  submitFiatAccountCompleted,
  submitFiatAccountKycApproved,
} from 'src/fiatconnect/slice'
import { FiatConnectTxError } from 'src/fiatconnect/types'
import i18n from 'src/i18n'
import { GetKycStatusResponse, deleteKyc, getKycStatus, postKyc } from 'src/in-house-liquidity'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { UserLocationData } from 'src/networkInfo/saga'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import { buildAndSendPayment } from 'src/send/saga'
import { tokensListWithAddressSelector } from 'src/tokens/selectors'
import { TokenBalanceWithAddress } from 'src/tokens/slice'
import { isTxPossiblyPending } from 'src/transactions/send'
import { newTransactionContext } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { ensureError } from 'src/utils/ensureError'
import { safely } from 'src/utils/safely'
import { walletAddressSelector } from 'src/web3/selectors'
import { call, delay, put, race, select, spawn, take, takeLeading } from 'typed-redux-saga'
import { v4 as uuidv4 } from 'uuid'

const TAG = 'FiatConnectSaga'

const KYC_WAIT_TIME_MILLIS = 3000

const PERSONA_SUCCESS_STATUSES = new Set([PersonaKycStatus.Approved, PersonaKycStatus.Completed])

export function* handleFetchFiatConnectQuotes({
  payload: params,
}: ReturnType<typeof fetchFiatConnectQuotes>) {
  const { flow, digitalAsset, cryptoAmount, fiatAmount, providerIds } = params
  try {
    const quotes: (FiatConnectQuoteSuccess | FiatConnectQuoteError)[] = yield* call(_getQuotes, {
      flow,
      digitalAsset,
      cryptoAmount,
      fiatAmount,
      providerIds,
    })
    yield* put(fetchFiatConnectQuotesCompleted({ quotes }))
  } catch (error) {
    Logger.error(TAG, 'Could not fetch fiatconnect quotes', error)
    yield* put(fetchFiatConnectQuotesFailed({ error: 'Could not fetch fiatconnect quotes' }))
  }
}

/**
 * Handles Refetching a single quote for the Review Screen.
 */
export function* handleRefetchQuote({ payload: params }: ReturnType<typeof refetchQuote>) {
  const { flow, cryptoType, cryptoAmount, fiatAmount, providerId, fiatAccount, tokenId } = params
  try {
    const {
      normalizedQuote,
      selectedFiatAccount,
    }: {
      normalizedQuote: FiatConnectQuote
      selectedFiatAccount: FiatAccount
    } = yield* call(_getSpecificQuote, {
      flow,
      digitalAsset: cryptoType,
      cryptoAmount: parseFloat(cryptoAmount),
      fiatAmount: parseFloat(fiatAmount),
      providerId: providerId,
      fiatAccount: fiatAccount,
      tokenId,
    })

    yield* put(refetchQuoteCompleted())

    navigate(Screens.FiatConnectReview, {
      flow,
      normalizedQuote,
      fiatAccount: selectedFiatAccount,
      shouldRefetchQuote: false,
    })
  } catch (error) {
    Logger.debug(TAG, 'handleRefetchQuote: could not refetch quote', error)
    yield* put(refetchQuoteFailed({ error: 'could not refetch quote' }))
  }
}

export function* handleSubmitFiatAccount({
  payload: params,
}: ReturnType<typeof submitFiatAccount>): any {
  const { flow, quote, fiatAccountData } = params
  const fiatAccountSchema = quote.getFiatAccountSchema()

  const fiatConnectClient: FiatConnectApiClient = yield* call(
    getFiatConnectClient,
    quote.getProviderId(),
    quote.getProviderBaseUrl(),
    quote.getProviderApiKey()
  )

  const postFiatAccountResponse: Result<PostFiatAccountResponse, ResponseError> = yield* call(
    { context: fiatConnectClient, fn: fiatConnectClient.addFiatAccount },
    {
      fiatAccountSchema,
      data: fiatAccountData,
    } as PostFiatAccountRequestBody
  )

  if (postFiatAccountResponse.isOk) {
    yield* put(
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
    yield* put(
      fiatAccountUsed({
        providerId: quote.getProviderId(),
        fiatAccountId,
        fiatAccountType,
        fiatAccountSchema,
        flow,
        cryptoType: quote.getCryptoCurrency(),
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
        yield* delay(KYC_WAIT_TIME_MILLIS)
        const getKycStatusResponse = yield* call(getKycStatus, {
          providerInfo: quote.quote.provider,
          kycSchemas: [kycSchema],
        })
        const fiatConnectKycStatus = getKycStatusResponse.kycStatus[kycSchema]
        switch (fiatConnectKycStatus) {
          case FiatConnectKycStatus.KycApproved:
            yield* put(submitFiatAccountKycApproved())
            yield* delay(500) // Allow user to admire green checkmark
            break
          case FiatConnectKycStatus.KycDenied:
            navigate(Screens.KycDenied, {
              flow,
              quote,
              retryable: true, // TODO: Get this dynamically once IHL supports it
            })
            yield* delay(500) // to avoid a screen flash
            yield* put(submitFiatAccountCompleted())
            return
          case FiatConnectKycStatus.KycExpired:
            navigate(Screens.KycExpired, {
              flow,
              quote,
            })
            yield* delay(500) // to avoid a screen flash
            yield* put(submitFiatAccountCompleted())
            return
          case FiatConnectKycStatus.KycPending:
            navigate(Screens.KycPending, {
              flow,
              quote,
            })
            yield* delay(500) // to avoid a screen flash
            yield* put(submitFiatAccountCompleted())
            return
          default:
            throw new Error(
              `Unrecognized FiatConnect KYC status "${fiatConnectKycStatus}" while attempting to handle quote selection for provider ${quote.getProviderId()}`
            )
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
        yield* delay(500) // to avoid a screen flash
        yield* put(submitFiatAccountCompleted())
        return
      }
    }

    navigate(Screens.FiatConnectReview, {
      flow,
      normalizedQuote: quote,
      fiatAccount: Object.assign(postFiatAccountResponse.value, {
        providerId: quote.getProviderId(),
      }),
    })
    yield* delay(500) // to avoid a screen flash
    yield* put(submitFiatAccountCompleted())
  } else {
    yield* put(submitFiatAccountCompleted())
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
      yield* put(
        showError(
          i18n.t('fiatDetailsScreen.addFiatAccountResourceExist', {
            provider: quote.getProviderName(),
          })
        )
      )
    } else {
      yield* put(
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
  const {
    amount,
    flow,
    selectedCrypto,
    providerId,
    fiatAccountId,
    fiatAccountType,
    fiatAccountSchema,
    tokenId,
  } = params

  const fiatConnectProviders: FiatConnectProviderInfo[] | null = yield* select(
    fiatConnectProvidersSelector
  )
  try {
    const fiatAccount: FiatAccount | null = yield* call(_getFiatAccount, {
      fiatConnectProviders,
      providerId,
      fiatAccountId,
      fiatAccountType,
      fiatAccountSchema,
    })
    if (!fiatAccount) {
      throw new Error('Could not find fiat account')
    }
    const { normalizedQuote }: { normalizedQuote: FiatConnectQuote } = yield* call(
      _getSpecificQuote,
      {
        digitalAsset: selectedCrypto,
        cryptoAmount: amount.crypto,
        fiatAmount: amount.fiat,
        flow,
        providerId,
        fiatAccount: fiatAccount,
        tokenId,
      }
    )
    const kycSchema = normalizedQuote.getKycSchema()
    if (kycSchema) {
      const getKycStatusResponse: GetKycStatusResponse = yield* call(getKycStatus, {
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
          yield* put(attemptReturnUserFlowCompleted())
          navigate(Screens.KycPending, {
            flow: normalizedQuote.flow,
            quote: normalizedQuote,
          })
          return
        case FiatConnectKycStatus.KycDenied:
          yield* put(attemptReturnUserFlowCompleted())
          navigate(Screens.KycDenied, {
            flow: normalizedQuote.flow,
            quote: normalizedQuote,
            retryable: true, // TODO: Get this dynamically once IHL supports it
          })
          return
        case FiatConnectKycStatus.KycExpired:
          yield* put(attemptReturnUserFlowCompleted())
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
    yield* put(attemptReturnUserFlowCompleted())
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
    yield* put(attemptReturnUserFlowCompleted())
    // Navigate to Select Provider Screen
    navigate(Screens.SelectProvider, {
      flow,
      tokenId,
      amount,
    })
  }
}

export function* _getQuotes({
  digitalAsset,
  cryptoAmount,
  fiatAmount,
  flow,
  providerIds,
}: {
  digitalAsset: string
  cryptoAmount: number
  fiatAmount: number
  flow: CICOFlow
  providerIds?: string[]
}): Generator<any, (FiatConnectQuoteSuccess | FiatConnectQuoteError)[], any> {
  const userLocation: UserLocationData = yield* select(userLocationDataSelector)
  const localCurrency: LocalCurrencyCode = yield* select(getLocalCurrencyCode)
  const fiatConnectCashInEnabled: boolean = yield* select(fiatConnectCashInEnabledSelector)
  const fiatConnectCashOutEnabled: boolean = yield* select(fiatConnectCashOutEnabledSelector)
  let fiatConnectProviders: FiatConnectProviderInfo[] | null = yield* select(
    fiatConnectProvidersSelector
  )
  const address: string | null = yield* select(walletAddressSelector)
  // null fiatConnectProviders means the providers have never successfully been fetched
  if (!fiatConnectProviders) {
    // Try to fetch providers again
    yield* put(fetchFiatConnectProviders())
    yield* race({
      success: take(fetchFiatConnectProvidersCompleted.type),
      failure: take(fetchFiatConnectProvidersFailed.type),
    })
    fiatConnectProviders = yield* select(fiatConnectProvidersSelector)
    if (!fiatConnectProviders) {
      throw new Error('Error fetching fiatconnect providers')
    }
  }
  if (!address) {
    throw new Error('Cannot fetch quotes without an address')
  }
  const quotes: (FiatConnectQuoteSuccess | FiatConnectQuoteError)[] = yield* call(fetchQuotes, {
    localCurrency,
    digitalAsset,
    cryptoAmount,
    fiatAmount,
    country: userLocation?.countryCodeAlpha2 || 'US',
    flow,
    fiatConnectCashInEnabled,
    fiatConnectCashOutEnabled,
    fiatConnectProviders: providerIds
      ? fiatConnectProviders.filter(({ id }) => providerIds.includes(id))
      : fiatConnectProviders,
    address,
  })
  return quotes
}

/**
 * Given a Fiat Account to use and a list of possible quotes to select, attempts to find a quote
 * for which the given Fiat Account is allowed to be used. Returns the first match, or null if
 * none is found.
 **/
export function _selectQuoteMatchingFiatAccount({
  normalizedQuotes,
  fiatAccount,
}: {
  normalizedQuotes: FiatConnectQuote[]
  fiatAccount: FiatAccount
}) {
  for (const normalizedQuote of normalizedQuotes) {
    if (
      normalizedQuote.getFiatAccountType() === fiatAccount.fiatAccountType &&
      normalizedQuote.getFiatAccountSchema() === fiatAccount.fiatAccountSchema
    ) {
      return normalizedQuote
    }
  }
}

/**
 * Given a list of FiatConnectQuote objects, finds the first quote for which the user has a matching
 * Fiat Account on file and returns it, along with the Fiat Account that matches. Useful for return
 * flows where we know which provider to use, but not which Fiat Account.
 **/
export function* _selectQuoteAndFiatAccount({
  normalizedQuotes,
  providerId,
}: {
  normalizedQuotes: FiatConnectQuote[]
  providerId: string
}) {
  const fiatConnectProviders: FiatConnectProviderInfo[] | null = yield* select(
    fiatConnectProvidersSelector
  )
  const fiatConnectProvider = fiatConnectProviders?.find((provider) => provider.id === providerId)
  if (!fiatConnectProvider) {
    throw new Error('Could not find provider')
  }

  const fiatAccounts: FiatAccount[] = yield* call(
    fetchFiatAccountsSaga,
    providerId,
    fiatConnectProvider.baseUrl,
    fiatConnectProvider.apiKey
  )

  for (const fiatAccount of fiatAccounts) {
    const normalizedQuote = _selectQuoteMatchingFiatAccount({
      normalizedQuotes,
      fiatAccount,
    })
    if (normalizedQuote) return { normalizedQuote, selectedFiatAccount: fiatAccount }
  }

  throw new Error('Could not find a fiat account matching any provided quote')
}

/**
 * Given some quote parameters, fetches quotes from a single provider and returns the quote to use
 * as well as a suitable fiat account that the user has on file that can be used for the quote.
 *
 * If a fiat account is provided to this function, a quote will be selected from the provider's list
 * of returned quotes which is eligible to be used with the given fiat account. If no quote is found
 * that matches the given fiat account, throws an error.
 *
 * If no fiat account is provided, both quotes and on-file fiat accounts will be fetched from
 * the chosen provider, and will be tested against eachother to find a match. If multiple quote-account
 * matches exist, one will be chosen arbitrarily. If no matching pair exists, throws an error.
 **/
export function* _getSpecificQuote({
  digitalAsset,
  cryptoAmount,
  fiatAmount,
  flow,
  providerId,
  fiatAccount,
  tokenId,
}: {
  digitalAsset: string
  cryptoAmount: number
  fiatAmount: number
  flow: CICOFlow
  providerId: string
  fiatAccount?: FiatAccount
  tokenId: string
}) {
  // Despite fetching quotes for a single provider, there still may be multiple quotes, since a quote
  // object is generated for each Fiat Account Schema supported by the provider.
  const quotes: (FiatConnectQuoteSuccess | FiatConnectQuoteError)[] = yield* call(_getQuotes, {
    flow,
    digitalAsset,
    cryptoAmount,
    fiatAmount,
    providerIds: [providerId],
  })
  const normalizedQuotes = normalizeFiatConnectQuotes(flow, quotes, tokenId)

  // If no account was provided, we need to fetch accounts from the provider and find a matching quote-account pair
  if (!fiatAccount) {
    return (yield* call(_selectQuoteAndFiatAccount, {
      normalizedQuotes,
      providerId,
    })) as {
      normalizedQuote: FiatConnectQuote
      selectedFiatAccount: FiatAccount
    }
  }
  // Otherwise, just find a quote that matches the selected account
  const normalizedQuote = _selectQuoteMatchingFiatAccount({
    normalizedQuotes,
    fiatAccount,
  })
  if (!normalizedQuote) {
    throw new Error('Could not find quote')
  }
  return {
    normalizedQuote,
    selectedFiatAccount: fiatAccount,
  }
}

/**
 * Fetches a fiat account from a given provider according to a set of optional filters.
 * Multiple filters may be used in conjunction. If, after filtering, multiple possible accounts
 * remain, an arbitrary one matching the given criteria is returned.
 * Returns null if no accounts are found that match the given criteria.
 **/
export function* _getFiatAccount({
  fiatConnectProviders,
  providerId,
  fiatAccountId,
  fiatAccountType,
  fiatAccountSchema,
}: {
  fiatConnectProviders: FiatConnectProviderInfo[] | null
  providerId: string
  fiatAccountId?: string
  fiatAccountType?: FiatAccountType
  fiatAccountSchema?: FiatAccountSchema
}) {
  // Get the provider info
  const fiatConnectProvider = fiatConnectProviders?.find((provider) => provider.id === providerId)
  if (!fiatConnectProvider) {
    throw new Error('Could not find provider')
  }
  // Fetch Fiat Account associated with the cached providerId / fiatAccountId
  let fiatAccounts: FiatAccount[] = yield* call(
    fetchFiatAccountsSaga,
    providerId,
    fiatConnectProvider.baseUrl,
    fiatConnectProvider.apiKey
  )

  if (fiatAccountType) {
    fiatAccounts = fiatAccounts.filter((account) => account.fiatAccountType === fiatAccountType)
  }
  if (fiatAccountSchema) {
    fiatAccounts = fiatAccounts.filter((account) => account.fiatAccountSchema === fiatAccountSchema)
  }
  if (fiatAccountId) {
    fiatAccounts = fiatAccounts.filter((account) => account.fiatAccountId === fiatAccountId)
  }
  return fiatAccounts[0] || null
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
      getKycStatusResponse = yield* call(getKycStatus, {
        providerInfo: quote.getProviderInfo(),
        kycSchemas: [kycSchema],
      })
      const fiatConnectKycStatus = getKycStatusResponse.kycStatus[kycSchema]
      switch (fiatConnectKycStatus) {
        case FiatConnectKycStatus.KycNotCreated:
          if (PERSONA_SUCCESS_STATUSES.has(getKycStatusResponse.persona)) {
            // If user has Persona KYC on file, just submit it and continue to account management.
            yield* call(postKyc, {
              providerInfo: quote.quote.provider,
              kycSchema,
            })
            // We also need to save a user's quote parameters so we can re-fetch if KYC takes a long
            // time to process.
            yield* put(
              cacheQuoteParams({
                providerId: quote.getProviderId(),
                kycSchema,
                cachedQuoteParams: {
                  cryptoAmount: quote.getCryptoAmount(),
                  fiatAmount: quote.getFiatAmount(),
                  flow: quote.flow,
                  cryptoType: quote.getCryptoCurrency(),
                  fiatType: quote.getFiatType(),
                },
              })
            )
            break
          } else {
            // If no Persona KYC on file, navigate to Persona
            navigate(Screens.KycLanding, {
              flow: quote.flow,
              quote,
              personaKycStatus: getKycStatusResponse.persona,
              step: 'one',
            })
            yield* put(selectFiatConnectQuoteCompleted())
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
          yield* put(selectFiatConnectQuoteCompleted())
          return
        case FiatConnectKycStatus.KycExpired:
          navigate(Screens.KycExpired, {
            flow: quote.flow,
            quote,
          })
          yield* put(selectFiatConnectQuoteCompleted())
          return
        default:
          throw new Error(
            `Unrecognized FiatConnect KYC status "${fiatConnectKycStatus}" while attempting to handle quote selection for provider ${quote.getProviderId()}`
          )
      }
    }

    yield* call(_checkFiatAccountAndNavigate, {
      quote,
      isKycRequired: !!kycSchema,
      isKycApproved:
        !!kycSchema &&
        getKycStatusResponse!.kycStatus[kycSchema] === FiatConnectKycStatus.KycApproved,
    })
    yield* put(selectFiatConnectQuoteCompleted())
  } catch (error) {
    // Error while attempting fetching the fiatConnect account
    Logger.debug(
      TAG,
      `handleSelectFiatConnectQuote* Error while attempting to handle quote selection for provider ${quote.getProviderId()}`,
      error
    )
    yield* put(selectFiatConnectQuoteCompleted())
    yield* put(showError(ErrorMessages.PROVIDER_FETCH_FAILED))
    const amount = {
      crypto: parseFloat(quote.getCryptoAmount()),
      fiat: parseFloat(quote.getFiatAmount()),
    }
    navigate(Screens.SelectProvider, {
      flow: quote.flow,
      tokenId: quote.getTokenId(),
      amount: amount,
    })
  }
}

export function* handlePostKyc({ payload }: ReturnType<typeof postKycAction>) {
  const { quote } = payload
  const kycSchema = quote.getKycSchema()

  try {
    if (!kycSchema) {
      // this should never happen
      throw new Error('Unexpected error, quote is missing kyc schema')
    }
    yield* call(postKyc, {
      providerInfo: quote.getProviderInfo(),
      kycSchema,
    })
    // We also need to save a user's quote parameters so we can re-fetch if KYC takes a long
    // time to process.
    yield* put(
      cacheQuoteParams({
        providerId: quote.getProviderId(),
        kycSchema,
        cachedQuoteParams: {
          cryptoAmount: quote.getCryptoAmount(),
          fiatAmount: quote.getFiatAmount(),
          flow: quote.flow,
          cryptoType: quote.getCryptoCurrency(),
          fiatType: quote.getFiatType(),
        },
      })
    )
    // kyc will be required, but will be pending with the provider because it was
    // just submitted.
    yield* call(_checkFiatAccountAndNavigate, { quote, isKycRequired: true, isKycApproved: false })
    // clear persona status
    yield* put(personaFinished())
  } catch (error) {
    // Error while attempting to post to kyc or selecting fiat account
    Logger.debug(
      TAG,
      `handlePostKyc* Error while attempting to post kyc for provider ${quote.getProviderId()}`,
      error
    )
    yield* put(showError(ErrorMessages.PROVIDER_FETCH_FAILED))
    const amount = {
      crypto: parseFloat(quote.getCryptoAmount()),
      fiat: parseFloat(quote.getFiatAmount()),
    }
    navigate(Screens.SelectProvider, {
      flow: quote.flow,
      tokenId: quote.getTokenId(),
      amount: amount,
    })
    yield* delay(500) // to avoid screen flash
    yield* put(personaFinished())
  }
}

export function* _checkFiatAccountAndNavigate({
  quote,
  isKycRequired,
  isKycApproved,
}: {
  quote: FiatConnectQuote
  isKycRequired: boolean
  isKycApproved: boolean
}) {
  const fiatAccount: FiatAccount = yield* call(_getFiatAccount, {
    fiatConnectProviders: [quote.getProviderInfo()],
    providerId: quote.getProviderId(),
    fiatAccountType: quote.getFiatAccountType(),
    fiatAccountSchema: quote.getFiatAccountSchema(),
  })

  // This is expected when the user has not yet created a fiatAccount with the provider
  if (!fiatAccount) {
    // If the quote has kyc, navigate to the second step of the KycLanding page
    if (isKycRequired) {
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
      yield* delay(500) // to avoid a screen flash
    }
    return
  }
  // Save the fiatAccount in cache
  yield* put(
    fiatAccountUsed({
      providerId: quote.getProviderId(),
      fiatAccountId: fiatAccount.fiatAccountId,
      fiatAccountType: quote.getFiatAccountType(),
      fiatAccountSchema: quote.getFiatAccountSchema(),
      flow: quote.flow,
      cryptoType: quote.getCryptoCurrency(),
      fiatType: quote.getFiatType(),
    })
  )

  // If the quote required KYC, only proceed to the Review screen if it's approved
  if (isKycRequired && !isKycApproved) {
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
  yield* delay(500) // to avoid a screen flash
}

export function* fetchFiatAccountsSaga(
  providerId: string,
  baseUrl: string,
  apiKey: string | undefined
) {
  const fiatConnectClient: FiatConnectApiClient = yield* call(
    getFiatConnectClient,
    providerId,
    baseUrl,
    apiKey
  )
  const fiatAccountsResponse: Result<GetFiatAccountsResponse, ResponseError> = yield* call([
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
        }) as FiatAccount
    )
  return fiatAccounts
}

export function* handleFetchFiatConnectProviders() {
  const account: string | null = yield* select(walletAddressSelector)
  try {
    if (!account) {
      throw new Error('Cannot fetch fiatconnect providers without an account')
    }
    const providers: FiatConnectProviderInfo[] = yield* call(getFiatConnectProviders, account)
    yield* put(fetchFiatConnectProvidersCompleted({ providers }))
  } catch (error) {
    Logger.error(TAG, 'Error in *handleFetchFiatConnectProviders ', error)
    yield* put(fetchFiatConnectProvidersFailed())
  }
}

/**
 * Initiates a fiatconnect transfer using the fiatconnect SDK to call a transfer/out or transfer/in endpoint
 * for a provider.
 **/
export function* _initiateTransferWithProvider({
  payload: params,
}: ReturnType<typeof createFiatConnectTransfer>) {
  const { flow, fiatConnectQuote, fiatAccountId } = params
  const quoteId = fiatConnectQuote.getQuoteId()
  const transferFnName = flow === CICOFlow.CashIn ? 'transferIn' : 'transferOut'
  Logger.info(TAG, `Starting ${transferFnName} ..`)
  const fiatConnectClient = yield* call(
    getFiatConnectClient,
    fiatConnectQuote.getProviderId(),
    fiatConnectQuote.getProviderBaseUrl(),
    fiatConnectQuote.getProviderApiKey()
  )
  const result: Result<TransferResponse, ResponseError> = yield* call(
    [fiatConnectClient, transferFnName],
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

  Logger.info(TAG, `${transferFnName} succeeded`, transferResult)
  return transferResult
}

/**
 * Initiates a transaction on-chain to send funds to a specific address. This is intended to be used for
 * cashing out after a transfer has been initiated with a provider
 **/
export function* _initiateSendTxToProvider({
  transferAddress,
  fiatConnectQuote,
  feeInfo,
}: {
  transferAddress: string
  fiatConnectQuote: FiatConnectQuote
  feeInfo: FeeInfo
}) {
  Logger.info(TAG, 'Starting transfer out transaction..')

  const tokenList: TokenBalanceWithAddress[] = yield* select(tokensListWithAddressSelector)
  const cryptoType = fiatConnectQuote.getCryptoType()
  const tokenInfo = tokenList.find((token) => token.symbol === cryptoType)
  if (!tokenInfo) {
    // case where none of the tokens in tokenList, which should be from firebase and in sync with this https://github.com/valora-inc/address-metadata/blob/main/src/data/mainnet/tokens-info.json
    //  match with FiatConnect quote cryptoType, which should be from here https://github.com/fiatconnect/specification/blob/main/fiatconnect-api.md#922-cryptotypeenum
    throw new Error(
      `No matching symbol found for cryptoType ${cryptoType}. Cannot send crypto to provider.`
    )
  }

  const context = newTransactionContext(TAG, 'Send crypto to provider for transfer out')

  const { error, receipt } = yield* call(
    buildAndSendPayment,
    context,
    transferAddress,
    new BigNumber(fiatConnectQuote.getCryptoAmount()),
    tokenInfo.address,
    '',
    feeInfo
  )
  if (receipt) {
    Logger.info(
      TAG,
      `Completed transfer out transaction.. transactionHash: ${receipt.transactionHash}`
    )
    return receipt.transactionHash
  }
  const err = ensureError(error)
  ValoraAnalytics.track(FiatExchangeEvents.cico_fc_transfer_tx_error, {
    flow: CICOFlow.CashOut,
    error: err.message,
    transferAddress: transferAddress,
    provider: fiatConnectQuote.getProviderId(),
  })
  // If we've timed out, or the error is deemed unsafe to retry,
  // it's possible that the transaction is already processing. Note that
  // this check is not perfect; there may be false positives/negatives.
  throw new FiatConnectTxError(
    'Error while attempting to send funds for FiatConnect transfer out',
    isTxPossiblyPending(err),
    err
  )
}

export function* handleCreateFiatConnectTransfer(
  action: ReturnType<typeof createFiatConnectTransfer>
) {
  const { flow, fiatConnectQuote, feeInfo } = action.payload
  const quoteId = fiatConnectQuote.getQuoteId()
  let transactionHash: string | null = null
  try {
    const { transferAddress, transferId }: TransferResponse = yield* call(
      _initiateTransferWithProvider,
      action
    )

    if (flow === CICOFlow.CashOut) {
      if (!feeInfo) {
        // Should never happen since we disable the submit button if flow is cash out and there is no fee info
        throw new Error('Fee info is required for cash out')
      }
      const cashOutTxHash: string = yield* call(_initiateSendTxToProvider, {
        transferAddress,
        fiatConnectQuote,
        feeInfo,
      })
      yield* put(
        cacheFiatConnectTransfer({
          txHash: cashOutTxHash.toLowerCase(),
          transferId,
          providerId: fiatConnectQuote.getProviderId(),
          fiatAccountId: action.payload.fiatAccountId,
          quote: fiatConnectQuote.quote.quote,
        })
      )
      transactionHash = cashOutTxHash
    }

    ValoraAnalytics.track(FiatExchangeEvents.cico_fc_transfer_success, {
      txHash: transactionHash,
      transferAddress: transferAddress,
      provider: fiatConnectQuote.getProviderId(),
      flow,
    })
    yield* put(
      createFiatConnectTransferCompleted({
        flow,
        quoteId,
        txHash: transactionHash,
      })
    )
  } catch (err) {
    const error = ensureError(err)
    Logger.error(TAG, `Transfer for ${flow} failed..`, error)
    ValoraAnalytics.track(FiatExchangeEvents.cico_fc_transfer_error, {
      flow: CICOFlow.CashOut,
      error: error.message,
      provider: fiatConnectQuote.getProviderId(),
    })

    if (error instanceof FiatConnectTxError) {
      if (error.txPossiblyPending) {
        yield* put(createFiatConnectTransferTxProcessing({ flow, quoteId }))
        return
      }
    }

    yield* put(createFiatConnectTransferFailed({ flow, quoteId }))
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
    yield* call(deleteKyc, {
      providerInfo: quote.getProviderInfo(),
      kycSchema,
    })

    navigate(Screens.KycLanding, { quote, flow, step: 'one' })
  } catch (error) {
    Logger.error(TAG, 'Kyc try again failed', error)
    yield* put(showError(ErrorMessages.KYC_TRY_AGAIN_FAILED))
  } finally {
    yield* put(kycTryAgainCompleted())
  }
}

function* watchFiatConnectTransfers() {
  yield* takeLeading(createFiatConnectTransfer.type, safely(handleCreateFiatConnectTransfer))
}

export function* watchFetchFiatConnectQuotes() {
  yield* takeLeading(fetchFiatConnectQuotes.type, safely(handleFetchFiatConnectQuotes))
}

export function* watchFetchFiatConnectProviders() {
  yield* takeLeading(fetchFiatConnectProviders.type, safely(handleFetchFiatConnectProviders))
}

export function* watchAttemptReturnUserFlow() {
  yield* takeLeading(attemptReturnUserFlow.type, safely(handleAttemptReturnUserFlow))
}

function* watchSelectFiatConnectQuote() {
  yield* takeLeading(selectFiatConnectQuote.type, safely(handleSelectFiatConnectQuote))
}

function* watchRefetchQuote() {
  yield* takeLeading(refetchQuote.type, safely(handleRefetchQuote))
}

function* watchSubmitFiatAccount() {
  yield* takeLeading(submitFiatAccount.type, safely(handleSubmitFiatAccount))
}

function* watchKycTryAgain() {
  yield* takeLeading(kycTryAgain.type, safely(handleKycTryAgain))
}

function* watchPostKyc() {
  yield* takeLeading(postKycAction.type, safely(handlePostKyc))
}

export function* fiatConnectSaga() {
  yield* spawn(watchFetchFiatConnectQuotes)
  yield* spawn(watchFiatConnectTransfers)
  yield* spawn(watchFetchFiatConnectProviders)
  yield* spawn(watchAttemptReturnUserFlow)
  yield* spawn(watchSelectFiatConnectQuote)
  yield* spawn(watchRefetchQuote)
  yield* spawn(watchSubmitFiatAccount)
  yield* spawn(watchKycTryAgain)
  yield* spawn(watchPostKyc)
}
