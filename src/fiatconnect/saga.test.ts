import { Result } from '@badrap/result'
import { ResponseError } from '@fiatconnect/fiatconnect-sdk'
import {
  CryptoType,
  FiatAccountSchema,
  FiatAccountType,
  FiatConnectError,
  KycStatus as FiatConnectKycStatus,
  KycSchema,
  TransferStatus,
} from '@fiatconnect/fiatconnect-types'
import _ from 'lodash'
import { expectSaga } from 'redux-saga-test-plan'
import * as matches from 'redux-saga-test-plan/matchers'
import { dynamic, throwError } from 'redux-saga-test-plan/providers'
import { call, select } from 'redux-saga/effects'
import { KycStatus as PersonaKycStatus } from 'src/account/reducer'
import { showError, showMessage } from 'src/alert/actions'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { FiatExchangeEvents } from 'src/analytics/Events'
import { ErrorMessages } from 'src/app/ErrorMessages'
import {
  fiatConnectCashInEnabledSelector,
  fiatConnectCashOutEnabledSelector,
} from 'src/app/selectors'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { normalizeFiatConnectQuotes } from 'src/fiatExchanges/quotes/normalizeQuotes'
import { CICOFlow } from 'src/fiatExchanges/utils'
import {
  FiatConnectProviderInfo,
  FiatConnectQuoteSuccess,
  fetchQuotes,
  getFiatConnectProviders,
} from 'src/fiatconnect'
import { getFiatConnectClient } from 'src/fiatconnect/clients'
import {
  _checkFiatAccountAndNavigate,
  _getFiatAccount,
  _getQuotes,
  _getSpecificQuote,
  _initiateSendTxToProvider,
  _initiateTransferWithProvider,
  _selectQuoteAndFiatAccount,
  _selectQuoteMatchingFiatAccount,
  fetchFiatAccountsSaga,
  handleAttemptReturnUserFlow,
  handleCreateFiatConnectTransfer,
  handleFetchFiatConnectProviders,
  handleFetchFiatConnectQuotes,
  handleKycTryAgain,
  handlePostKyc,
  handleRefetchQuote,
  handleSelectFiatConnectQuote,
  handleSubmitFiatAccount,
} from 'src/fiatconnect/saga'
import { fiatConnectProvidersSelector } from 'src/fiatconnect/selectors'
import {
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
import { deleteKyc, getKycStatus, postKyc } from 'src/in-house-liquidity'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import { tokensByIdSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import { isTxPossiblyPending } from 'src/transactions/send'
import { NetworkId } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { CiCoCurrency } from 'src/utils/currencies'
import { SerializableTransactionRequest } from 'src/viem/preparedTransactionSerialization'
import { walletAddressSelector } from 'src/web3/selectors'
import {
  mockAccount2,
  mockAccount3,
  mockCeloTokenBalance,
  mockCeurTokenBalance,
  mockCrealTokenBalance,
  mockCusdAddress,
  mockCusdTokenBalance,
  mockCusdTokenId,
  mockFiatConnectProviderInfo,
  mockFiatConnectQuotes,
} from 'test/values'
import { v4 as uuidv4 } from 'uuid'
import { Address, encodeFunctionData, erc20Abi } from 'viem'

jest.mock('src/analytics/AppAnalytics')
jest.mock('src/fiatconnect')
jest.mock('uuid')
jest.mock('src/utils/Logger', () => ({
  __esModule: true,
  namedExport: jest.fn(),
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}))

jest.mock('src/fiatconnect/clients', () => ({
  getFiatConnectClient: jest.fn(() => ({
    getFiatAccounts: jest.fn(),
    addFiatAccount: jest.fn(),
  })),
}))

jest.mock('src/in-house-liquidity', () => ({
  getKycStatus: jest.fn(),
  postKyc: jest.fn(),
  deleteKyc: jest.fn(),
}))

jest.mock('src/transactions/send')

const mockedSendPreparedTransactions = jest.fn()
jest.mock('src/viem/saga', () => ({
  ...jest.requireActual('src/viem/saga'),
  sendPreparedTransactions: (...args: any[]) => mockedSendPreparedTransactions(...args),
}))

describe('Fiatconnect saga', () => {
  const provideDelay = ({ fn }: { fn: any }, next: any) => (fn.name === 'delayP' ? null : next())
  const normalizedQuote = new FiatConnectQuote({
    quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
    fiatAccountType: FiatAccountType.BankAccount,
    flow: CICOFlow.CashOut,
    tokenId: mockCusdTokenId,
  })
  const normalizedQuoteKyc = new FiatConnectQuote({
    quote: mockFiatConnectQuotes[3] as FiatConnectQuoteSuccess,
    fiatAccountType: FiatAccountType.BankAccount,
    flow: CICOFlow.CashOut,
    tokenId: mockCusdTokenId,
  })
  const expectedCacheQuoteParams = {
    providerId: normalizedQuoteKyc.getProviderId(),
    kycSchema: normalizedQuoteKyc.getKycSchema()!,
    cachedQuoteParams: {
      cryptoAmount: normalizedQuoteKyc.getCryptoAmount(),
      fiatAmount: normalizedQuoteKyc.getFiatAmount(),
      flow: normalizedQuoteKyc.flow,
      cryptoType: normalizedQuoteKyc.getCryptoCurrency(),
      fiatType: normalizedQuoteKyc.getFiatType(),
    },
  }
  beforeEach(() => {
    jest.clearAllMocks()
  })
  describe('handleSubmitFiatAccount', () => {
    const mockAddFiatAccount = jest.fn()
    const mockFcClient = {
      addFiatAccount: mockAddFiatAccount,
    }
    const mockObfuscatedAccount = {
      fiatAccountId: 'some id',
      accountName: 'some account name',
      institutionName: 'some institution',
      fiatAccountType: FiatAccountType.BankAccount,
      fiatAccountSchema: FiatAccountSchema.AccountNumber,
    }
    it('successfully submits account and navigates to review (no KYC)', async () => {
      mockAddFiatAccount.mockResolvedValueOnce(Result.ok(mockObfuscatedAccount))
      await expectSaga(
        handleSubmitFiatAccount,
        submitFiatAccount({
          flow: normalizedQuote.flow,
          quote: normalizedQuote,
          fiatAccountData: { random: 'data' },
        })
      )
        .provide([[matches.call.fn(getFiatConnectClient), mockFcClient], { call: provideDelay }])
        .put(
          showMessage(
            i18n.t('fiatDetailsScreen.addFiatAccountSuccess', {
              provider: normalizedQuote.getProviderName(),
            })
          )
        )
        .put(
          fiatAccountUsed({
            providerId: normalizedQuote.getProviderId(),
            fiatAccountId: mockObfuscatedAccount.fiatAccountId,
            fiatAccountType: mockObfuscatedAccount.fiatAccountType,
            fiatAccountSchema: mockObfuscatedAccount.fiatAccountSchema,
            flow: normalizedQuote.flow,
            cryptoType: normalizedQuote.getCryptoCurrency(),
            fiatType: normalizedQuote.getFiatType(),
          })
        )
        .put(submitFiatAccountCompleted())
        .run()
      expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
      expect(AppAnalytics.track).toHaveBeenCalledWith(
        FiatExchangeEvents.cico_fiat_details_success,
        {
          flow: normalizedQuote.flow,
          provider: normalizedQuote.getProviderId(),
          fiatAccountSchema: normalizedQuote.getFiatAccountSchema(),
        }
      )
      expect(navigate).toBeCalledTimes(1)
      expect(navigate).toHaveBeenCalledWith(Screens.FiatConnectReview, {
        normalizedQuote: normalizedQuote,
        flow: normalizedQuote.flow,
        fiatAccount: mockObfuscatedAccount,
      })
    })
    it('does not navigate to review when account already exists (no KYC)', async () => {
      mockAddFiatAccount.mockResolvedValueOnce(
        Result.err(
          new ResponseError('FiatConnect API Error', { error: FiatConnectError.ResourceExists })
        )
      )
      await expectSaga(
        handleSubmitFiatAccount,
        submitFiatAccount({
          flow: normalizedQuote.flow,
          quote: normalizedQuote,
          fiatAccountData: { random: 'data' },
        })
      )
        .provide([[matches.call.fn(getFiatConnectClient), mockFcClient]])
        .put(submitFiatAccountCompleted())
        .put(
          showError(ErrorMessages.FIATCONNECT_ADD_ACCOUNT_EXISTS, undefined, {
            provider: normalizedQuote.getProviderName(),
          })
        )
        .run()
      expect(AppAnalytics.track).toHaveBeenCalledWith(FiatExchangeEvents.cico_fiat_details_error, {
        flow: normalizedQuote.flow,
        provider: normalizedQuote.getProviderId(),
        fiatAccountSchema: normalizedQuote.getFiatAccountSchema(),
        fiatConnectError: FiatConnectError.ResourceExists,
        error: 'FiatConnect API Error',
      })
      expect(navigate).not.toHaveBeenCalled()
    })
    it('does not navigate to review when experiencing a general error (no KYC)', async () => {
      mockAddFiatAccount.mockResolvedValueOnce(Result.err(new ResponseError('some error')))
      await expectSaga(
        handleSubmitFiatAccount,
        submitFiatAccount({
          flow: normalizedQuote.flow,
          quote: normalizedQuote,
          fiatAccountData: { random: 'data' },
        })
      )
        .provide([[matches.call.fn(getFiatConnectClient), mockFcClient]])
        .put(submitFiatAccountCompleted())
        .put(
          showError(ErrorMessages.FIATCONNECT_ADD_ACCOUNT_FAILED, undefined, {
            provider: normalizedQuote.getProviderName(),
          })
        )
        .run()
      expect(AppAnalytics.track).toHaveBeenCalledWith(FiatExchangeEvents.cico_fiat_details_error, {
        flow: normalizedQuote.flow,
        provider: normalizedQuote.getProviderId(),
        fiatAccountSchema: normalizedQuote.getFiatAccountSchema(),
        fiatConnectError: undefined,
        error: 'some error',
      })
      expect(navigate).not.toHaveBeenCalled()
    })
    it('successfully submits account and navigates to review when KYC is required and approved', async () => {
      mockAddFiatAccount.mockResolvedValueOnce(Result.ok(mockObfuscatedAccount))
      await expectSaga(
        handleSubmitFiatAccount,
        submitFiatAccount({
          flow: normalizedQuoteKyc.flow,
          quote: normalizedQuoteKyc,
          fiatAccountData: { random: 'data' },
        })
      )
        .provide([
          [matches.call.fn(getFiatConnectClient), mockFcClient],
          { call: provideDelay },
          [
            matches.call.fn(getKycStatus),
            {
              providerId: normalizedQuoteKyc.quote.provider.id,
              persona: PersonaKycStatus.Approved,
              kycStatus: {
                [KycSchema.PersonalDataAndDocuments]: FiatConnectKycStatus.KycApproved,
              },
            },
          ],
          { call: provideDelay },
          { call: provideDelay },
        ])
        .put(
          showMessage(
            i18n.t('fiatDetailsScreen.addFiatAccountSuccess', {
              provider: normalizedQuoteKyc.getProviderName(),
            })
          )
        )
        .put(
          fiatAccountUsed({
            providerId: normalizedQuoteKyc.getProviderId(),
            fiatAccountId: mockObfuscatedAccount.fiatAccountId,
            fiatAccountType: mockObfuscatedAccount.fiatAccountType,
            fiatAccountSchema: mockObfuscatedAccount.fiatAccountSchema,
            flow: normalizedQuoteKyc.flow,
            cryptoType: normalizedQuoteKyc.getCryptoCurrency(),
            fiatType: normalizedQuoteKyc.getFiatType(),
          })
        )
        .put(submitFiatAccountKycApproved())
        .put(submitFiatAccountCompleted())
        .run()
      expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
      expect(AppAnalytics.track).toHaveBeenCalledWith(
        FiatExchangeEvents.cico_fiat_details_success,
        {
          flow: normalizedQuoteKyc.flow,
          provider: normalizedQuoteKyc.getProviderId(),
          fiatAccountSchema: normalizedQuoteKyc.getFiatAccountSchema(),
        }
      )
      expect(navigate).toBeCalledTimes(1)
      expect(navigate).toHaveBeenCalledWith(Screens.FiatConnectReview, {
        normalizedQuote: normalizedQuoteKyc,
        flow: normalizedQuoteKyc.flow,
        fiatAccount: mockObfuscatedAccount,
      })
    })
    it('successfully submits account and navigates to denied screen when KYC is required and denied', async () => {
      mockAddFiatAccount.mockResolvedValueOnce(Result.ok(mockObfuscatedAccount))
      await expectSaga(
        handleSubmitFiatAccount,
        submitFiatAccount({
          flow: normalizedQuoteKyc.flow,
          quote: normalizedQuoteKyc,
          fiatAccountData: { random: 'data' },
        })
      )
        .provide([
          [matches.call.fn(getFiatConnectClient), mockFcClient],
          { call: provideDelay },
          [
            matches.call.fn(getKycStatus),
            {
              providerId: normalizedQuoteKyc.quote.provider.id,
              persona: PersonaKycStatus.Approved,
              kycStatus: {
                [KycSchema.PersonalDataAndDocuments]: FiatConnectKycStatus.KycDenied,
              },
            },
          ],
          { call: provideDelay },
        ])
        .put(
          showMessage(
            i18n.t('fiatDetailsScreen.addFiatAccountSuccess', {
              provider: normalizedQuoteKyc.getProviderName(),
            })
          )
        )
        .put(
          fiatAccountUsed({
            providerId: normalizedQuoteKyc.getProviderId(),
            fiatAccountId: mockObfuscatedAccount.fiatAccountId,
            fiatAccountType: mockObfuscatedAccount.fiatAccountType,
            fiatAccountSchema: mockObfuscatedAccount.fiatAccountSchema,
            flow: normalizedQuoteKyc.flow,
            cryptoType: normalizedQuoteKyc.getCryptoCurrency(),
            fiatType: normalizedQuoteKyc.getFiatType(),
          })
        )
        .put(submitFiatAccountCompleted())
        .run()
      expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
      expect(AppAnalytics.track).toHaveBeenCalledWith(
        FiatExchangeEvents.cico_fiat_details_success,
        {
          flow: normalizedQuoteKyc.flow,
          provider: normalizedQuoteKyc.getProviderId(),
          fiatAccountSchema: normalizedQuoteKyc.getFiatAccountSchema(),
        }
      )
      expect(navigate).toBeCalledTimes(1)
      expect(navigate).toHaveBeenCalledWith(Screens.KycDenied, {
        quote: normalizedQuoteKyc,
        flow: normalizedQuoteKyc.flow,
        retryable: true,
      })
    })
    it('successfully submits account and navigates to expired screen when KYC is required and expired', async () => {
      mockAddFiatAccount.mockResolvedValueOnce(Result.ok(mockObfuscatedAccount))
      await expectSaga(
        handleSubmitFiatAccount,
        submitFiatAccount({
          flow: normalizedQuoteKyc.flow,
          quote: normalizedQuoteKyc,
          fiatAccountData: { random: 'data' },
        })
      )
        .provide([
          [matches.call.fn(getFiatConnectClient), mockFcClient],
          { call: provideDelay },
          [
            matches.call.fn(getKycStatus),
            {
              providerId: normalizedQuoteKyc.quote.provider.id,
              persona: PersonaKycStatus.Approved,
              kycStatus: {
                [KycSchema.PersonalDataAndDocuments]: FiatConnectKycStatus.KycExpired,
              },
            },
          ],
          { call: provideDelay },
        ])
        .put(
          showMessage(
            i18n.t('fiatDetailsScreen.addFiatAccountSuccess', {
              provider: normalizedQuoteKyc.getProviderName(),
            })
          )
        )
        .put(
          fiatAccountUsed({
            providerId: normalizedQuoteKyc.getProviderId(),
            fiatAccountId: mockObfuscatedAccount.fiatAccountId,
            fiatAccountType: mockObfuscatedAccount.fiatAccountType,
            fiatAccountSchema: mockObfuscatedAccount.fiatAccountSchema,
            flow: normalizedQuoteKyc.flow,
            cryptoType: normalizedQuoteKyc.getCryptoCurrency(),
            fiatType: normalizedQuoteKyc.getFiatType(),
          })
        )
        .put(submitFiatAccountCompleted())
        .run()
      expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
      expect(AppAnalytics.track).toHaveBeenCalledWith(
        FiatExchangeEvents.cico_fiat_details_success,
        {
          flow: normalizedQuoteKyc.flow,
          provider: normalizedQuoteKyc.getProviderId(),
          fiatAccountSchema: normalizedQuoteKyc.getFiatAccountSchema(),
        }
      )
      expect(navigate).toBeCalledTimes(1)
      expect(navigate).toHaveBeenCalledWith(Screens.KycExpired, {
        quote: normalizedQuoteKyc,
        flow: normalizedQuoteKyc.flow,
      })
    })
    it('successfully submits account and navigates to pending screen when KYC is required and pending', async () => {
      mockAddFiatAccount.mockResolvedValueOnce(Result.ok(mockObfuscatedAccount))
      await expectSaga(
        handleSubmitFiatAccount,
        submitFiatAccount({
          flow: normalizedQuoteKyc.flow,
          quote: normalizedQuoteKyc,
          fiatAccountData: { random: 'data' },
        })
      )
        .provide([
          [matches.call.fn(getFiatConnectClient), mockFcClient],
          { call: provideDelay },
          [
            matches.call.fn(getKycStatus),
            {
              providerId: normalizedQuoteKyc.quote.provider.id,
              persona: PersonaKycStatus.Approved,
              kycStatus: {
                [KycSchema.PersonalDataAndDocuments]: FiatConnectKycStatus.KycPending,
              },
            },
          ],
          { call: provideDelay },
        ])
        .put(
          showMessage(
            i18n.t('fiatDetailsScreen.addFiatAccountSuccess', {
              provider: normalizedQuoteKyc.getProviderName(),
            })
          )
        )
        .put(
          fiatAccountUsed({
            providerId: normalizedQuoteKyc.getProviderId(),
            fiatAccountId: mockObfuscatedAccount.fiatAccountId,
            fiatAccountType: mockObfuscatedAccount.fiatAccountType,
            fiatAccountSchema: mockObfuscatedAccount.fiatAccountSchema,
            flow: normalizedQuoteKyc.flow,
            cryptoType: normalizedQuoteKyc.getCryptoCurrency(),
            fiatType: normalizedQuoteKyc.getFiatType(),
          })
        )
        .put(submitFiatAccountCompleted())
        .run()
      expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
      expect(AppAnalytics.track).toHaveBeenCalledWith(
        FiatExchangeEvents.cico_fiat_details_success,
        {
          flow: normalizedQuoteKyc.flow,
          provider: normalizedQuoteKyc.getProviderId(),
          fiatAccountSchema: normalizedQuoteKyc.getFiatAccountSchema(),
        }
      )
      expect(navigate).toBeCalledTimes(1)
      expect(navigate).toHaveBeenCalledWith(Screens.KycPending, {
        quote: normalizedQuoteKyc,
        flow: normalizedQuoteKyc.flow,
      })
    })
    it('successfully submits account and navigates to pending screen when KYC is required and throws while fetching', async () => {
      mockAddFiatAccount.mockResolvedValueOnce(Result.ok(mockObfuscatedAccount))
      await expectSaga(
        handleSubmitFiatAccount,
        submitFiatAccount({
          flow: normalizedQuoteKyc.flow,
          quote: normalizedQuoteKyc,
          fiatAccountData: { random: 'data' },
        })
      )
        .provide([
          [matches.call.fn(getFiatConnectClient), mockFcClient],
          { call: provideDelay },
          [matches.call.fn(getKycStatus), new Error('uh oh!')],
          { call: provideDelay },
        ])
        .put(
          showMessage(
            i18n.t('fiatDetailsScreen.addFiatAccountSuccess', {
              provider: normalizedQuoteKyc.getProviderName(),
            })
          )
        )
        .put(
          fiatAccountUsed({
            providerId: normalizedQuoteKyc.getProviderId(),
            fiatAccountId: mockObfuscatedAccount.fiatAccountId,
            fiatAccountType: mockObfuscatedAccount.fiatAccountType,
            fiatAccountSchema: mockObfuscatedAccount.fiatAccountSchema,
            flow: normalizedQuoteKyc.flow,
            cryptoType: normalizedQuoteKyc.getCryptoCurrency(),
            fiatType: normalizedQuoteKyc.getFiatType(),
          })
        )
        .put(submitFiatAccountCompleted())
        .run()
      expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
      expect(AppAnalytics.track).toHaveBeenCalledWith(
        FiatExchangeEvents.cico_fiat_details_success,
        {
          flow: normalizedQuoteKyc.flow,
          provider: normalizedQuoteKyc.getProviderId(),
          fiatAccountSchema: normalizedQuoteKyc.getFiatAccountSchema(),
        }
      )
      expect(navigate).toBeCalledTimes(1)
      expect(navigate).toHaveBeenCalledWith(Screens.KycPending, {
        quote: normalizedQuoteKyc,
        flow: normalizedQuoteKyc.flow,
      })
    })
    it('successfully submits account and navigates to pending screen when KYC is required but unexpected status is returned', async () => {
      mockAddFiatAccount.mockResolvedValueOnce(Result.ok(mockObfuscatedAccount))
      await expectSaga(
        handleSubmitFiatAccount,
        submitFiatAccount({
          flow: normalizedQuoteKyc.flow,
          quote: normalizedQuoteKyc,
          fiatAccountData: { random: 'data' },
        })
      )
        .provide([
          [matches.call.fn(getFiatConnectClient), mockFcClient],
          { call: provideDelay },
          [
            matches.call.fn(getKycStatus),
            {
              providerId: normalizedQuoteKyc.quote.provider.id,
              persona: PersonaKycStatus.Approved,
              kycStatus: {
                [KycSchema.PersonalDataAndDocuments]: 'bad-status!',
              },
            },
          ],
          { call: provideDelay },
        ])
        .put(
          showMessage(
            i18n.t('fiatDetailsScreen.addFiatAccountSuccess', {
              provider: normalizedQuoteKyc.getProviderName(),
            })
          )
        )
        .put(
          fiatAccountUsed({
            providerId: normalizedQuoteKyc.getProviderId(),
            fiatAccountId: mockObfuscatedAccount.fiatAccountId,
            fiatAccountType: mockObfuscatedAccount.fiatAccountType,
            fiatAccountSchema: mockObfuscatedAccount.fiatAccountSchema,
            flow: normalizedQuoteKyc.flow,
            cryptoType: normalizedQuoteKyc.getCryptoCurrency(),
            fiatType: normalizedQuoteKyc.getFiatType(),
          })
        )
        .put(submitFiatAccountCompleted())
        .run()
      expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
      expect(AppAnalytics.track).toHaveBeenCalledWith(
        FiatExchangeEvents.cico_fiat_details_success,
        {
          flow: normalizedQuoteKyc.flow,
          provider: normalizedQuoteKyc.getProviderId(),
          fiatAccountSchema: normalizedQuoteKyc.getFiatAccountSchema(),
        }
      )
      expect(navigate).toBeCalledTimes(1)
      expect(navigate).toHaveBeenCalledWith(Screens.KycPending, {
        quote: normalizedQuoteKyc,
        flow: normalizedQuoteKyc.flow,
      })
    })
  })
  describe('handleFetchFiatConnectQuotes', () => {
    it('saves quotes when fetch is successful', async () => {
      jest.mocked(fetchQuotes).mockImplementation(() => Promise.resolve(mockFiatConnectQuotes))
      await expectSaga(
        handleFetchFiatConnectQuotes,
        fetchFiatConnectQuotes({
          flow: CICOFlow.CashIn,
          digitalAsset: CiCoCurrency.CELO,
          cryptoAmount: 3,
          fiatAmount: 2,
          providerIds: ['provider-one'],
        })
      )
        .provide([
          [select(userLocationDataSelector), { countryCodeAlpha2: 'MX' }],
          [select(getLocalCurrencyCode), 'USD'],
          [select(fiatConnectCashInEnabledSelector), false],
          [select(fiatConnectCashOutEnabledSelector), true],
          [select(fiatConnectProvidersSelector), mockFiatConnectProviderInfo],
          [select(walletAddressSelector), '0xabc'],
        ])
        .put(fetchFiatConnectQuotesCompleted({ quotes: mockFiatConnectQuotes }))
        .run()

      expect(fetchQuotes).toHaveBeenCalledWith({
        country: 'MX',
        cryptoAmount: 3,
        fiatAmount: 2,
        digitalAsset: 'CELO',
        fiatConnectCashInEnabled: false,
        fiatConnectCashOutEnabled: true,
        flow: CICOFlow.CashIn,
        localCurrency: 'USD',
        fiatConnectProviders: [mockFiatConnectProviderInfo[1]],
        address: '0xabc',
      })
    })

    it('fetches providers if null initially', async () => {
      jest.mocked(fetchQuotes).mockImplementation(() => Promise.resolve(mockFiatConnectQuotes))
      const providers = (
        firstValue: FiatConnectProviderInfo[] | null,
        restValue: FiatConnectProviderInfo[] | null
      ) => {
        let callCount = 0
        return () => (++callCount == 1 ? firstValue : restValue)
      }
      await expectSaga(
        handleFetchFiatConnectQuotes,
        fetchFiatConnectQuotes({
          flow: CICOFlow.CashIn,
          digitalAsset: CiCoCurrency.CELO,
          cryptoAmount: 3,
          fiatAmount: 2,
          providerIds: ['provider-one'],
        })
      )
        .provide([
          [select(userLocationDataSelector), { countryCodeAlpha2: 'MX' }],
          [select(getLocalCurrencyCode), 'USD'],
          [select(fiatConnectCashInEnabledSelector), false],
          [select(fiatConnectCashOutEnabledSelector), true],
          [
            select(fiatConnectProvidersSelector),
            dynamic(providers(null, mockFiatConnectProviderInfo)),
          ],
          [select(walletAddressSelector), '0xabc'],
        ])
        .put(fetchFiatConnectProviders())
        .dispatch(fetchFiatConnectProvidersCompleted({ providers: mockFiatConnectProviderInfo }))
        .put(fetchFiatConnectQuotesCompleted({ quotes: mockFiatConnectQuotes }))
        .run()

      expect(fetchQuotes).toHaveBeenCalledWith({
        country: 'MX',
        cryptoAmount: 3,
        fiatAmount: 2,
        digitalAsset: 'CELO',
        fiatConnectCashInEnabled: false,
        fiatConnectCashOutEnabled: true,
        flow: CICOFlow.CashIn,
        localCurrency: 'USD',
        fiatConnectProviders: [mockFiatConnectProviderInfo[1]],
        address: '0xabc',
      })
    })

    it('saves an error', async () => {
      jest.mocked(fetchQuotes).mockRejectedValue({})
      await expectSaga(
        handleFetchFiatConnectQuotes,
        fetchFiatConnectQuotes({
          flow: CICOFlow.CashIn,
          digitalAsset: CiCoCurrency.CELO,
          cryptoAmount: 3,
          fiatAmount: 2,
        })
      )
        .provide([
          [select(userLocationDataSelector), { countryCodeAlpha2: 'MX' }],
          [select(getLocalCurrencyCode), 'USD'],
          [select(fiatConnectCashInEnabledSelector), false],
          [select(fiatConnectCashOutEnabledSelector), true],
          [select(fiatConnectProvidersSelector), mockFiatConnectProviderInfo],
          [select(walletAddressSelector), '0xabc'],
        ])
        .put(fetchFiatConnectQuotesFailed({ error: 'Could not fetch fiatconnect quotes' }))
        .run()

      expect(fetchQuotes).toHaveBeenCalledWith({
        country: 'MX',
        cryptoAmount: 3,
        fiatAmount: 2,
        digitalAsset: 'CELO',
        fiatConnectCashInEnabled: false,
        fiatConnectCashOutEnabled: true,
        flow: CICOFlow.CashIn,
        localCurrency: 'USD',
        fiatConnectProviders: mockFiatConnectProviderInfo,
        address: '0xabc',
      })
    })
    it('saves an error when providers is null and fetching them fails', async () => {
      jest.mocked(fetchQuotes).mockResolvedValue(mockFiatConnectQuotes)
      await expectSaga(
        handleFetchFiatConnectQuotes,
        fetchFiatConnectQuotes({
          flow: CICOFlow.CashIn,
          digitalAsset: CiCoCurrency.CELO,
          cryptoAmount: 3,
          fiatAmount: 2,
        })
      )
        .provide([
          [select(userLocationDataSelector), { countryCodeAlpha2: 'MX' }],
          [select(getLocalCurrencyCode), 'USD'],
          [select(fiatConnectCashInEnabledSelector), false],
          [select(fiatConnectCashOutEnabledSelector), true],
          [select(fiatConnectProvidersSelector), null],
          [select(walletAddressSelector), '0xabc'],
        ])
        .put(fetchFiatConnectProviders())
        .dispatch(fetchFiatConnectProvidersFailed())
        .put(fetchFiatConnectQuotesFailed({ error: 'Could not fetch fiatconnect quotes' }))
        .run()

      expect(fetchQuotes).not.toHaveBeenCalled()
    })
  })

  describe('handleSelectFiatConnectQuote', () => {
    it.each([FiatConnectKycStatus.KycApproved, FiatConnectKycStatus.KycPending])(
      'invokes _checkFiatAccountAndNavigate if KYC is required and KYC status is %s',
      async (fcKycStatus) => {
        await expectSaga(
          handleSelectFiatConnectQuote,
          selectFiatConnectQuote({ quote: normalizedQuoteKyc })
        )
          .provide([
            [
              matches.call.fn(getKycStatus),
              {
                providerId: normalizedQuoteKyc.quote.provider.id,
                persona: PersonaKycStatus.Approved,
                kycStatus: {
                  [KycSchema.PersonalDataAndDocuments]: fcKycStatus,
                },
              },
            ],
            [matches.call.fn(_checkFiatAccountAndNavigate), undefined],
            { call: provideDelay },
          ])
          .call(_checkFiatAccountAndNavigate, {
            quote: normalizedQuoteKyc,
            isKycRequired: true,
            isKycApproved: fcKycStatus === FiatConnectKycStatus.KycApproved,
          })
          .put(selectFiatConnectQuoteCompleted())
          .run()
      }
    )
    it('navigates to KycExpired screen early if KYC is required and is expired', async () => {
      await expectSaga(
        handleSelectFiatConnectQuote,
        selectFiatConnectQuote({ quote: normalizedQuoteKyc })
      )
        .provide([
          [
            matches.call.fn(getKycStatus),
            {
              providerId: normalizedQuoteKyc.quote.provider.id,
              persona: PersonaKycStatus.Approved,
              kycStatus: {
                [KycSchema.PersonalDataAndDocuments]: FiatConnectKycStatus.KycExpired,
              },
            },
          ],
          { call: provideDelay },
        ])
        .put(selectFiatConnectQuoteCompleted())
        .run()
      expect(navigate).toHaveBeenCalledWith(Screens.KycExpired, {
        flow: normalizedQuoteKyc.flow,
        quote: normalizedQuoteKyc,
      })
    })
    it('navigates to KycDenied screen early if KYC is required and is denied', async () => {
      await expectSaga(
        handleSelectFiatConnectQuote,
        selectFiatConnectQuote({ quote: normalizedQuoteKyc })
      )
        .provide([
          [
            matches.call.fn(getKycStatus),
            {
              providerId: normalizedQuoteKyc.quote.provider.id,
              persona: PersonaKycStatus.Approved,
              kycStatus: {
                [KycSchema.PersonalDataAndDocuments]: FiatConnectKycStatus.KycDenied,
              },
            },
          ],
          { call: provideDelay },
        ])
        .put(selectFiatConnectQuoteCompleted())
        .run()
      expect(navigate).toHaveBeenCalledWith(Screens.KycDenied, {
        flow: normalizedQuoteKyc.flow,
        quote: normalizedQuoteKyc,
        retryable: true,
      })
    })
    it('navigates to KYC landing screen early if KYC is required and does not exist in Persona', async () => {
      await expectSaga(
        handleSelectFiatConnectQuote,
        selectFiatConnectQuote({ quote: normalizedQuoteKyc })
      )
        .provide([
          [
            matches.call.fn(getKycStatus),
            {
              providerId: normalizedQuoteKyc.quote.provider.id,
              persona: PersonaKycStatus.NotCreated,
              kycStatus: {
                [KycSchema.PersonalDataAndDocuments]: FiatConnectKycStatus.KycNotCreated,
              },
            },
          ],
          { call: provideDelay },
        ])
        .put(selectFiatConnectQuoteCompleted())
        .run()
      expect(navigate).toHaveBeenCalledWith(Screens.KycLanding, {
        personaKycStatus: PersonaKycStatus.NotCreated,
        flow: normalizedQuoteKyc.flow,
        quote: normalizedQuoteKyc,
        step: 'one',
      })
    })
    it.each([PersonaKycStatus.Approved, PersonaKycStatus.Completed])(
      'posts KYC to provider and invokes _checkFiatAccountAndNavigate if KYC required and exists in Persona',
      async (personaKycStatus) => {
        await expectSaga(
          handleSelectFiatConnectQuote,
          selectFiatConnectQuote({ quote: normalizedQuoteKyc })
        )
          .provide([
            [
              matches.call.fn(getKycStatus),
              {
                providerId: normalizedQuoteKyc.quote.provider.id,
                persona: personaKycStatus,
                kycStatus: {
                  [KycSchema.PersonalDataAndDocuments]: FiatConnectKycStatus.KycNotCreated,
                },
              },
            ],
            [matches.call.fn(postKyc), undefined],
            [matches.call.fn(_checkFiatAccountAndNavigate), undefined],
            { call: provideDelay },
          ])
          .put(cacheQuoteParams(expectedCacheQuoteParams))
          .call(_checkFiatAccountAndNavigate, {
            quote: normalizedQuoteKyc,
            isKycRequired: true,
            isKycApproved: false,
          })
          .put(selectFiatConnectQuoteCompleted())
          .run()
      }
    )
    it('goes back to SelectProvider if FC KYC status is not recognized', async () => {
      await expectSaga(
        handleSelectFiatConnectQuote,
        selectFiatConnectQuote({ quote: normalizedQuoteKyc })
      )
        .provide([
          [
            matches.call.fn(getKycStatus),
            {
              providerId: normalizedQuoteKyc.quote.provider.id,
              persona: PersonaKycStatus.Approved,
              kycStatus: {
                [KycSchema.PersonalDataAndDocuments]: 'badKyc',
              },
            },
          ],
          { call: provideDelay },
        ])
        .put(selectFiatConnectQuoteCompleted())
        .put(showError(ErrorMessages.PROVIDER_FETCH_FAILED))
        .run()
      expect(navigate).toHaveBeenCalledWith(Screens.SelectProvider, {
        flow: normalizedQuoteKyc.flow,
        amount: {
          crypto: parseFloat(normalizedQuoteKyc.getCryptoAmount()),
          fiat: parseFloat(normalizedQuoteKyc.getFiatAmount()),
        },
        tokenId: mockCusdTokenId,
      })
    })
    it('invokes _checkFiatAccountAndNavigate directly if KYC is not required', async () => {
      await expectSaga(
        handleSelectFiatConnectQuote,
        selectFiatConnectQuote({ quote: normalizedQuote })
      )
        .provide([
          [matches.call.fn(_checkFiatAccountAndNavigate), undefined],
          { call: provideDelay },
        ])
        .put(selectFiatConnectQuoteCompleted())
        .call(_checkFiatAccountAndNavigate, {
          quote: normalizedQuote,
          isKycRequired: false,
          isKycApproved: false,
        })
        .run()
    })
    it('shows an error and goes back to SelectProvider if _checkFiatAccountAndNavigate throws', async () => {
      await expectSaga(
        handleSelectFiatConnectQuote,
        selectFiatConnectQuote({ quote: normalizedQuote })
      )
        .provide([
          [
            matches.call.fn(_checkFiatAccountAndNavigate),
            throwError(new Error('failed to fetch fiat account')),
          ],
        ])
        .put(selectFiatConnectQuoteCompleted())
        .put(showError(ErrorMessages.PROVIDER_FETCH_FAILED))
        .run()
      expect(navigate).toHaveBeenCalledWith(Screens.SelectProvider, {
        flow: normalizedQuote.flow,
        amount: {
          crypto: parseFloat(normalizedQuote.getCryptoAmount()),
          fiat: parseFloat(normalizedQuote.getFiatAmount()),
        },
        tokenId: mockCusdTokenId,
      })
    })
  })

  describe('handlePostKyc', () => {
    it('posts kyc, caches quote params and invokes _checkFiatAccountAndNavigate', async () => {
      await expectSaga(handlePostKyc, postKycAction({ quote: normalizedQuoteKyc }))
        .provide([
          [matches.call.fn(postKyc), undefined],
          [matches.call.fn(_checkFiatAccountAndNavigate), undefined],
        ])
        .call(postKyc, {
          providerInfo: normalizedQuoteKyc.getProviderInfo(),
          kycSchema: normalizedQuoteKyc.getKycSchema(),
        })
        .call(_checkFiatAccountAndNavigate, {
          quote: normalizedQuoteKyc,
          isKycRequired: true,
          isKycApproved: false,
        })
        .put(cacheQuoteParams(expectedCacheQuoteParams))
        .put(personaFinished())
        .run()
    })
    it('navigates to SelectProvider if post kyc fails', async () => {
      await expectSaga(handlePostKyc, postKycAction({ quote: normalizedQuoteKyc }))
        .provide([
          [matches.call.fn(postKyc), throwError(new Error('post kyc failed'))],
          { call: provideDelay },
        ])
        .call(postKyc, {
          providerInfo: normalizedQuoteKyc.getProviderInfo(),
          kycSchema: normalizedQuoteKyc.getKycSchema(),
        })
        .put(personaFinished())
        .put(showError(ErrorMessages.PROVIDER_FETCH_FAILED))
        .run()
      expect(navigate).toHaveBeenCalledWith(Screens.SelectProvider, {
        flow: normalizedQuoteKyc.flow,
        amount: {
          crypto: parseFloat(normalizedQuoteKyc.getCryptoAmount()),
          fiat: parseFloat(normalizedQuoteKyc.getFiatAmount()),
        },
        tokenId: mockCusdTokenId,
      })
    })
    it('navigates to SelectProvider if _checkFiatAccountAndNavigate throws', async () => {
      await expectSaga(handlePostKyc, postKycAction({ quote: normalizedQuoteKyc }))
        .provide([
          [matches.call.fn(postKyc), undefined],
          [matches.call.fn(_checkFiatAccountAndNavigate), throwError(new Error('failed'))],
          { call: provideDelay },
        ])
        .call(postKyc, {
          providerInfo: normalizedQuoteKyc.getProviderInfo(),
          kycSchema: normalizedQuoteKyc.getKycSchema(),
        })
        .call(_checkFiatAccountAndNavigate, {
          quote: normalizedQuoteKyc,
          isKycRequired: true,
          isKycApproved: false,
        })
        .put(cacheQuoteParams(expectedCacheQuoteParams))
        .put(personaFinished())
        .put(showError(ErrorMessages.PROVIDER_FETCH_FAILED))
        .run()
      expect(navigate).toHaveBeenCalledWith(Screens.SelectProvider, {
        flow: normalizedQuoteKyc.flow,
        amount: {
          crypto: parseFloat(normalizedQuoteKyc.getCryptoAmount()),
          fiat: parseFloat(normalizedQuoteKyc.getFiatAmount()),
        },
        tokenId: mockCusdTokenId,
      })
    })
  })

  describe('_checkFiatAccountAndNavigate', () => {
    const fiatAccount = {
      fiatAccountId: '123',
      providerId: 'provider-two',
      accountName: 'provider two',
      institutionName: 'The fun bank',
      fiatAccountType: FiatAccountType.BankAccount, // matching fiatAccount type
      fiatAccountSchema: FiatAccountSchema.AccountNumber,
    }
    const expectedGetFiatAccountArgs = (quote: FiatConnectQuote) => ({
      fiatConnectProviders: [quote.getProviderInfo()],
      providerId: quote.getProviderId(),
      fiatAccountType: quote.getFiatAccountType(),
      fiatAccountSchema: quote.getFiatAccountSchema(),
    })
    const expectedFiatConnectUsedArgs = (quote: FiatConnectQuote) => ({
      providerId: quote.getProviderId(),
      fiatAccountId: fiatAccount.fiatAccountId,
      fiatAccountType: quote.getFiatAccountType(),
      fiatAccountSchema: quote.getFiatAccountSchema(),
      flow: quote.flow,
      cryptoType: quote.getCryptoCurrency(),
      fiatType: quote.getFiatType(),
    })
    it('navigates to step two of kyc landing if kyc is required and fiat account is not found', async () => {
      await expectSaga(_checkFiatAccountAndNavigate, {
        quote: normalizedQuoteKyc,
        isKycRequired: true,
        isKycApproved: false,
      })
        .provide([[matches.call.fn(_getFiatAccount), null]])
        .call(_getFiatAccount, expectedGetFiatAccountArgs(normalizedQuoteKyc))
        .run()
      expect(navigate).toHaveBeenCalledWith(Screens.KycLanding, {
        flow: normalizedQuoteKyc.flow,
        quote: normalizedQuoteKyc,
        step: 'two',
      })
    })
    it('navigates to link account if kyc is not required and fiat account is not found', async () => {
      await expectSaga(_checkFiatAccountAndNavigate, {
        quote: normalizedQuote,
        isKycRequired: false,
        isKycApproved: false,
      })
        .provide([[matches.call.fn(_getFiatAccount), null], { call: provideDelay }])
        .call(_getFiatAccount, expectedGetFiatAccountArgs(normalizedQuote))
        .run()
      expect(navigate).toHaveBeenCalledWith(Screens.FiatConnectLinkAccount, {
        flow: normalizedQuote.flow,
        quote: normalizedQuote,
      })
    })
    it('saves fiat account and navigates to review screen if kyc is not required and fiat account is found', async () => {
      await expectSaga(_checkFiatAccountAndNavigate, {
        quote: normalizedQuote,
        isKycRequired: false,
        isKycApproved: false,
      })
        .provide([[matches.call.fn(_getFiatAccount), fiatAccount], { call: provideDelay }])
        .call(_getFiatAccount, expectedGetFiatAccountArgs(normalizedQuote))
        .put(fiatAccountUsed(expectedFiatConnectUsedArgs(normalizedQuote)))
        .run()
      expect(navigate).toHaveBeenCalledWith(Screens.FiatConnectReview, {
        normalizedQuote,
        flow: normalizedQuote.flow,
        fiatAccount,
      })
    })
    it('saves fiat account and navigates to review screen if kyc is required and approved and fiat account is found', async () => {
      await expectSaga(_checkFiatAccountAndNavigate, {
        quote: normalizedQuoteKyc,
        isKycRequired: true,
        isKycApproved: true,
      })
        .provide([[matches.call.fn(_getFiatAccount), fiatAccount], { call: provideDelay }])
        .call(_getFiatAccount, expectedGetFiatAccountArgs(normalizedQuoteKyc))
        .put(fiatAccountUsed(expectedFiatConnectUsedArgs(normalizedQuoteKyc)))
        .run()
      expect(navigate).toHaveBeenCalledWith(Screens.FiatConnectReview, {
        normalizedQuote: normalizedQuoteKyc,
        flow: normalizedQuoteKyc.flow,
        fiatAccount,
      })
    })
    it('saves fiat account and navigates to pending screen if kyc is required and pending and fiat account is found', async () => {
      await expectSaga(_checkFiatAccountAndNavigate, {
        quote: normalizedQuoteKyc,
        isKycRequired: true,
        isKycApproved: false,
      })
        .provide([[matches.call.fn(_getFiatAccount), fiatAccount], { call: provideDelay }])
        .call(_getFiatAccount, expectedGetFiatAccountArgs(normalizedQuoteKyc))
        .put(fiatAccountUsed(expectedFiatConnectUsedArgs(normalizedQuoteKyc)))
        .run()
      expect(navigate).toHaveBeenCalledWith(Screens.KycPending, {
        flow: normalizedQuoteKyc.flow,
        quote: normalizedQuoteKyc,
      })
    })
  })

  describe('handleFetchFiatConnectProviders', () => {
    it('saves on success', async () => {
      jest.mocked(getFiatConnectProviders).mockResolvedValue(mockFiatConnectProviderInfo)
      await expectSaga(handleFetchFiatConnectProviders)
        .provide([[select(walletAddressSelector), '0xabc']])
        .put(fetchFiatConnectProvidersCompleted({ providers: mockFiatConnectProviderInfo }))
        .run()
      expect(getFiatConnectProviders).toHaveBeenCalledWith('0xabc')
    })
    it('fails when account is null', async () => {
      jest.mocked(getFiatConnectProviders).mockResolvedValue(mockFiatConnectProviderInfo)
      await expectSaga(handleFetchFiatConnectProviders)
        .provide([[select(walletAddressSelector), null]])
        .put(fetchFiatConnectProvidersFailed())
        .run()
      expect(getFiatConnectProviders).not.toHaveBeenCalled()
      expect(Logger.error).toHaveBeenCalled()
    })
    it('fails when getProviders fails', async () => {
      jest.mocked(getFiatConnectProviders).mockRejectedValue(new Error('error'))
      await expectSaga(handleFetchFiatConnectProviders)
        .provide([[select(walletAddressSelector), '0xabc']])
        .put(fetchFiatConnectProvidersFailed())
        .run()
      expect(getFiatConnectProviders).toHaveBeenCalledWith('0xabc')
      expect(Logger.error).toHaveBeenCalled()
    })
  })

  describe('handleRefetchQuote', () => {
    const fiatAccount = {
      fiatAccountId: '123',
      providerId: 'provider-two',
      accountName: 'provider two',
      institutionName: 'The fun bank',
      fiatAccountType: FiatAccountType.BankAccount,
      fiatAccountSchema: FiatAccountSchema.AccountNumber,
    }
    const quote = new FiatConnectQuote({
      flow: CICOFlow.CashOut,
      fiatAccountType: FiatAccountType.BankAccount,
      quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
      tokenId: mockCusdTokenId,
    })
    const params = refetchQuote({
      flow: CICOFlow.CashOut,
      cryptoType: quote.getCryptoType(),
      cryptoAmount: quote.getCryptoAmount(),
      fiatAmount: quote.getFiatAmount(),
      providerId: quote.getProviderId(),
      fiatAccount,
      tokenId: quote.getTokenId(),
    })
    it('selects a cached fiat account from _getSpecificQuote if none is provided', async () => {
      const paramsWithoutFiatAccount = refetchQuote({
        flow: CICOFlow.CashOut,
        cryptoType: quote.getCryptoType(),
        cryptoAmount: quote.getCryptoAmount(),
        fiatAmount: quote.getFiatAmount(),
        providerId: quote.getProviderId(),
        tokenId: quote.getTokenId(),
      })
      await expectSaga(handleRefetchQuote, paramsWithoutFiatAccount)
        .provide([
          [
            call(_getSpecificQuote, {
              flow: params.payload.flow,
              digitalAsset: CiCoCurrency.cUSD,
              cryptoAmount: 100,
              fiatAmount: 100,
              providerId: params.payload.providerId,
              fiatAccount: undefined,
              tokenId: mockCusdTokenId,
            }),
            {
              normalizedQuote: quote,
              selectedFiatAccount: fiatAccount,
            },
          ],
        ])
        .put(refetchQuoteCompleted())
        .run()
      expect(navigate).toHaveBeenCalledWith(Screens.FiatConnectReview, {
        flow: params.payload.flow,
        normalizedQuote: quote,
        shouldRefetchQuote: false,
        fiatAccount,
      })
    })
    it('calls refetchQuoteFailed if the _getSpecificQuote throws an error', async () => {
      await expectSaga(handleRefetchQuote, params)
        .provide([
          [
            call(_getSpecificQuote, {
              digitalAsset: CiCoCurrency.cUSD,
              cryptoAmount: 100,
              fiatAmount: 100,
              flow: params.payload.flow,
              providerId: params.payload.providerId,
              fiatAccount,
              tokenId: mockCusdTokenId,
            }),
            throwError(new Error('Could not find quote')),
          ],
        ])
        .put(refetchQuoteFailed({ error: 'could not refetch quote' }))
        .run()
    })
    it('navigates to FiatConnectReview when _getSpecificQuote returns the quote', async () => {
      await expectSaga(handleRefetchQuote, params)
        .provide([
          [
            call(_getSpecificQuote, {
              flow: params.payload.flow,
              digitalAsset: CiCoCurrency.cUSD,
              cryptoAmount: 100,
              fiatAmount: 100,
              providerId: params.payload.providerId,
              fiatAccount,
              tokenId: mockCusdTokenId,
            }),
            {
              normalizedQuote: quote,
              selectedFiatAccount: fiatAccount,
            },
          ],
        ])
        .put(refetchQuoteCompleted())
        .run()
      expect(navigate).toHaveBeenCalledWith(Screens.FiatConnectReview, {
        flow: params.payload.flow,
        normalizedQuote: quote,
        shouldRefetchQuote: false,
        fiatAccount,
      })
    })
  })

  describe('handleAttemptReturnUserFlow', () => {
    const selectProviderParams = {
      amount: {
        crypto: 2,
        fiat: 2,
      },
      flow: CICOFlow.CashOut,
      tokenId: mockCusdTokenId,
    }
    const params = attemptReturnUserFlow({
      ...selectProviderParams,
      providerId: 'provider-two',
      fiatAccountId: '123',
      fiatAccountType: FiatAccountType.BankAccount,
      fiatAccountSchema: FiatAccountSchema.AccountNumber,
      selectedCrypto: CiCoCurrency.cUSD,
    })
    const paramsKyc = attemptReturnUserFlow({
      ...selectProviderParams,
      providerId: 'provider-three',
      fiatAccountId: '123',
      fiatAccountType: FiatAccountType.BankAccount,
      fiatAccountSchema: FiatAccountSchema.AccountNumber,
      selectedCrypto: CiCoCurrency.cUSD,
    })
    const fiatAccount = {
      fiatAccountId: '123',
      accountName: 'My account',
      institutionName: 'The fun bank',
      providerId: 'provider-two',
      fiatAccountType: FiatAccountType.BankAccount,
      fiatAccountSchema: FiatAccountSchema.AccountNumber,
    }

    const fiatAccountKyc = {
      ...fiatAccount,
      providerId: 'provider-three',
    }
    it('navigates to SelectProvider when there is no quote', async () => {
      await expectSaga(handleAttemptReturnUserFlow, params)
        .provide([
          [select(fiatConnectProvidersSelector), mockFiatConnectProviderInfo],
          [
            call(fetchFiatAccountsSaga, 'provider-two', 'fakewebsite.example.com', 'fake-api-key'),
            [fiatAccount],
          ],
          [
            call(_getSpecificQuote, {
              digitalAsset: CiCoCurrency.cUSD,
              cryptoAmount: 2,
              fiatAmount: 2,
              flow: params.payload.flow,
              providerId: params.payload.providerId,
              fiatAccount,
              tokenId: mockCusdTokenId,
            }),
            throwError(new Error('Could not find quote')),
          ],
        ])
        .put(attemptReturnUserFlowCompleted())
        .run()
      expect(navigate).toHaveBeenCalledWith(Screens.SelectProvider, selectProviderParams)
      expect(Logger.debug).toHaveBeenCalledWith(
        'FiatConnectSaga',
        'Failed to use previous fiatAccount to take user directly to Review Screen',
        new Error('Could not find quote')
      )
    })
    it('navigates to SelectProvider when the fiatAccount cannot be found', async () => {
      await expectSaga(handleAttemptReturnUserFlow, params)
        .provide([
          [select(fiatConnectProvidersSelector), mockFiatConnectProviderInfo],
          [
            call(_getSpecificQuote, {
              digitalAsset: CiCoCurrency.cUSD,
              cryptoAmount: 2,
              fiatAmount: 2,
              flow: params.payload.flow,
              providerId: params.payload.providerId,
              fiatAccount,
              tokenId: mockCusdTokenId,
            }),
            {
              normalizedQuote,
              selectedFiatAccount: fiatAccount,
            },
          ],
          [
            call(fetchFiatAccountsSaga, 'provider-two', 'fakewebsite.example.com', 'fake-api-key'),
            [],
          ],
        ])
        .put(attemptReturnUserFlowCompleted())
        .run()
      expect(navigate).toHaveBeenCalledWith(Screens.SelectProvider, selectProviderParams)
      expect(Logger.debug).toHaveBeenCalledWith(
        'FiatConnectSaga',
        'Failed to use previous fiatAccount to take user directly to Review Screen',
        new Error('Could not find fiat account')
      )
    })
    it('navigates to FiatConnectReview when everything is found and matches for non KYC quote', async () => {
      await expectSaga(handleAttemptReturnUserFlow, params)
        .provide([
          [select(fiatConnectProvidersSelector), mockFiatConnectProviderInfo],
          [
            call(_getSpecificQuote, {
              digitalAsset: CiCoCurrency.cUSD,
              cryptoAmount: 2,
              fiatAmount: 2,
              flow: params.payload.flow,
              providerId: params.payload.providerId,
              fiatAccount,
              tokenId: mockCusdTokenId,
            }),
            {
              normalizedQuote,
              selectedFiatAccount: fiatAccount,
            },
          ],
          [
            call(fetchFiatAccountsSaga, 'provider-two', 'fakewebsite.example.com', 'fake-api-key'),
            [fiatAccount],
          ],
        ])
        .put(attemptReturnUserFlowCompleted())
        .run()
      expect(navigate).toHaveBeenCalledWith(Screens.FiatConnectReview, {
        flow: CICOFlow.CashOut,
        normalizedQuote,
        fiatAccount,
      })
    })
    it('navigates to SelectProvider if quote requires KYC but KYC is not created with provider', async () => {
      await expectSaga(handleAttemptReturnUserFlow, paramsKyc)
        .provide([
          [select(fiatConnectProvidersSelector), mockFiatConnectProviderInfo],
          [
            call(_getSpecificQuote, {
              digitalAsset: CiCoCurrency.cUSD,
              cryptoAmount: 2,
              fiatAmount: 2,
              flow: paramsKyc.payload.flow,
              providerId: paramsKyc.payload.providerId,
              fiatAccount: fiatAccountKyc,
              tokenId: mockCusdTokenId,
            }),
            {
              normalizedQuote: normalizedQuoteKyc,
              selectedFiatAccount: fiatAccountKyc,
            },
          ],
          [
            call(fetchFiatAccountsSaga, 'provider-three', 'fakewebsite.example.com', undefined),
            [fiatAccountKyc],
          ],
          [
            call(getKycStatus, {
              providerInfo: normalizedQuoteKyc.getProviderInfo(),
              kycSchemas: [KycSchema.PersonalDataAndDocuments],
            }),
            {
              providerId: normalizedQuoteKyc.getProviderId(),
              kycStatus: {
                [KycSchema.PersonalDataAndDocuments]: FiatConnectKycStatus.KycNotCreated,
              },
            },
          ],
        ])
        .put(attemptReturnUserFlowCompleted())
        .run()
      expect(navigate).toHaveBeenCalledWith(Screens.SelectProvider, selectProviderParams)
      expect(Logger.debug).toHaveBeenCalledWith(
        'FiatConnectSaga',
        'Failed to use previous fiatAccount to take user directly to Review Screen',
        new Error('KYC not created')
      )
    })
    it('navigates to FiatConnectReview when everything is found and matches for KYC quote', async () => {
      await expectSaga(handleAttemptReturnUserFlow, paramsKyc)
        .provide([
          [select(fiatConnectProvidersSelector), mockFiatConnectProviderInfo],
          [
            call(_getSpecificQuote, {
              digitalAsset: CiCoCurrency.cUSD,
              cryptoAmount: 2,
              fiatAmount: 2,
              flow: paramsKyc.payload.flow,
              providerId: paramsKyc.payload.providerId,
              fiatAccount: fiatAccountKyc,
              tokenId: mockCusdTokenId,
            }),
            {
              normalizedQuote: normalizedQuoteKyc,
              selectedFiatAccount: fiatAccountKyc,
            },
          ],
          [
            call(fetchFiatAccountsSaga, 'provider-three', 'fakewebsite.example.com', undefined),
            [fiatAccountKyc],
          ],
          [
            call(getKycStatus, {
              providerInfo: normalizedQuoteKyc.getProviderInfo(),
              kycSchemas: [KycSchema.PersonalDataAndDocuments],
            }),
            {
              providerId: normalizedQuoteKyc.getProviderId(),
              kycStatus: {
                [KycSchema.PersonalDataAndDocuments]: FiatConnectKycStatus.KycApproved,
              },
            },
          ],
        ])
        .put(attemptReturnUserFlowCompleted())
        .run()
      expect(navigate).toHaveBeenCalledWith(Screens.FiatConnectReview, {
        flow: CICOFlow.CashOut,
        normalizedQuote: normalizedQuoteKyc,
        fiatAccount: fiatAccountKyc,
      })
    })
    it('navigates to KycPending if KYC is pending', async () => {
      await expectSaga(handleAttemptReturnUserFlow, paramsKyc)
        .provide([
          [select(fiatConnectProvidersSelector), mockFiatConnectProviderInfo],
          [
            call(_getSpecificQuote, {
              digitalAsset: CiCoCurrency.cUSD,
              cryptoAmount: 2,
              fiatAmount: 2,
              flow: paramsKyc.payload.flow,
              providerId: paramsKyc.payload.providerId,
              fiatAccount: fiatAccountKyc,
              tokenId: mockCusdTokenId,
            }),
            {
              normalizedQuote: normalizedQuoteKyc,
              selectedFiatAccount: fiatAccountKyc,
            },
          ],
          [
            call(fetchFiatAccountsSaga, 'provider-three', 'fakewebsite.example.com', undefined),
            [fiatAccountKyc],
          ],
          [
            call(getKycStatus, {
              providerInfo: normalizedQuoteKyc.getProviderInfo(),
              kycSchemas: [KycSchema.PersonalDataAndDocuments],
            }),
            {
              providerId: normalizedQuoteKyc.getProviderId(),
              kycStatus: {
                [KycSchema.PersonalDataAndDocuments]: FiatConnectKycStatus.KycPending,
              },
            },
          ],
        ])
        .put(attemptReturnUserFlowCompleted())
        .run()
      expect(navigate).toHaveBeenCalledWith(Screens.KycPending, {
        flow: paramsKyc.payload.flow,
        quote: normalizedQuoteKyc,
      })
    })
    it('navigates to KycExpired if KYC is expired', async () => {
      await expectSaga(handleAttemptReturnUserFlow, paramsKyc)
        .provide([
          [select(fiatConnectProvidersSelector), mockFiatConnectProviderInfo],
          [
            call(_getSpecificQuote, {
              digitalAsset: CiCoCurrency.cUSD,
              cryptoAmount: 2,
              fiatAmount: 2,
              flow: paramsKyc.payload.flow,
              providerId: paramsKyc.payload.providerId,
              fiatAccount: fiatAccountKyc,
              tokenId: mockCusdTokenId,
            }),
            {
              normalizedQuote: normalizedQuoteKyc,
              selectedFiatAccount: fiatAccountKyc,
            },
          ],
          [
            call(fetchFiatAccountsSaga, 'provider-three', 'fakewebsite.example.com', undefined),
            [fiatAccountKyc],
          ],
          [
            call(getKycStatus, {
              providerInfo: normalizedQuoteKyc.getProviderInfo(),
              kycSchemas: [KycSchema.PersonalDataAndDocuments],
            }),
            {
              providerId: normalizedQuoteKyc.getProviderId(),
              kycStatus: {
                [KycSchema.PersonalDataAndDocuments]: FiatConnectKycStatus.KycExpired,
              },
            },
          ],
        ])
        .put(attemptReturnUserFlowCompleted())
        .run()
      expect(navigate).toHaveBeenCalledWith(Screens.KycExpired, {
        flow: paramsKyc.payload.flow,
        quote: normalizedQuoteKyc,
      })
    })
    it('navigates to KycDenied if KYC is denied', async () => {
      await expectSaga(handleAttemptReturnUserFlow, paramsKyc)
        .provide([
          [select(fiatConnectProvidersSelector), mockFiatConnectProviderInfo],
          [
            call(_getSpecificQuote, {
              digitalAsset: CiCoCurrency.cUSD,
              cryptoAmount: 2,
              fiatAmount: 2,
              flow: paramsKyc.payload.flow,
              providerId: paramsKyc.payload.providerId,
              fiatAccount: fiatAccountKyc,
              tokenId: mockCusdTokenId,
            }),
            {
              normalizedQuote: normalizedQuoteKyc,
              selectedFiatAccount: fiatAccountKyc,
            },
          ],
          [
            call(fetchFiatAccountsSaga, 'provider-three', 'fakewebsite.example.com', undefined),
            [fiatAccountKyc],
          ],
          [
            call(getKycStatus, {
              providerInfo: normalizedQuoteKyc.getProviderInfo(),
              kycSchemas: [KycSchema.PersonalDataAndDocuments],
            }),
            {
              providerId: normalizedQuoteKyc.getProviderId(),
              kycStatus: {
                [KycSchema.PersonalDataAndDocuments]: FiatConnectKycStatus.KycDenied,
              },
            },
          ],
        ])
        .put(attemptReturnUserFlowCompleted())
        .run()
      expect(navigate).toHaveBeenCalledWith(Screens.KycDenied, {
        flow: paramsKyc.payload.flow,
        quote: normalizedQuoteKyc,
        retryable: true,
      })
    })
  })

  describe('fetchFiatAccountsSaga', () => {
    const mockGetFiatAccounts = jest.fn()
    const mockFcClient = {
      getFiatAccounts: mockGetFiatAccounts,
    }
    it('throws when fetching the client errors', async () => {
      mockGetFiatAccounts.mockResolvedValueOnce(Result.err(new Error('error')))
      await expect(
        async () =>
          await expectSaga(
            fetchFiatAccountsSaga,
            'test-provider',
            'www.hello.example.com',
            undefined
          )
            .provide([
              [
                call(getFiatConnectClient, 'test-provider', 'www.hello.example.com', undefined),
                mockFcClient,
              ],
            ])
            .run()
      ).rejects.toThrow()
    })
    it('returns the fiatAccounts when the call is successful', async () => {
      mockGetFiatAccounts.mockResolvedValue(
        Result.ok({
          BankAccount: [
            {
              fiatAccountId: '123',
              fiatAccountType: 'BankAccount',
              accountName: '(...1234)',
              institutionName: 'My Bank',
            },
          ],
        })
      )
      await expectSaga(fetchFiatAccountsSaga, 'test-provider', 'www.hello.example.com', undefined)
        .provide([
          [
            call(getFiatConnectClient, 'test-provider', 'www.hello.example.com', undefined),
            mockFcClient,
          ],
        ])
        .returns([
          {
            fiatAccountId: '123',
            fiatAccountType: 'BankAccount',
            accountName: '(...1234)',
            institutionName: 'My Bank',
            providerId: 'test-provider',
          },
        ])
        .run()
    })
  })

  describe('_initiateTransferWithProvider', () => {
    const transferOutFcQuote = new FiatConnectQuote({
      flow: CICOFlow.CashOut,
      quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
      fiatAccountType: FiatAccountType.BankAccount,
      tokenId: mockCusdTokenId,
    })

    const quoteId = transferOutFcQuote.getQuoteId()
    const providerId = transferOutFcQuote.getProviderId()
    const providerBaseUrl = transferOutFcQuote.getProviderBaseUrl()
    const providerApiKey = transferOutFcQuote.getProviderApiKey()

    const mockTransferOut = jest.fn()
    const mockFcClient = {
      transferOut: mockTransferOut,
    }
    jest.mocked(uuidv4).mockReturnValue('mock-uuidv4')
    it('calls the fiatconnect transfer function and returns the transfer results', async () => {
      mockTransferOut.mockResolvedValueOnce(
        Result.ok({
          transferId: 'transfer1',
          transferStatus: TransferStatus.TransferReadyForUserToSendCryptoFunds,
          transferAddress: '0xabc',
        })
      )
      await expectSaga(
        _initiateTransferWithProvider,
        createFiatConnectTransfer({
          flow: CICOFlow.CashOut,
          fiatConnectQuote: transferOutFcQuote,
          fiatAccountId: 'account1',
        })
      )
        .provide([
          [call(getFiatConnectClient, providerId, providerBaseUrl, providerApiKey), mockFcClient],
        ])
        .returns({
          transferId: 'transfer1',
          transferStatus: TransferStatus.TransferReadyForUserToSendCryptoFunds,
          transferAddress: '0xabc',
        })
        .run()

      expect(mockTransferOut).toHaveBeenCalledWith({
        data: { fiatAccountId: 'account1', quoteId },
        idempotencyKey: 'mock-uuidv4',
      })
      expect(AppAnalytics.track).toHaveBeenCalledTimes(0)
    })
    it('throws when there is an error with the transfer', async () => {
      mockTransferOut.mockResolvedValueOnce(
        Result.err(
          new ResponseError('FiatConnect API Error', { error: FiatConnectError.Unauthorized })
        )
      )
      await expect(() =>
        expectSaga(
          _initiateTransferWithProvider,
          createFiatConnectTransfer({
            flow: CICOFlow.CashOut,
            fiatConnectQuote: transferOutFcQuote,
            fiatAccountId: 'account1',
          })
        )
          .provide([
            [call(getFiatConnectClient, providerId, providerBaseUrl, providerApiKey), mockFcClient],
          ])
          .run()
      ).rejects.toThrow()

      expect(mockTransferOut).toHaveBeenCalledWith({
        data: { fiatAccountId: 'account1', quoteId },
        idempotencyKey: 'mock-uuidv4',
      })
      expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
      expect(AppAnalytics.track).toHaveBeenCalledWith(
        FiatExchangeEvents.cico_fc_transfer_api_error,
        {
          provider: providerId,
          flow: CICOFlow.CashOut,
          fiatConnectError: FiatConnectError.Unauthorized,
          error: 'FiatConnect API Error',
        }
      )
    })
  })

  describe('_initiateSendTxToProvider', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      mockedSendPreparedTransactions.mockResolvedValue(['0x12345'])
    })

    const transferOutFcQuote = new FiatConnectQuote({
      flow: CICOFlow.CashOut,
      quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
      fiatAccountType: FiatAccountType.BankAccount,
      tokenId: mockCusdTokenId,
    })
    const transferAddress = mockAccount2
    const mockSerializablePreparedTransaction: SerializableTransactionRequest = {
      gas: '51613',
      _baseFeePerGas: '25000000000',
      to: mockCusdAddress as Address,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: 'transfer',
        args: [transferAddress, BigInt(100e18)],
      }),
      maxFeePerGas: '52000000000',
      maxPriorityFeePerGas: '2000000000',
      from: mockAccount3,
    }

    const cryptoTypeToInfo: Record<CryptoType, TokenBalance> = {
      // if this fails to build due to a missing key, add fixture data for the new key! Do NOT just update the type,
      //  coverage for every CryptoType is important.
      [CryptoType.CELO]: mockCeloTokenBalance,
      [CryptoType.cUSD]: mockCusdTokenBalance,
      [CryptoType.cEUR]: mockCeurTokenBalance,
      [CryptoType.cREAL]: mockCrealTokenBalance,
    }

    it.each(Object.keys(CryptoType) as CryptoType[])(
      'able to send tx and get tx hash for CryptoType %s',
      async (cryptoType) => {
        const quote = {
          ...(_.cloneDeep(mockFiatConnectQuotes[1]) as FiatConnectQuoteSuccess),
          tokenId: mockCusdTokenId,
        }
        quote.quote.cryptoType = cryptoType
        const fiatConnectQuote = new FiatConnectQuote({
          flow: CICOFlow.CashOut,
          quote,
          fiatAccountType: FiatAccountType.BankAccount,
          tokenId: mockCusdTokenId,
        })
        const tokenInfo = cryptoTypeToInfo[cryptoType]
        const serializablePreparedTransaction = {
          ...mockSerializablePreparedTransaction,
          to: tokenInfo.address as Address,
        }
        await expectSaga(_initiateSendTxToProvider, {
          transferAddress,
          fiatConnectQuote,
          tokenInfo,
          serializablePreparedTransaction,
        })
          .returns('0x12345')
          .run()

        expect(mockedSendPreparedTransactions).toHaveBeenCalledTimes(1)
        expect(mockedSendPreparedTransactions).toHaveBeenCalledWith(
          [serializablePreparedTransaction],
          NetworkId['celo-alfajores'],
          expect.arrayContaining([expect.any(Function)])
        )
      }
    )
    it('throws when there is an error (safe to retry) with the transaction', async () => {
      jest.mocked(isTxPossiblyPending).mockReturnValue(false)
      mockedSendPreparedTransactions.mockRejectedValue(new Error('error is safe to retry'))

      await expect(() =>
        expectSaga(_initiateSendTxToProvider, {
          transferAddress: '0xabc',
          fiatConnectQuote: transferOutFcQuote,
          serializablePreparedTransaction: mockSerializablePreparedTransaction,
          tokenInfo: mockCusdTokenBalance,
        }).run()
      ).rejects.toThrow(
        new FiatConnectTxError(
          'Error while attempting to send funds for FiatConnect transfer out',
          false,
          new Error('error is safe to retry')
        )
      )
      expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
      expect(AppAnalytics.track).toHaveBeenCalledWith(
        FiatExchangeEvents.cico_fc_transfer_tx_error,
        {
          provider: transferOutFcQuote.getProviderId(),
          flow: CICOFlow.CashOut,
          transferAddress: '0xabc',
          error: 'error is safe to retry',
        }
      )
    })
    it('throws when there is a miscellanious error (not safe to retry) with the transaction', async () => {
      jest.mocked(isTxPossiblyPending).mockReturnValue(true)
      mockedSendPreparedTransactions.mockRejectedValue(new Error('unsafe error'))

      await expect(() =>
        expectSaga(_initiateSendTxToProvider, {
          transferAddress: '0xabc',
          fiatConnectQuote: transferOutFcQuote,
          serializablePreparedTransaction: mockSerializablePreparedTransaction,
          tokenInfo: mockCusdTokenBalance,
        }).run()
      ).rejects.toThrow(
        new FiatConnectTxError(
          'Error while attempting to send funds for FiatConnect transfer out',
          true,
          new Error('unsafe error')
        )
      )
      expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
      expect(AppAnalytics.track).toHaveBeenCalledWith(
        FiatExchangeEvents.cico_fc_transfer_tx_error,
        {
          provider: transferOutFcQuote.getProviderId(),
          flow: CICOFlow.CashOut,
          transferAddress: '0xabc',
          error: 'unsafe error',
        }
      )
    })
  })

  describe('handleCreateFiatConnectTransfer', () => {
    describe('TransferIn', () => {
      const transferInFcQuote = new FiatConnectQuote({
        flow: CICOFlow.CashIn,
        quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
        fiatAccountType: FiatAccountType.BankAccount,
        tokenId: mockCusdTokenId,
      })
      const transferAddress = '0x12345'
      it('calls transfer in', async () => {
        const action = createFiatConnectTransfer({
          flow: CICOFlow.CashIn,
          fiatConnectQuote: transferInFcQuote,
          fiatAccountId: 'account1',
        })
        await expectSaga(handleCreateFiatConnectTransfer, action)
          .provide([[call(_initiateTransferWithProvider, action), { transferAddress }]])
          .put(
            createFiatConnectTransferCompleted({
              flow: CICOFlow.CashIn,
              quoteId: transferInFcQuote.getQuoteId(),
              txHash: null,
            })
          )
          .run()
        expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
        expect(AppAnalytics.track).toHaveBeenCalledWith(
          FiatExchangeEvents.cico_fc_transfer_success,
          {
            provider: transferInFcQuote.getProviderId(),
            flow: CICOFlow.CashIn,
            transferAddress,
            txHash: null,
          }
        )
      })
    })
    describe('TransferOut', () => {
      const transferOutFcQuote = new FiatConnectQuote({
        flow: CICOFlow.CashOut,
        quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
        fiatAccountType: FiatAccountType.BankAccount,
        tokenId: mockCusdTokenId,
      })
      const transferAddress = mockAccount2
      const transactionHash = '0xabc'
      const transferId = 'transferId12345'
      const fiatAccountId = 'account1'
      const networkId = NetworkId['celo-alfajores']
      const mockBaseSerializablePreparedTransaction: SerializableTransactionRequest = {
        gas: '51613',
        _baseFeePerGas: '25000000000',
        to: mockCusdAddress as Address,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: 'transfer',
          args: [mockAccount3, BigInt(100e18)], // own account, 100 cUSD
        }),
        maxFeePerGas: '52000000000',
        maxPriorityFeePerGas: '2000000000',
        from: mockAccount3,
      }
      const mockFinalSerializablePreparedTransaction: SerializableTransactionRequest = {
        ...mockBaseSerializablePreparedTransaction,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: 'transfer',
          args: [transferAddress, BigInt(100e18)], // provider account, 100 cUSD
        }),
      }

      it('calls transfer out and initiates a transaction', async () => {
        const action = createFiatConnectTransfer({
          flow: CICOFlow.CashOut,
          fiatConnectQuote: transferOutFcQuote,
          fiatAccountId,
          serializablePreparedTransaction: mockBaseSerializablePreparedTransaction,
          networkId,
        })
        await expectSaga(handleCreateFiatConnectTransfer, action)
          .provide([
            [call(_initiateTransferWithProvider, action), { transferAddress, transferId }],
            [select(tokensByIdSelector, [networkId]), { [mockCusdTokenId]: mockCusdTokenBalance }],
            [
              call(_initiateSendTxToProvider, {
                transferAddress,
                fiatConnectQuote: transferOutFcQuote,
                tokenInfo: mockCusdTokenBalance,
                serializablePreparedTransaction: mockFinalSerializablePreparedTransaction,
              }),
              transactionHash,
            ],
          ])
          .put(
            cacheFiatConnectTransfer({
              txHash: transactionHash,
              transferId,
              fiatAccountId,
              providerId: transferOutFcQuote.getProviderId(),
              quote: transferOutFcQuote.quote.quote,
            })
          )
          .put(
            createFiatConnectTransferCompleted({
              flow: CICOFlow.CashOut,
              quoteId: transferOutFcQuote.getQuoteId(),
              txHash: transactionHash,
            })
          )
          .run()
        expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
        expect(AppAnalytics.track).toHaveBeenCalledWith(
          FiatExchangeEvents.cico_fc_transfer_success,
          {
            provider: transferOutFcQuote.getProviderId(),
            flow: CICOFlow.CashOut,
            transferAddress,
            txHash: transactionHash,
          }
        )
      })
      it('sets transaction as pending when an unsafe error occurs', async () => {
        const action = createFiatConnectTransfer({
          flow: CICOFlow.CashOut,
          fiatConnectQuote: transferOutFcQuote,
          fiatAccountId: 'account1',
          serializablePreparedTransaction: mockBaseSerializablePreparedTransaction,
          networkId,
        })
        await expectSaga(handleCreateFiatConnectTransfer, action)
          .provide([
            [call(_initiateTransferWithProvider, action), { transferAddress }],
            [select(tokensByIdSelector, [networkId]), { [mockCusdTokenId]: mockCusdTokenBalance }],
            [
              call(_initiateSendTxToProvider, {
                transferAddress,
                fiatConnectQuote: transferOutFcQuote,
                tokenInfo: mockCusdTokenBalance,
                serializablePreparedTransaction: mockFinalSerializablePreparedTransaction,
              }),
              throwError(
                new FiatConnectTxError('some error', true, new Error('some internal error'))
              ),
            ],
          ])
          .put(
            createFiatConnectTransferTxProcessing({
              flow: CICOFlow.CashOut,
              quoteId: transferOutFcQuote.getQuoteId(),
            })
          )
          .run()
        expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
        expect(AppAnalytics.track).toHaveBeenCalledWith(FiatExchangeEvents.cico_fc_transfer_error, {
          provider: transferOutFcQuote.getProviderId(),
          flow: CICOFlow.CashOut,
          error: 'some error',
        })
      })
      it('sets transaction as failed when an "safe" error occurs', async () => {
        const action = createFiatConnectTransfer({
          flow: CICOFlow.CashOut,
          fiatConnectQuote: transferOutFcQuote,
          fiatAccountId: 'account1',
          serializablePreparedTransaction: mockBaseSerializablePreparedTransaction,
          networkId,
        })
        await expectSaga(handleCreateFiatConnectTransfer, action)
          .provide([
            [call(_initiateTransferWithProvider, action), { transferAddress }],
            [select(tokensByIdSelector, [networkId]), { [mockCusdTokenId]: mockCusdTokenBalance }],
            [
              call(_initiateSendTxToProvider, {
                transferAddress,
                fiatConnectQuote: transferOutFcQuote,
                tokenInfo: mockCusdTokenBalance,
                serializablePreparedTransaction: mockFinalSerializablePreparedTransaction,
              }),
              throwError(
                new FiatConnectTxError('some error', false, new Error('some internal error'))
              ),
            ],
          ])
          .put(
            createFiatConnectTransferFailed({
              flow: CICOFlow.CashOut,
              quoteId: transferOutFcQuote.getQuoteId(),
            })
          )
          .run()
        expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
        expect(AppAnalytics.track).toHaveBeenCalledWith(FiatExchangeEvents.cico_fc_transfer_error, {
          provider: transferOutFcQuote.getProviderId(),
          flow: CICOFlow.CashOut,
          error: 'some error',
        })
      })
    })
    describe('Errors', () => {
      const transferInFcQuote = new FiatConnectQuote({
        flow: CICOFlow.CashIn,
        quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
        fiatAccountType: FiatAccountType.BankAccount,
        tokenId: mockCusdTokenId,
      })
      it('Handles thrown errors and logs them', async () => {
        const action = createFiatConnectTransfer({
          flow: CICOFlow.CashIn,
          fiatConnectQuote: transferInFcQuote,
          fiatAccountId: 'account1',
        })
        await expectSaga(handleCreateFiatConnectTransfer, action)
          .provide([[call(_initiateTransferWithProvider, action), throwError(new Error('ERROR'))]])
          .put(
            createFiatConnectTransferFailed({
              flow: CICOFlow.CashIn,
              quoteId: transferInFcQuote.getQuoteId(),
            })
          )
          .run()
        expect(Logger.error).toHaveBeenCalledTimes(1)
        expect(Logger.error).toHaveBeenCalledWith(
          `FiatConnectSaga`,
          `Transfer for CashIn failed..`,
          new Error('ERROR')
        )
        expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
        expect(AppAnalytics.track).toHaveBeenCalledWith(FiatExchangeEvents.cico_fc_transfer_error, {
          provider: transferInFcQuote.getProviderId(),
          flow: CICOFlow.CashOut,
          error: 'ERROR',
        })
      })
    })
  })

  describe('_getFiatAccount', () => {
    const mockFiatAccounts = [
      {
        fiatAccountId: '123',
        accountName: 'some account name',
        institutionName: 'some institution',
        fiatAccountType: FiatAccountType.BankAccount,
        fiatAccountSchema: FiatAccountSchema.AccountNumber,
      },
      {
        fiatAccountId: '456',
        accountName: 'some account name',
        institutionName: 'some institution',
        fiatAccountType: FiatAccountType.BankAccount,
        fiatAccountSchema: FiatAccountSchema.DuniaWallet,
      },
      {
        fiatAccountId: '789',
        accountName: 'some account name',
        institutionName: 'some institution',
        fiatAccountType: FiatAccountType.MobileMoney,
        fiatAccountSchema: FiatAccountSchema.MobileMoney,
      },
    ]

    it('throws an error when no matching provider is given', async () => {
      await expect(
        async () =>
          await expectSaga(_getFiatAccount, {
            fiatConnectProviders: mockFiatConnectProviderInfo,
            providerId: 'fake-provider',
          }).run()
      ).rejects.toThrow('Could not find provider')
    })
    it('returns account with matching ID', async () => {
      await expectSaga(_getFiatAccount, {
        fiatConnectProviders: mockFiatConnectProviderInfo,
        providerId: 'provider-two',
        fiatAccountId: '789',
      })
        .provide([
          [
            call(fetchFiatAccountsSaga, 'provider-two', 'fakewebsite.example.com', 'fake-api-key'),
            mockFiatAccounts,
          ],
        ])
        .returns(mockFiatAccounts[2])
        .run()
    })
    it('returns account with matching type', async () => {
      await expectSaga(_getFiatAccount, {
        fiatConnectProviders: mockFiatConnectProviderInfo,
        providerId: 'provider-two',
        fiatAccountType: FiatAccountType.BankAccount,
      })
        .provide([
          [
            call(fetchFiatAccountsSaga, 'provider-two', 'fakewebsite.example.com', 'fake-api-key'),
            mockFiatAccounts,
          ],
        ])
        .returns(mockFiatAccounts[0])
        .run()
    })
    it('returns account with matching schema', async () => {
      await expectSaga(_getFiatAccount, {
        fiatConnectProviders: mockFiatConnectProviderInfo,
        providerId: 'provider-two',
        fiatAccountSchema: FiatAccountSchema.DuniaWallet,
      })
        .provide([
          [
            call(fetchFiatAccountsSaga, 'provider-two', 'fakewebsite.example.com', 'fake-api-key'),
            mockFiatAccounts,
          ],
        ])
        .returns(mockFiatAccounts[1])
        .run()
    })
    it('returns account when all filters defined', async () => {
      await expectSaga(_getFiatAccount, {
        fiatConnectProviders: mockFiatConnectProviderInfo,
        providerId: 'provider-two',
        fiatAccountType: FiatAccountType.BankAccount,
        fiatAccountSchema: FiatAccountSchema.DuniaWallet,
        fiatAccountId: '456',
      })
        .provide([
          [
            call(fetchFiatAccountsSaga, 'provider-two', 'fakewebsite.example.com', 'fake-api-key'),
            mockFiatAccounts,
          ],
        ])
        .returns(mockFiatAccounts[1])
        .run()
    })
    it('returns null when no accounts match', async () => {
      await expectSaga(_getFiatAccount, {
        fiatConnectProviders: mockFiatConnectProviderInfo,
        providerId: 'provider-two',
        fiatAccountSchema: FiatAccountSchema.IBANNumber,
      })
        .provide([
          [
            call(fetchFiatAccountsSaga, 'provider-two', 'fakewebsite.example.com', 'fake-api-key'),
            mockFiatAccounts,
          ],
        ])
        .returns(null)
        .run()
    })
  })

  describe('_selectQuoteFromFiatAccount', () => {
    const normalizedQuotes = normalizeFiatConnectQuotes(
      CICOFlow.CashOut,
      [mockFiatConnectQuotes[1]],
      mockCusdTokenId
    )

    it('selects a matching quote when one exists', () => {
      const fiatAccount = {
        fiatAccountId: '456',
        accountName: 'account 1',
        institutionName: 'some institution',
        fiatAccountType: FiatAccountType.BankAccount,
        fiatAccountSchema: FiatAccountSchema.AccountNumber,
        providerId: 'provider-one',
      }
      const selectedQuote = _selectQuoteMatchingFiatAccount({
        normalizedQuotes,
        fiatAccount,
      })
      expect(selectedQuote).toEqual(normalizedQuotes[0])
    })

    it('returns null when no matching quote exists', () => {
      const fiatAccount = {
        fiatAccountId: '456',
        accountName: 'account 1',
        institutionName: 'some institution',
        fiatAccountType: FiatAccountType.BankAccount,
        fiatAccountSchema: FiatAccountSchema.DuniaWallet,
        providerId: 'provider-one',
      }
      const selectedQuote = _selectQuoteMatchingFiatAccount({
        normalizedQuotes,
        fiatAccount,
      })
      expect(selectedQuote).not.toBeDefined()
    })
  })

  describe('_selectQuoteAndFiatAccount', () => {
    const normalizedQuotes = normalizeFiatConnectQuotes(
      CICOFlow.CashOut,
      mockFiatConnectQuotes,
      mockCusdTokenId
    )

    const fiatAccounts = [
      {
        fiatAccountId: '123',
        accountName: 'account one',
        institutionName: 'some institution',
        fiatAccountType: FiatAccountType.DuniaWallet,
        fiatAccountSchema: FiatAccountSchema.DuniaWallet,
        providerId: 'provider-one',
      },
      {
        fiatAccountId: '456',
        accountName: 'account two',
        institutionName: 'some institution',
        fiatAccountType: FiatAccountType.BankAccount,
        fiatAccountSchema: FiatAccountSchema.AccountNumber,
        providerId: 'provider-one',
      },
      {
        fiatAccountId: '789',
        accountName: 'account three',
        institutionName: 'some institution',
        fiatAccountType: FiatAccountType.BankAccount,
        fiatAccountSchema: FiatAccountSchema.AccountNumber,
        providerId: 'provider-one',
      },
    ]

    it('throws when provider not found', async () => {
      await expect(
        async () =>
          await expectSaga(_selectQuoteAndFiatAccount, {
            normalizedQuotes,
            providerId: 'fake-provider',
          })
            .provide([[select(fiatConnectProvidersSelector), mockFiatConnectProviderInfo]])
            .run()
      ).rejects.toThrow('Could not find provider')
    })

    it('throws when no account-quote pair found', async () => {
      await expect(
        async () =>
          await expectSaga(_selectQuoteAndFiatAccount, {
            normalizedQuotes,
            providerId: 'provider-one',
          })
            .provide([
              [select(fiatConnectProvidersSelector), mockFiatConnectProviderInfo],
              [
                call(
                  fetchFiatAccountsSaga,
                  'provider-one',
                  mockFiatConnectProviderInfo[1].baseUrl,
                  mockFiatConnectProviderInfo[1].apiKey
                ),
                fiatAccounts.slice(0, 1),
              ],
            ])
            .run()
      ).rejects.toThrow('Could not find a fiat account matching any provided quote')
    })

    it('returns an accout-quote pair when one is found', async () => {
      await expectSaga(_selectQuoteAndFiatAccount, {
        normalizedQuotes,
        providerId: 'provider-one',
      })
        .provide([
          [select(fiatConnectProvidersSelector), mockFiatConnectProviderInfo],
          [
            call(
              fetchFiatAccountsSaga,
              'provider-one',
              mockFiatConnectProviderInfo[1].baseUrl,
              mockFiatConnectProviderInfo[1].apiKey
            ),
            fiatAccounts,
          ],
        ])
        .returns({
          normalizedQuote: normalizedQuotes[0],
          selectedFiatAccount: fiatAccounts[1],
        })
        .run()
    })
  })

  describe('_getSpecificQuote', () => {
    const fiatAccount = {
      fiatAccountId: '789',
      accountName: 'some account name',
      institutionName: 'some institution',
      fiatAccountType: FiatAccountType.BankAccount,
      fiatAccountSchema: FiatAccountSchema.AccountNumber,
      providerId: 'provider-c',
    }

    const normalizedQuote = normalizeFiatConnectQuotes(
      CICOFlow.CashOut,
      [mockFiatConnectQuotes[1]],
      mockCusdTokenId
    )[0]

    it('finds a suitable fiat account from on-file accounts if none is provided', async () => {
      await expectSaga(_getSpecificQuote, {
        digitalAsset: CiCoCurrency.cUSD,
        cryptoAmount: 2,
        fiatAmount: 2,
        flow: CICOFlow.CashOut,
        providerId: 'provider-two',
        tokenId: mockCusdTokenId,
      })
        .provide([
          [
            call(_getQuotes, {
              flow: CICOFlow.CashOut,
              digitalAsset: CiCoCurrency.cUSD,
              cryptoAmount: 2,
              fiatAmount: 2,
              providerIds: ['provider-two'],
            }),
            [mockFiatConnectQuotes[1]],
          ],
          [
            call(_selectQuoteAndFiatAccount, {
              normalizedQuotes: [normalizedQuote],
              providerId: 'provider-two',
            }),
            {
              normalizedQuote,
              selectedFiatAccount: fiatAccount,
            },
          ],
        ])
        .returns({
          normalizedQuote,
          selectedFiatAccount: fiatAccount,
        })
        .run()
    })
    it('throws an error if no fiat account is provided and no suitable on-file account is found', async () => {
      await expect(
        async () =>
          await expectSaga(_getSpecificQuote, {
            digitalAsset: CiCoCurrency.cUSD,
            cryptoAmount: 2,
            fiatAmount: 2,
            flow: CICOFlow.CashOut,
            providerId: 'provider-two',
            tokenId: mockCusdTokenId,
          })
            .provide([
              [
                call(_getQuotes, {
                  flow: CICOFlow.CashOut,
                  digitalAsset: CiCoCurrency.cUSD,
                  cryptoAmount: 2,
                  fiatAmount: 2,
                  providerIds: ['provider-two'],
                }),
                [mockFiatConnectQuotes[1]],
              ],
              [
                call(_selectQuoteAndFiatAccount, {
                  normalizedQuotes: [normalizedQuote],
                  providerId: 'provider-two',
                }),
                throwError(new Error('some error')),
              ],
            ])
            .run()
      ).rejects.toThrow('some error')
    })
    it('fetches and returns a quote if fiat account type and schema match', async () => {
      await expectSaga(_getSpecificQuote, {
        digitalAsset: CiCoCurrency.cUSD,
        cryptoAmount: 2,
        fiatAmount: 2,
        flow: CICOFlow.CashOut,
        providerId: 'provider-two',
        fiatAccount,
        tokenId: mockCusdTokenId,
      })
        .provide([
          [
            call(_getQuotes, {
              flow: CICOFlow.CashOut,
              digitalAsset: CiCoCurrency.cUSD,
              cryptoAmount: 2,
              fiatAmount: 2,
              providerIds: ['provider-two'],
            }),
            [mockFiatConnectQuotes[1]],
          ],
        ])
        .returns({
          normalizedQuote: normalizedQuote,
          selectedFiatAccount: fiatAccount,
        })
        .run()
    })
    it('throws if no quote with matching fiatAccountType is found', async () => {
      const duniaFiatAccount = Object.assign(fiatAccount, {
        fiatAccountType: FiatAccountType.DuniaWallet,
      })
      await expect(
        async () =>
          await expectSaga(_getSpecificQuote, {
            digitalAsset: CiCoCurrency.cUSD,
            cryptoAmount: 2,
            fiatAmount: 2,
            flow: CICOFlow.CashOut,
            providerId: 'provider-two',
            fiatAccount: duniaFiatAccount,
            tokenId: mockCusdTokenId,
          })
            .provide([
              [
                call(_getQuotes, {
                  flow: CICOFlow.CashOut,
                  digitalAsset: CiCoCurrency.cUSD,
                  cryptoAmount: 2,
                  fiatAmount: 2,
                  providerIds: ['provider-two'],
                }),
                [mockFiatConnectQuotes[1]],
              ],
            ])
            .run()
      ).rejects.toThrow('Could not find quote')
    })
  })

  describe('handleKycTryAgain', () => {
    const quote = new FiatConnectQuote({
      quote: mockFiatConnectQuotes[3] as FiatConnectQuoteSuccess,
      fiatAccountType: FiatAccountType.BankAccount,
      flow: CICOFlow.CashOut,
      tokenId: mockCusdTokenId,
    })
    const flow = CICOFlow.CashOut

    it('deletes kyc status and navigates to kyc landing screen', async () => {
      jest.mocked(deleteKyc).mockResolvedValueOnce()
      await expectSaga(handleKycTryAgain, kycTryAgain({ flow, quote }))
        .put(kycTryAgainCompleted())
        .run()
      expect(deleteKyc).toHaveBeenCalledTimes(1)
      expect(deleteKyc).toHaveBeenCalledWith({
        providerInfo: quote.getProviderInfo(),
        kycSchema: quote.getKycSchema(),
      })
      expect(navigate).toHaveBeenCalledTimes(1)
      expect(navigate).toHaveBeenCalledWith(Screens.KycLanding, { quote, flow, step: 'one' })
    })

    it('shows error message on delete kyc failure', async () => {
      jest.mocked(deleteKyc).mockRejectedValueOnce(new Error('delete failed'))
      await expectSaga(handleKycTryAgain, kycTryAgain({ flow, quote }))
        .put(kycTryAgainCompleted())
        .run()
      expect(navigate).not.toHaveBeenCalled()
      expect(Logger.error).toHaveBeenCalledWith(
        'FiatConnectSaga',
        'Kyc try again failed',
        new Error('delete failed')
      )
    })

    it('shows error message if quote is missing kyc schema', async () => {
      await expectSaga(
        handleKycTryAgain,
        kycTryAgain({
          flow,
          quote: new FiatConnectQuote({
            quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
            fiatAccountType: FiatAccountType.BankAccount,
            flow,
            tokenId: mockCusdTokenId,
          }),
        })
      )
        .put(kycTryAgainCompleted())
        .run()
      expect(deleteKyc).not.toHaveBeenCalled()
      expect(navigate).not.toHaveBeenCalled()
      expect(Logger.error).toHaveBeenCalledWith(
        'FiatConnectSaga',
        'Kyc try again failed',
        new Error('No KYC Schema found in quote')
      )
    })
  })
})
