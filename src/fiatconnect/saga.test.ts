import { Result } from '@badrap/result'
import { FiatAccountType, TransferStatus } from '@fiatconnect/fiatconnect-types'
import { expectSaga } from 'redux-saga-test-plan'
import * as matches from 'redux-saga-test-plan/matchers'
import { call, select } from 'redux-saga/effects'
import {
  fiatConnectCashInEnabledSelector,
  fiatConnectCashOutEnabledSelector,
} from 'src/app/selectors'
import { feeEstimatesSelector } from 'src/fees/selectors'
import { fetchQuotes, FiatConnectQuoteSuccess } from 'src/fiatconnect'
import { getFiatConnectClient } from 'src/fiatconnect/clients'
import {
  handleCreateFiatConnectTransfer,
  handleFetchFiatConnectQuotes,
  handleFetchQuoteAndFiatAccount,
} from 'src/fiatconnect/saga'
import { fiatConnectQuotesSelector } from 'src/fiatconnect/selectors'
import {
  createFiatConnectTransfer,
  createFiatConnectTransferCompleted,
  createFiatConnectTransferFailed,
  fetchFiatConnectQuotes,
  fetchFiatConnectQuotesCompleted,
  fetchFiatConnectQuotesFailed,
  fetchQuoteAndFiatAccount,
  fetchQuoteAndFiatAccountCompleted,
  fetchQuoteAndFiatAccountFailed,
  fiatAccountRemove,
} from 'src/fiatconnect/slice'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import { buildAndSendPayment } from 'src/send/saga'
import { tokensListSelector } from 'src/tokens/selectors'
import { CiCoCurrency } from 'src/utils/currencies'
import { currentAccountSelector } from 'src/web3/selectors'
import { emptyFees, mockFiatConnectQuotes, mockTokenBalances } from 'test/values'
import { mocked } from 'ts-jest/utils'
import { v4 as uuidv4 } from 'uuid'

jest.mock('src/fiatconnect')
jest.mock('uuid')

jest.mock('src/fiatconnect/clients', () => ({
  getFiatConnectClient: jest.fn(() => ({
    getFiatAccounts: jest.fn(() => ({
      value: {
        BankAccount: [
          {
            fiatAccountId: '123',
            fiatAccountType: 'BankAccount',
            accountName: '(...1234)',
            institutionName: 'My Bank',
          },
        ],
      },
    })),
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
          providerIds: ['foo'],
        })
      )
        .provide([
          [select(userLocationDataSelector), { countryCodeAlpha2: 'MX' }],
          [select(currentAccountSelector), '0xabc'],
          [select(getLocalCurrencyCode), 'USD'],
          [select(fiatConnectCashInEnabledSelector), false],
          [select(fiatConnectCashOutEnabledSelector), true],
        ])
        .put(fetchFiatConnectQuotesCompleted({ quotes: mockFiatConnectQuotes }))
        .run()

      expect(fetchQuotes).toHaveBeenCalledWith({
        account: '0xabc',
        country: 'MX',
        cryptoAmount: 3,
        digitalAsset: 'CELO',
        fiatConnectCashInEnabled: false,
        fiatConnectCashOutEnabled: true,
        flow: CICOFlow.CashIn,
        localCurrency: 'USD',
        providerList: ['foo'],
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
          [select(currentAccountSelector), '0xabc'],
          [select(getLocalCurrencyCode), 'USD'],
          [select(fiatConnectCashInEnabledSelector), false],
          [select(fiatConnectCashOutEnabledSelector), true],
        ])
        .put(fetchFiatConnectQuotesFailed({ error: 'Could not fetch providers' }))
        .run()

      expect(fetchQuotes).toHaveBeenCalledWith({
        account: '0xabc',
        country: 'MX',
        cryptoAmount: 3,
        digitalAsset: 'CELO',
        fiatConnectCashInEnabled: false,
        fiatConnectCashOutEnabled: true,
        flow: CICOFlow.CashIn,
        localCurrency: 'USD',
      })
    })
  })

  describe(handleFetchQuoteAndFiatAccount, () => {
    it('fails when the quote has errors', async () => {
      await expectSaga(
        handleFetchQuoteAndFiatAccount,
        fetchQuoteAndFiatAccount({
          flow: CICOFlow.CashIn,
          digitalAsset: CiCoCurrency.CELO,
          cryptoAmount: 3,
          providerId: 'test-provider',
          fiatAccountId: '123',
          fiatAccountType: FiatAccountType.BankAccount,
        })
      )
        .put(
          fetchFiatConnectQuotes({
            flow: CICOFlow.CashIn,
            digitalAsset: CiCoCurrency.CELO,
            cryptoAmount: 3,
            providerIds: ['test-provider'],
          })
        )
        .provide([[select(fiatConnectQuotesSelector), [mockFiatConnectQuotes[0]]]])
        .put(
          fetchQuoteAndFiatAccountFailed({
            error: 'handleFetchQuoteAndFiatAccount failed. Quote has errors: FiatAmountTooHigh',
          })
        )
        .run()
    })
    it('fails when the specified fiatAccountId is not found and removes the account from state', async () => {
      mocked(getFiatConnectClient).mockResolvedValueOnce({
        // @ts-ignore
        getFiatAccounts: jest.fn(() =>
          Result.ok({
            BankAccount: [
              {
                fiatAccountId: '023498240',
                fiatAccountType: 'BankAccount',
                accountName: '(...1234)',
                institutionName: 'My Bank',
              },
            ],
          })
        ),
      })
      await expectSaga(
        handleFetchQuoteAndFiatAccount,
        fetchQuoteAndFiatAccount({
          flow: CICOFlow.CashIn,
          digitalAsset: CiCoCurrency.CELO,
          cryptoAmount: 3,
          providerId: 'test-provider',
          fiatAccountId: '123',
          fiatAccountType: FiatAccountType.BankAccount,
        })
      )
        .put(
          fetchFiatConnectQuotes({
            flow: CICOFlow.CashIn,
            digitalAsset: CiCoCurrency.CELO,
            cryptoAmount: 3,
            providerIds: ['test-provider'],
          })
        )
        .provide([[select(fiatConnectQuotesSelector), [mockFiatConnectQuotes[1]]]])
        .put(
          fiatAccountRemove({
            providerId: 'test-provider',
            fiatAccountId: '123',
            fiatAccountType: FiatAccountType.BankAccount,
          })
        )
        .put(
          fetchQuoteAndFiatAccountFailed({
            error:
              'handleFetchQuoteAndFiatAccount failed. Error: FiatAccount not found. fiatAccountId: 123, providerId: test-provider',
          })
        )
        .run()
    })
    it('fails when the specified fiatAccountId is not supported by the quote', async () => {
      await expectSaga(
        handleFetchQuoteAndFiatAccount,
        fetchQuoteAndFiatAccount({
          flow: CICOFlow.CashIn,
          digitalAsset: CiCoCurrency.CELO,
          cryptoAmount: 3,
          providerId: 'test-provider',
          fiatAccountId: '123',
          fiatAccountType: FiatAccountType.DuniaWallet,
        })
      )
        .put(
          fetchFiatConnectQuotes({
            flow: CICOFlow.CashIn,
            digitalAsset: CiCoCurrency.CELO,
            cryptoAmount: 3,
            providerIds: ['test-provider'],
          })
        )
        .provide([[select(fiatConnectQuotesSelector), [mockFiatConnectQuotes[1]]]])
        .put(
          fetchQuoteAndFiatAccountFailed({
            error:
              'handleFetchQuoteAndFiatAccount failed. Provider test-provider no longer supports the fiatAccountType DuniaWallet',
          })
        )
        .run()
    })
    it('saves the fiatAccount to state when all calls are successful', async () => {
      await expectSaga(
        handleFetchQuoteAndFiatAccount,
        fetchQuoteAndFiatAccount({
          flow: CICOFlow.CashIn,
          digitalAsset: CiCoCurrency.CELO,
          cryptoAmount: 3,
          providerId: 'test-provider',
          fiatAccountId: '123',
          fiatAccountType: FiatAccountType.BankAccount,
        })
      )
        .put(
          fetchFiatConnectQuotes({
            flow: CICOFlow.CashIn,
            digitalAsset: CiCoCurrency.CELO,
            cryptoAmount: 3,
            providerIds: ['test-provider'],
          })
        )
        .provide([[select(fiatConnectQuotesSelector), [mockFiatConnectQuotes[1]]]])
        .put(
          fetchQuoteAndFiatAccountCompleted({
            fiatAccount: {
              fiatAccountId: '123',
              fiatAccountType: FiatAccountType.BankAccount,
              accountName: '(...1234)',
              institutionName: 'My Bank',
            },
          })
        )
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
    })

    it('returns failed event on transfer out failure', async () => {
      mockTransferOut.mockResolvedValueOnce(Result.err(new Error('transfer error')))
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
          [matches.call.fn(buildAndSendPayment), { error: 'tx error' }],
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
    })
  })
})
