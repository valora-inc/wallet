import { Result } from '@badrap/result'
import { ResponseError } from '@fiatconnect/fiatconnect-sdk'
import {
  FiatAccountSchema,
  FiatAccountType,
  FiatConnectError,
  KycSchema,
  KycStatus as FiatConnectKycStatus,
  TransferStatus,
} from '@fiatconnect/fiatconnect-types'
import { expectSaga } from 'redux-saga-test-plan'
import * as matches from 'redux-saga-test-plan/matchers'
import { throwError } from 'redux-saga-test-plan/providers'
import { call, select } from 'redux-saga/effects'
import { KycStatus as PersonaKycStatus } from 'src/account/reducer'
import { showError, showMessage } from 'src/alert/actions'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import {
  fiatConnectCashInEnabledSelector,
  fiatConnectCashOutEnabledSelector,
} from 'src/app/selectors'
import { feeEstimatesSelector } from 'src/fees/selectors'
import { fetchQuotes, FiatConnectQuoteSuccess, getFiatConnectProviders } from 'src/fiatconnect'
import { getFiatConnectClient } from 'src/fiatconnect/clients'
import {
  fetchFiatAccountsSaga,
  handleAttemptReturnUserFlow,
  handleCreateFiatConnectTransfer,
  handleFetchFiatConnectProviders,
  handleFetchFiatConnectQuotes,
  handleRefetchQuote,
  handleSelectFiatConnectQuote,
  handleSubmitFiatAccount,
  _getQuotes,
  _getSpecificQuote,
} from 'src/fiatconnect/saga'
import { fiatConnectProvidersSelector } from 'src/fiatconnect/selectors'
import {
  attemptReturnUserFlow,
  attemptReturnUserFlowCompleted,
  createFiatConnectTransfer,
  createFiatConnectTransferCompleted,
  createFiatConnectTransferFailed,
  fetchFiatConnectProvidersCompleted,
  fetchFiatConnectQuotes,
  fetchFiatConnectQuotesCompleted,
  fetchFiatConnectQuotesFailed,
  fiatAccountUsed,
  refetchQuote,
  refetchQuoteCompleted,
  refetchQuoteFailed,
  selectFiatConnectQuote,
  selectFiatConnectQuoteCompleted,
  submitFiatAccount,
  submitFiatAccountCompleted,
} from 'src/fiatconnect/slice'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { normalizeFiatConnectQuotes } from 'src/fiatExchanges/quotes/normalizeQuotes'
import { CICOFlow } from 'src/fiatExchanges/utils'
import i18n from 'src/i18n'
import { getKycStatus, postKyc } from 'src/in-house-liquidity'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import { buildAndSendPayment } from 'src/send/saga'
import { tokensListSelector } from 'src/tokens/selectors'
import { CiCoCurrency, Currency } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'
import {
  emptyFees,
  mockFiatConnectProviderInfo,
  mockFiatConnectQuotes,
  mockTokenBalances,
} from 'test/values'
import { mocked } from 'ts-jest/utils'
import { v4 as uuidv4 } from 'uuid'

jest.mock('src/analytics/ValoraAnalytics')
jest.mock('src/fiatconnect')
jest.mock('uuid')
jest.mock('src/utils/Logger', () => ({
  __esModule: true,
  namedExport: jest.fn(),
  default: {
    info: jest.fn(),
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
}))

describe('Fiatconnect saga', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  describe('handleSubmitFiatAccount', () => {
    const mockAddFiatAccount = jest.fn()
    const mockFcClient = {
      addFiatAccount: mockAddFiatAccount,
    }
    const normalizedQuote = new FiatConnectQuote({
      quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
      fiatAccountType: FiatAccountType.BankAccount,
      flow: CICOFlow.CashOut,
    })
    const mockObfuscatedAccount = {
      fiatAccountId: 'some id',
      accountName: 'some account name',
      institutionName: 'some institution',
      fiatAccountType: FiatAccountType.BankAccount,
      fiatAccountSchema: FiatAccountSchema.AccountNumber,
    }
    const provideDelay = ({ fn }: { fn: any }, next: any) => (fn.name === 'delayP' ? null : next())
    it('successfully submits account and navigates to review', async () => {
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
            flow: normalizedQuote.flow,
            cryptoType: normalizedQuote.getCryptoType(),
            fiatType: normalizedQuote.getFiatType(),
          })
        )
        .put(submitFiatAccountCompleted())
        .run()
      expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(
        FiatExchangeEvents.cico_fiat_details_success,
        {
          flow: normalizedQuote.flow,
          provider: normalizedQuote.getProviderId(),
          fiatAccountSchema: normalizedQuote.getFiatAccountSchema(),
        }
      )
      expect(navigate).toHaveBeenCalledWith(Screens.FiatConnectReview, {
        normalizedQuote: normalizedQuote,
        flow: normalizedQuote.flow,
        fiatAccount: mockObfuscatedAccount,
      })
    })
    it('does not navigate to review when account already exists', async () => {
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
          showError(
            i18n.t('fiatDetailsScreen.addFiatAccountResourceExist', {
              provider: normalizedQuote.getProviderName(),
            })
          )
        )
        .run()
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(
        FiatExchangeEvents.cico_fiat_details_error,
        {
          flow: normalizedQuote.flow,
          provider: normalizedQuote.getProviderId(),
          fiatAccountSchema: normalizedQuote.getFiatAccountSchema(),
          fiatConnectError: FiatConnectError.ResourceExists,
          error: 'FiatConnect API Error',
        }
      )
      expect(navigate).not.toHaveBeenCalled()
    })
    it('does not navigate to review when experiencing a general error', async () => {
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
          showError(
            i18n.t('fiatDetailsScreen.addFiatAccountFailed', {
              provider: normalizedQuote.getProviderName(),
            })
          )
        )
        .run()
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(
        FiatExchangeEvents.cico_fiat_details_error,
        {
          flow: normalizedQuote.flow,
          provider: normalizedQuote.getProviderId(),
          fiatAccountSchema: normalizedQuote.getFiatAccountSchema(),
          fiatConnectError: undefined,
          error: 'some error',
        }
      )
      expect(navigate).not.toHaveBeenCalled()
    })
  })
  describe('handleFetchFiatConnectQuotes', () => {
    it('saves quotes when fetch is successful', async () => {
      mocked(fetchQuotes).mockImplementation(() => Promise.resolve(mockFiatConnectQuotes))
      await expectSaga(
        handleFetchFiatConnectQuotes,
        fetchFiatConnectQuotes({
          flow: CICOFlow.CashIn,
          digitalAsset: CiCoCurrency.CELO,
          cryptoAmount: 3,
          providerIds: ['provider-one'],
        })
      )
        .provide([
          [select(userLocationDataSelector), { countryCodeAlpha2: 'MX' }],
          [select(getLocalCurrencyCode), 'USD'],
          [select(fiatConnectCashInEnabledSelector), false],
          [select(fiatConnectCashOutEnabledSelector), true],
          [select(fiatConnectProvidersSelector), mockFiatConnectProviderInfo],
        ])
        .put(fetchFiatConnectQuotesCompleted({ quotes: mockFiatConnectQuotes }))
        .run()

      expect(fetchQuotes).toHaveBeenCalledWith({
        country: 'MX',
        cryptoAmount: 3,
        digitalAsset: 'CELO',
        fiatConnectCashInEnabled: false,
        fiatConnectCashOutEnabled: true,
        flow: CICOFlow.CashIn,
        localCurrency: 'USD',
        fiatConnectProviders: [mockFiatConnectProviderInfo[1]],
      })
    })

    it('saves an error', async () => {
      mocked(fetchQuotes).mockRejectedValue({})
      await expectSaga(
        handleFetchFiatConnectQuotes,
        fetchFiatConnectQuotes({
          flow: CICOFlow.CashIn,
          digitalAsset: CiCoCurrency.CELO,
          cryptoAmount: 3,
        })
      )
        .provide([
          [select(userLocationDataSelector), { countryCodeAlpha2: 'MX' }],
          [select(getLocalCurrencyCode), 'USD'],
          [select(fiatConnectCashInEnabledSelector), false],
          [select(fiatConnectCashOutEnabledSelector), true],
          [select(fiatConnectProvidersSelector), mockFiatConnectProviderInfo],
        ])
        .put(fetchFiatConnectQuotesFailed({ error: 'Could not fetch fiatconnect quotes' }))
        .run()

      expect(fetchQuotes).toHaveBeenCalledWith({
        country: 'MX',
        cryptoAmount: 3,
        digitalAsset: 'CELO',
        fiatConnectCashInEnabled: false,
        fiatConnectCashOutEnabled: true,
        flow: CICOFlow.CashIn,
        localCurrency: 'USD',
        fiatConnectProviders: mockFiatConnectProviderInfo,
      })
    })
    it('saves an error when providers is null', async () => {
      mocked(fetchQuotes).mockResolvedValue(mockFiatConnectQuotes)
      await expectSaga(
        handleFetchFiatConnectQuotes,
        fetchFiatConnectQuotes({
          flow: CICOFlow.CashIn,
          digitalAsset: CiCoCurrency.CELO,
          cryptoAmount: 3,
        })
      )
        .provide([
          [select(userLocationDataSelector), { countryCodeAlpha2: 'MX' }],
          [select(getLocalCurrencyCode), 'USD'],
          [select(fiatConnectCashInEnabledSelector), false],
          [select(fiatConnectCashOutEnabledSelector), true],
          [select(fiatConnectProvidersSelector), null],
        ])
        .put(fetchFiatConnectQuotesFailed({ error: 'Could not fetch fiatconnect quotes' }))
        .run()

      expect(fetchQuotes).not.toHaveBeenCalled()
    })
  })

  describe('handleSelectFiatConnectQuote', () => {
    const mockGetFiatAccounts = jest.fn()
    const mockFcClient = {
      getFiatAccounts: mockGetFiatAccounts,
    }
    const normalizedQuote = new FiatConnectQuote({
      quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
      fiatAccountType: FiatAccountType.BankAccount,
      flow: CICOFlow.CashOut,
    })
    const normalizedQuoteKyc = new FiatConnectQuote({
      quote: mockFiatConnectQuotes[3] as FiatConnectQuoteSuccess,
      fiatAccountType: FiatAccountType.BankAccount,
      flow: CICOFlow.CashOut,
    })
    const provideDelay = ({ fn }: { fn: any }, next: any) => (fn.name === 'delayP' ? null : next())
    it('proceeds with saga and eventually navigates to review if KYC is required and is approved', async () => {
      const fiatAccount = {
        fiatAccountId: '123',
        providerId: 'provider-three',
        accountName: 'Provider Three',
        institutionName: 'The fun bank',
        fiatAccountType: FiatAccountType.BankAccount,
      }
      mockGetFiatAccounts.mockResolvedValue(
        Result.ok({
          BankAccount: [fiatAccount],
        })
      )
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
                [KycSchema.PersonalDataAndDocuments]: FiatConnectKycStatus.KycApproved,
              },
            },
          ],
          [matches.call.fn(getFiatConnectClient), mockFcClient],
          { call: provideDelay },
        ])
        .put(
          fiatAccountUsed({
            providerId: normalizedQuoteKyc.getProviderId(),
            fiatAccountId: fiatAccount.fiatAccountId,
            fiatAccountType: normalizedQuoteKyc.getFiatAccountType(),
            flow: normalizedQuoteKyc.flow,
            cryptoType: normalizedQuoteKyc.getCryptoType(),
            fiatType: normalizedQuoteKyc.getFiatType(),
          })
        )
        .put(selectFiatConnectQuoteCompleted())
        .run()
      expect(navigate).toHaveBeenCalledWith(Screens.FiatConnectReview, {
        normalizedQuote: normalizedQuoteKyc,
        flow: normalizedQuoteKyc.flow,
        fiatAccount,
      })
    })
    it('proceeds with saga but eventually navigates to status screen if KYC is pending', async () => {
      const fiatAccount = {
        fiatAccountId: '123',
        providerId: 'provider-three',
        accountName: 'Provider Three',
        institutionName: 'The fun bank',
        fiatAccountType: FiatAccountType.BankAccount,
      }
      mockGetFiatAccounts.mockResolvedValue(
        Result.ok({
          BankAccount: [fiatAccount],
        })
      )
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
                [KycSchema.PersonalDataAndDocuments]: FiatConnectKycStatus.KycPending,
              },
            },
          ],
          [matches.call.fn(getFiatConnectClient), mockFcClient],
          { call: provideDelay },
        ])
        .put(selectFiatConnectQuoteCompleted())
        .run()
      expect(navigate).toHaveBeenCalledWith(Screens.KycPending, {
        flow: normalizedQuoteKyc.flow,
        quote: normalizedQuoteKyc,
      })
    })
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
      })
    })
    it('posts KYC to provider and proceeds with saga if KYC required and exists in Persona', async () => {
      mockGetFiatAccounts.mockResolvedValue(Result.ok({}))
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
                [KycSchema.PersonalDataAndDocuments]: FiatConnectKycStatus.KycNotCreated,
              },
            },
          ],
          [matches.call.fn(postKyc), undefined],
          [matches.call.fn(getFiatConnectClient), mockFcClient],
          { call: provideDelay },
        ])
        .put(selectFiatConnectQuoteCompleted())
        .run()
      expect(navigate).toHaveBeenCalledWith(Screens.FiatConnectLinkAccount, {
        quote: normalizedQuoteKyc,
        flow: normalizedQuoteKyc.flow,
      })
    })
    it('shows an error if FC KYC status is not recognized', async () => {
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
      expect(navigate).not.toHaveBeenCalled()
    })
    it('navigates to link account screen if the fiatAccount is not found', async () => {
      const fiatAccount = {
        fiatAccountId: '123',
        providerId: 'provider-two',
        accountName: 'provider two',
        institutionName: 'The fun bank',
        fiatAccountType: FiatAccountType.DuniaWallet, // not matching fiatAccount type
      }
      mockGetFiatAccounts.mockResolvedValue(
        Result.ok({
          BankAccount: [fiatAccount],
        })
      )
      await expectSaga(
        handleSelectFiatConnectQuote,
        selectFiatConnectQuote({ quote: normalizedQuote })
      )
        .provide([
          [
            call(getFiatConnectClient, 'provider-two', 'fakewebsite.valoraapp.com', 'fake-api-key'),
            mockFcClient,
          ],
          { call: provideDelay },
        ])
        .put(selectFiatConnectQuoteCompleted())
        .run()
      expect(navigate).toHaveBeenCalledWith(Screens.FiatConnectLinkAccount, {
        quote: normalizedQuote,
        flow: normalizedQuote.flow,
      })
    })
    it('saves the fiatAccount in cache and navigates to FiatConnectReview when an account is found', async () => {
      const fiatAccount = {
        fiatAccountId: '123',
        providerId: 'provider-two',
        accountName: 'provider two',
        institutionName: 'The fun bank',
        fiatAccountType: FiatAccountType.BankAccount, // matching fiatAccount type
      }
      mockGetFiatAccounts.mockResolvedValue(
        Result.ok({
          BankAccount: [fiatAccount],
        })
      )
      await expectSaga(
        handleSelectFiatConnectQuote,
        selectFiatConnectQuote({ quote: normalizedQuote })
      )
        .provide([
          [
            call(getFiatConnectClient, 'provider-two', 'fakewebsite.valoraapp.com', 'fake-api-key'),
            mockFcClient,
          ],
          { call: provideDelay },
        ])
        .put(
          fiatAccountUsed({
            providerId: normalizedQuote.getProviderId(),
            fiatAccountId: fiatAccount.fiatAccountId,
            fiatAccountType: normalizedQuote.getFiatAccountType(),
            flow: normalizedQuote.flow,
            cryptoType: normalizedQuote.getCryptoType(),
            fiatType: normalizedQuote.getFiatType(),
          })
        )
        .put(selectFiatConnectQuoteCompleted())
        .run()
      expect(navigate).toHaveBeenCalledWith(Screens.FiatConnectReview, {
        normalizedQuote,
        flow: normalizedQuote.flow,
        fiatAccount,
      })
    })
    it('shows an error if there is an issue fetching the fiatAccount', async () => {
      mockGetFiatAccounts.mockResolvedValue(Result.err(new Error('error')))
      await expectSaga(
        handleSelectFiatConnectQuote,
        selectFiatConnectQuote({ quote: normalizedQuote })
      )
        .provide([
          [call(getFiatConnectClient, 'provider-two', 'fakewebsite.valoraapp.com'), mockFcClient],
        ])
        .put(selectFiatConnectQuoteCompleted())
        .put(showError(ErrorMessages.PROVIDER_FETCH_FAILED))
        .run()
    })
  })

  describe('handleFetchFiatConnectProviders', () => {
    it('saves on success', async () => {
      mocked(getFiatConnectProviders).mockResolvedValue(mockFiatConnectProviderInfo)
      await expectSaga(handleFetchFiatConnectProviders)
        .provide([[select(currentAccountSelector), '0xabc']])
        .put(fetchFiatConnectProvidersCompleted({ providers: mockFiatConnectProviderInfo }))
        .run()
      expect(getFiatConnectProviders).toHaveBeenCalledWith('0xabc')
    })
    it('fails when account is null', async () => {
      mocked(getFiatConnectProviders).mockResolvedValue(mockFiatConnectProviderInfo)
      await expectSaga(handleFetchFiatConnectProviders)
        .provide([[select(currentAccountSelector), null]])
        .run()
      expect(getFiatConnectProviders).not.toHaveBeenCalled()
      expect(Logger.error).toHaveBeenCalled()
    })
    it('fails when getProviders fails', async () => {
      mocked(getFiatConnectProviders).mockRejectedValue(new Error('error'))
      await expectSaga(handleFetchFiatConnectProviders)
        .provide([[select(currentAccountSelector), '0xabc']])
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
    })
    const params = refetchQuote({
      flow: CICOFlow.CashOut,
      quote,
      fiatAccount,
    })
    it('calls refetchQuoteFailed if the _getQuote throws an error', async () => {
      await expectSaga(handleRefetchQuote, params)
        .provide([
          [select(fiatConnectProvidersSelector), mockFiatConnectProviderInfo],
          [
            call(_getSpecificQuote, {
              digitalAsset: CiCoCurrency.CUSD,
              cryptoAmount: 100,
              flow: params.payload.flow,
              providerId: params.payload.quote.getProviderId(),
              fiatAccountType: params.payload.fiatAccount.fiatAccountType,
            }),
            throwError(new Error('Could not find quote')),
          ],
        ])
        .put(refetchQuoteFailed({ error: 'could not refetch quote' }))
        .run()
    })
    it('navigates to FiatConnectReview when _getQuote returns the quote', async () => {
      await expectSaga(handleRefetchQuote, params)
        .provide([
          [select(fiatConnectProvidersSelector), mockFiatConnectProviderInfo],
          [
            call(_getSpecificQuote, {
              digitalAsset: CiCoCurrency.CUSD,
              cryptoAmount: 100,
              flow: params.payload.flow,
              providerId: params.payload.quote.getProviderId(),
              fiatAccountType: params.payload.fiatAccount.fiatAccountType,
            }),
            quote,
          ],
        ])
        .put(refetchQuoteCompleted())
        .run()
      expect(navigate).toHaveBeenCalledWith(Screens.FiatConnectReview, {
        flow: params.payload.flow,
        normalizedQuote: quote,
        fiatAccount,
        shouldRefetchQuote: false,
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
      selectedCrypto: Currency.Dollar,
    }
    const params = attemptReturnUserFlow({
      ...selectProviderParams,
      providerId: 'provider-two',
      fiatAccountId: '123',
      fiatAccountType: FiatAccountType.BankAccount,
    })
    const normalizedQuote = new FiatConnectQuote({
      flow: CICOFlow.CashOut,
      fiatAccountType: FiatAccountType.BankAccount,
      quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
    })
    const paramsKyc = attemptReturnUserFlow({
      ...selectProviderParams,
      providerId: 'provider-three',
      fiatAccountId: '123',
      fiatAccountType: FiatAccountType.BankAccount,
    })
    const normalizedQuoteKyc = new FiatConnectQuote({
      flow: CICOFlow.CashOut,
      fiatAccountType: FiatAccountType.BankAccount,
      quote: mockFiatConnectQuotes[3] as FiatConnectQuoteSuccess,
    })
    it('navigates to SelectProvider when there is no quote', async () => {
      await expectSaga(handleAttemptReturnUserFlow, params)
        .provide([
          [select(fiatConnectProvidersSelector), mockFiatConnectProviderInfo],
          [
            call(_getSpecificQuote, {
              digitalAsset: CiCoCurrency.CUSD,
              cryptoAmount: 2,
              flow: params.payload.flow,
              providerId: params.payload.providerId,
              fiatAccountType: params.payload.fiatAccountType,
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
              digitalAsset: CiCoCurrency.CUSD,
              cryptoAmount: 2,
              flow: params.payload.flow,
              providerId: params.payload.providerId,
              fiatAccountType: params.payload.fiatAccountType,
            }),
            normalizedQuote,
          ],
          [
            call(
              fetchFiatAccountsSaga,
              'provider-two',
              'fakewebsite.valoraapp.com',
              'fake-api-key'
            ),
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
      const fiatAccount = {
        fiatAccountId: '123',
        providerId: 'provider-two',
        accountName: 'provider two',
        institutionName: 'The fun bank',
        FiatAccountType: FiatAccountType.BankAccount,
      }
      await expectSaga(handleAttemptReturnUserFlow, params)
        .provide([
          [select(fiatConnectProvidersSelector), mockFiatConnectProviderInfo],
          [
            call(_getSpecificQuote, {
              digitalAsset: CiCoCurrency.CUSD,
              cryptoAmount: 2,
              flow: params.payload.flow,
              providerId: params.payload.providerId,
              fiatAccountType: params.payload.fiatAccountType,
            }),
            normalizedQuote,
          ],
          [
            call(
              fetchFiatAccountsSaga,
              'provider-two',
              'fakewebsite.valoraapp.com',
              'fake-api-key'
            ),
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
      const fiatAccount = {
        fiatAccountId: '123',
        providerId: 'provider-three',
        accountName: 'provider three',
        institutionName: 'The fun bank',
        FiatAccountType: FiatAccountType.BankAccount,
      }
      await expectSaga(handleAttemptReturnUserFlow, paramsKyc)
        .provide([
          [select(fiatConnectProvidersSelector), mockFiatConnectProviderInfo],
          [
            call(_getSpecificQuote, {
              digitalAsset: CiCoCurrency.CUSD,
              cryptoAmount: 2,
              flow: paramsKyc.payload.flow,
              providerId: paramsKyc.payload.providerId,
              fiatAccountType: paramsKyc.payload.fiatAccountType,
            }),
            normalizedQuoteKyc,
          ],
          [
            call(fetchFiatAccountsSaga, 'provider-three', 'fakewebsite.valoraapp.com', undefined),
            [fiatAccount],
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
      const fiatAccount = {
        fiatAccountId: '123',
        providerId: 'provider-three',
        accountName: 'provider three',
        institutionName: 'The fun bank',
        FiatAccountType: FiatAccountType.BankAccount,
      }
      await expectSaga(handleAttemptReturnUserFlow, paramsKyc)
        .provide([
          [select(fiatConnectProvidersSelector), mockFiatConnectProviderInfo],
          [
            call(_getSpecificQuote, {
              digitalAsset: CiCoCurrency.CUSD,
              cryptoAmount: 2,
              flow: paramsKyc.payload.flow,
              providerId: paramsKyc.payload.providerId,
              fiatAccountType: paramsKyc.payload.fiatAccountType,
            }),
            normalizedQuoteKyc,
          ],
          [
            call(fetchFiatAccountsSaga, 'provider-three', 'fakewebsite.valoraapp.com', undefined),
            [fiatAccount],
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
        fiatAccount,
      })
    })
    it('navigates to KycStatus if KYC is Pending', async () => {
      const fiatAccount = {
        fiatAccountId: '123',
        providerId: 'provider-three',
        accountName: 'provider three',
        institutionName: 'The fun bank',
        FiatAccountType: FiatAccountType.BankAccount,
      }
      await expectSaga(handleAttemptReturnUserFlow, paramsKyc)
        .provide([
          [select(fiatConnectProvidersSelector), mockFiatConnectProviderInfo],
          [
            call(_getSpecificQuote, {
              digitalAsset: CiCoCurrency.CUSD,
              cryptoAmount: 2,
              flow: paramsKyc.payload.flow,
              providerId: paramsKyc.payload.providerId,
              fiatAccountType: paramsKyc.payload.fiatAccountType,
            }),
            normalizedQuoteKyc,
          ],
          [
            call(fetchFiatAccountsSaga, 'provider-three', 'fakewebsite.valoraapp.com', undefined),
            [fiatAccount],
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
      expect(navigate).toHaveBeenCalledWith(Screens.KycStatus)
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
          await expectSaga(fetchFiatAccountsSaga, 'test-provider', 'www.hello.valoraapp.com')
            .provide([
              [
                call(getFiatConnectClient, 'test-provider', 'www.hello.valoraapp.com', undefined),
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
      await expectSaga(fetchFiatAccountsSaga, 'test-provider', 'www.hello.valoraapp.com')
        .provide([
          [
            call(getFiatConnectClient, 'test-provider', 'www.hello.valoraapp.com', undefined),
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

  describe('handleCreateFiatConnectTransfer', () => {
    const transferOutFcQuote = new FiatConnectQuote({
      flow: CICOFlow.CashOut,
      quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
      fiatAccountType: FiatAccountType.BankAccount,
    })

    const quoteId = transferOutFcQuote.getQuoteId()
    const providerId = transferOutFcQuote.getProviderId()
    const providerBaseUrl = transferOutFcQuote.getProviderBaseUrl()
    const providerApiKey = transferOutFcQuote.getProviderApiKey()

    const mockTransferOut = jest.fn()
    const mockFcClient = {
      transferOut: mockTransferOut,
    }
    mocked(uuidv4).mockReturnValue('mock-uuidv4')

    it('calls transfer out and sends payment to provider', async () => {
      mockTransferOut.mockResolvedValueOnce(
        Result.ok({
          transferId: 'transfer1',
          transferStatus: TransferStatus.TransferReadyForUserToSendCryptoFunds,
          transferAddress: '0xabc',
        })
      )
      await expectSaga(
        handleCreateFiatConnectTransfer,
        createFiatConnectTransfer({
          flow: CICOFlow.CashOut,
          fiatConnectQuote: transferOutFcQuote,
          fiatAccountId: 'account1',
        })
      )
        .provide([
          [select(tokensListSelector), Object.values(mockTokenBalances)],
          [select(feeEstimatesSelector), emptyFees],
          [call(getFiatConnectClient, providerId, providerBaseUrl, providerApiKey), mockFcClient],
          [matches.call.fn(buildAndSendPayment), { receipt: { transactionHash: '0x12345' } }],
        ])
        .put(
          createFiatConnectTransferCompleted({
            flow: CICOFlow.CashOut,
            quoteId,
            txHash: '0x12345',
          })
        )
        .run()

      expect(mockTransferOut).toHaveBeenCalledWith({
        data: { fiatAccountId: 'account1', quoteId },
        idempotencyKey: 'mock-uuidv4',
      })
      expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(
        FiatExchangeEvents.cico_fc_transfer_success,
        {
          provider: providerId,
          flow: CICOFlow.CashOut,
          transferAddress: '0xabc',
          txHash: '0x12345',
        }
      )
    })

    it('returns failed event on transfer out failure', async () => {
      mockTransferOut.mockResolvedValueOnce(
        Result.err(
          new ResponseError('FiatConnect API Error', { error: FiatConnectError.Unauthorized })
        )
      )
      await expectSaga(
        handleCreateFiatConnectTransfer,
        createFiatConnectTransfer({
          flow: CICOFlow.CashOut,
          fiatConnectQuote: transferOutFcQuote,
          fiatAccountId: 'account1',
        })
      )
        .provide([
          [select(tokensListSelector), Object.values(mockTokenBalances)],
          [select(feeEstimatesSelector), emptyFees],
          [call(getFiatConnectClient, providerId, providerBaseUrl, providerApiKey), mockFcClient],
        ])
        .put(
          createFiatConnectTransferFailed({
            flow: CICOFlow.CashOut,
            quoteId,
          })
        )
        .run()

      expect(mockTransferOut).toHaveBeenCalledWith({
        data: { fiatAccountId: 'account1', quoteId },
        idempotencyKey: 'mock-uuidv4',
      })
      expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(
        FiatExchangeEvents.cico_fc_transfer_api_error,
        {
          provider: providerId,
          flow: CICOFlow.CashOut,
          fiatConnectError: FiatConnectError.Unauthorized,
          error: 'FiatConnect API Error',
        }
      )
    })

    it('returns failed event on transaction failure', async () => {
      mockTransferOut.mockResolvedValueOnce(
        Result.ok({
          transferId: 'transfer1',
          transferStatus: TransferStatus.TransferReadyForUserToSendCryptoFunds,
          transferAddress: '0xabc',
        })
      )
      await expectSaga(
        handleCreateFiatConnectTransfer,
        createFiatConnectTransfer({
          flow: CICOFlow.CashOut,
          fiatConnectQuote: transferOutFcQuote,
          fiatAccountId: 'account1',
        })
      )
        .provide([
          [select(tokensListSelector), Object.values(mockTokenBalances)],
          [select(feeEstimatesSelector), emptyFees],
          [call(getFiatConnectClient, providerId, providerBaseUrl, providerApiKey), mockFcClient],
          [matches.call.fn(buildAndSendPayment), { error: new Error('tx error') }],
        ])
        .put(
          createFiatConnectTransferFailed({
            flow: CICOFlow.CashOut,
            quoteId,
          })
        )
        .run()

      expect(mockTransferOut).toHaveBeenCalledWith({
        data: { fiatAccountId: 'account1', quoteId },
        idempotencyKey: 'mock-uuidv4',
      })
      expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(
        FiatExchangeEvents.cico_fc_transfer_tx_error,
        {
          provider: providerId,
          flow: CICOFlow.CashOut,
          transferAddress: '0xabc',
          error: 'tx error',
        }
      )
    })
  })

  describe('_getSpecificQuote', () => {
    it('fetches and returns a quote if fiat account type and provider ID matches', async () => {
      await expectSaga(_getSpecificQuote, {
        digitalAsset: CiCoCurrency.CUSD,
        cryptoAmount: 2,
        flow: CICOFlow.CashOut,
        providerId: 'provider-two',
        fiatAccountType: FiatAccountType.BankAccount,
      })
        .provide([
          [
            call(_getQuotes, {
              flow: CICOFlow.CashOut,
              digitalAsset: CiCoCurrency.CUSD,
              cryptoAmount: 2,
              providerIds: ['provider-two'],
            }),
            [mockFiatConnectQuotes[1]],
          ],
        ])
        .returns(normalizeFiatConnectQuotes(CICOFlow.CashOut, [mockFiatConnectQuotes[1]])[0])
        .run()
    })
    it('throws if no quote with matching fiatAccountType is found', async () => {
      await expect(
        async () =>
          await expectSaga(_getSpecificQuote, {
            digitalAsset: CiCoCurrency.CUSD,
            cryptoAmount: 2,
            flow: CICOFlow.CashOut,
            providerId: 'provider-two',
            fiatAccountType: FiatAccountType.DuniaWallet,
          })
            .provide([
              [
                call(_getQuotes, {
                  flow: CICOFlow.CashOut,
                  digitalAsset: CiCoCurrency.CUSD,
                  cryptoAmount: 2,
                  providerIds: ['provider-two'],
                }),
                [mockFiatConnectQuotes[1]],
              ],
            ])
            .run()
      ).rejects.toThrow('Could not find quote')
    })
  })
})
