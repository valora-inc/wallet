import { Result } from '@badrap/result'
import { ResponseError } from '@fiatconnect/fiatconnect-sdk'
import { FiatAccountType, FiatConnectError, TransferStatus } from '@fiatconnect/fiatconnect-types'
import { expectSaga } from 'redux-saga-test-plan'
import * as matches from 'redux-saga-test-plan/matchers'
import { call, select } from 'redux-saga/effects'
import { showError } from 'src/alert/actions'
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
  handleSelectFiatConnectQuote,
} from 'src/fiatconnect/saga'
import { fiatConnectProvidersSelector, fiatConnectQuotesSelector } from 'src/fiatconnect/selectors'
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
  selectFiatConnectQuote,
  selectFiatConnectQuoteCompleted,
} from 'src/fiatconnect/slice'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { CICOFlow } from 'src/fiatExchanges/utils'
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
  })),
}))

describe('Fiatconnect saga', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  describe('Handles fetching quotes', () => {
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

  describe(handleSelectFiatConnectQuote, () => {
    const mockGetFiatAccounts = jest.fn()
    const mockFcClient = {
      getFiatAccounts: mockGetFiatAccounts,
    }
    const normalizedQuote = new FiatConnectQuote({
      quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
      fiatAccountType: FiatAccountType.BankAccount,
      flow: CICOFlow.CashOut,
    })
    const provideDelay = ({ fn }: { fn: any }, next: any) => (fn.name === 'delayP' ? null : next())
    it('navigates to fiatDetails screen if the fiatAccount is not found', async () => {
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
          [call(getFiatConnectClient, 'provider-two', 'fakewebsite.valoraapp.com'), mockFcClient],
          { call: provideDelay },
        ])
        .put(selectFiatConnectQuoteCompleted())
        .run()
      expect(navigate).toHaveBeenCalledWith(Screens.FiatDetailsScreen, {
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
          [call(getFiatConnectClient, 'provider-two', 'fakewebsite.valoraapp.com'), mockFcClient],
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

        .put(showError(ErrorMessages.PROVIDER_FETCH_FAILED))
        .run()
    })
  })

  describe('handles fetching providers', () => {
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

  describe(handleAttemptReturnUserFlow, () => {
    const mockGetFiatAccounts = jest.fn()
    const mockFcClient = {
      getFiatAccounts: mockGetFiatAccounts,
    }
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
    it('navigates to SelectProvider when there is no quote', async () => {
      await expectSaga(handleAttemptReturnUserFlow, params)
        .provide([
          [select(fiatConnectProvidersSelector), mockFiatConnectProviderInfo],
          [select(fiatConnectQuotesSelector), []],
        ])
        .put(attemptReturnUserFlowCompleted())
        .run()
      expect(navigate).toHaveBeenCalledWith(Screens.SelectProvider, selectProviderParams)
    })
    it('navigates to SelectProvider when the quote cannot be normalized', async () => {
      await expectSaga(handleAttemptReturnUserFlow, params)
        .provide([
          [select(fiatConnectProvidersSelector), mockFiatConnectProviderInfo],
          [select(fiatConnectQuotesSelector), [mockFiatConnectQuotes[0]]],
        ])
        .put(attemptReturnUserFlowCompleted())
        .run()
      expect(navigate).toHaveBeenCalledWith(Screens.SelectProvider, selectProviderParams)
    })
    it('navigates to SelectProvider when the quote does not match the fiatAccountType', async () => {
      await expectSaga(handleAttemptReturnUserFlow, {
        payload: {
          ...params.payload,
          fiatAccountType: FiatAccountType.DuniaWallet,
        },
        type: params.type,
      })
        .provide([
          [select(fiatConnectProvidersSelector), mockFiatConnectProviderInfo],
          [select(fiatConnectQuotesSelector), [mockFiatConnectQuotes[1]]],
        ])
        .put(attemptReturnUserFlowCompleted())
        .run()
      expect(navigate).toHaveBeenCalledWith(Screens.SelectProvider, selectProviderParams)
    })
    it('navigates to SelectProvider when the provider cannot be found', async () => {
      await expectSaga(handleAttemptReturnUserFlow, params)
        .provide([
          [select(fiatConnectProvidersSelector), []],
          [select(fiatConnectQuotesSelector), [mockFiatConnectQuotes[1]]],
        ])
        .put(attemptReturnUserFlowCompleted())
        .run()
      expect(navigate).toHaveBeenCalledWith(Screens.SelectProvider, selectProviderParams)
    })
    it('navigates to SelectProvider when the fiatAccount cannot be found', async () => {
      mockGetFiatAccounts.mockResolvedValue(Result.ok({}))
      await expectSaga(handleAttemptReturnUserFlow, params)
        .provide([
          [select(fiatConnectProvidersSelector), mockFiatConnectProviderInfo],
          [select(fiatConnectQuotesSelector), [mockFiatConnectQuotes[1]]],
          [call(getFiatConnectClient, 'provider-two', 'fakewebsite.valoraapp.com'), mockFcClient],
        ])
        .put(attemptReturnUserFlowCompleted())
        .run()
      expect(navigate).toHaveBeenCalledWith(Screens.SelectProvider, selectProviderParams)
    })
    it('navigates to FiatConnectReview when everything is found and matches', async () => {
      const fiatAccount = {
        fiatAccountId: '123',
        providerId: 'provider-two',
        accountName: 'provider two',
        institutionName: 'The fun bank',
        FiatAccountType: FiatAccountType.BankAccount,
      }
      mockGetFiatAccounts.mockResolvedValue(
        Result.ok({
          BankAccount: [fiatAccount],
        })
      )
      await expectSaga(handleAttemptReturnUserFlow, params)
        .provide([
          [select(fiatConnectProvidersSelector), mockFiatConnectProviderInfo],
          [select(fiatConnectQuotesSelector), [mockFiatConnectQuotes[1]]],
          [call(getFiatConnectClient, 'provider-two', 'fakewebsite.valoraapp.com'), mockFcClient],
        ])
        .put(attemptReturnUserFlowCompleted())
        .run()
      expect(navigate).toHaveBeenCalledWith(Screens.FiatConnectReview, {
        flow: CICOFlow.CashOut,
        normalizedQuote: new FiatConnectQuote({
          flow: CICOFlow.CashOut,
          fiatAccountType: FiatAccountType.BankAccount,
          quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
        }),
        fiatAccount,
      })
    })
  })

  describe(fetchFiatAccountsSaga, () => {
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
                call(getFiatConnectClient, 'test-provider', 'www.hello.valoraapp.com'),
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
          [call(getFiatConnectClient, 'test-provider', 'www.hello.valoraapp.com'), mockFcClient],
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

  describe('handles fiat connect transfer', () => {
    const transferOutFcQuote = new FiatConnectQuote({
      flow: CICOFlow.CashOut,
      quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
      fiatAccountType: FiatAccountType.BankAccount,
    })

    const quoteId = transferOutFcQuote.getQuoteId()
    const providerId = transferOutFcQuote.getProviderId()
    const providerBaseUrl = transferOutFcQuote.getProviderBaseUrl()

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
          [call(getFiatConnectClient, providerId, providerBaseUrl), mockFcClient],
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
          [call(getFiatConnectClient, providerId, providerBaseUrl), mockFcClient],
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
          [call(getFiatConnectClient, providerId, providerBaseUrl), mockFcClient],
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
})
