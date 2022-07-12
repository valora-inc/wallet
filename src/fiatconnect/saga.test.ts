import { FiatAccountType, TransferStatus } from '@fiatconnect/fiatconnect-types'
import { expectSaga } from 'redux-saga-test-plan'
import * as matches from 'redux-saga-test-plan/matchers'
import { select } from 'redux-saga/effects'
import {
  fiatConnectCashInEnabledSelector,
  fiatConnectCashOutEnabledSelector,
} from 'src/app/selectors'
import { feeEstimatesSelector } from 'src/fees/selectors'
import { doTransferOut, fetchQuotes, FiatConnectQuoteSuccess } from 'src/fiatconnect'
import { handleFetchFiatConnectQuotes, handleStartFiatConnectTransfer } from 'src/fiatconnect/saga'
import {
  fetchFiatConnectQuotes,
  fetchFiatConnectQuotesCompleted,
  fetchFiatConnectQuotesFailed,
  fiatConnectTransferFailed,
  fiatConnectTransferSuccess,
  startFiatConnectTransfer,
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

jest.mock('src/fiatconnect')

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

  describe('handles fiat connect transfer', () => {
    const transferOutFcQuote = new FiatConnectQuote({
      flow: CICOFlow.CashOut,
      quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
      fiatAccountType: FiatAccountType.BankAccount,
    })

    it('calls transfer out and sends payment to provider', async () => {
      mocked(doTransferOut).mockResolvedValueOnce({
        transferId: 'transfer1',
        transferStatus: TransferStatus.TransferReadyForUserToSendCryptoFunds,
        transferAddress: '0xabc',
      })
      await expectSaga(
        handleStartFiatConnectTransfer,
        startFiatConnectTransfer({
          flow: CICOFlow.CashOut,
          quoteId: transferOutFcQuote.getQuoteId(),
          fiatConnectQuote: transferOutFcQuote,
          fiatAccountId: 'account1',
        })
      )
        .provide([
          [select(tokensListSelector), Object.values(mockTokenBalances)],
          [select(feeEstimatesSelector), emptyFees],
          [matches.call.fn(buildAndSendPayment), { receipt: { transactionHash: '0x12345' } }],
        ])
        .put(
          fiatConnectTransferSuccess({
            flow: CICOFlow.CashOut,
            quoteId: transferOutFcQuote.getQuoteId(),
            txHash: '0x12345',
          })
        )
        .run()

      expect(doTransferOut).toHaveBeenCalledWith(transferOutFcQuote, 'account1')
    })

    it('returns failed event on transfer out failure', async () => {
      mocked(doTransferOut).mockRejectedValueOnce('transfer error')
      await expectSaga(
        handleStartFiatConnectTransfer,
        startFiatConnectTransfer({
          flow: CICOFlow.CashOut,
          quoteId: transferOutFcQuote.getQuoteId(),
          fiatConnectQuote: transferOutFcQuote,
          fiatAccountId: 'account1',
        })
      )
        .provide([
          [select(tokensListSelector), Object.values(mockTokenBalances)],
          [select(feeEstimatesSelector), emptyFees],
        ])
        .put(
          fiatConnectTransferFailed({
            flow: CICOFlow.CashOut,
            quoteId: transferOutFcQuote.getQuoteId(),
          })
        )
        .run()

      expect(doTransferOut).toHaveBeenCalledWith(transferOutFcQuote, 'account1')
    })

    it('returns failed event on transaction failure', async () => {
      mocked(doTransferOut).mockResolvedValueOnce({
        transferId: 'transfer1',
        transferStatus: TransferStatus.TransferReadyForUserToSendCryptoFunds,
        transferAddress: '0xabc',
      })
      await expectSaga(
        handleStartFiatConnectTransfer,
        startFiatConnectTransfer({
          flow: CICOFlow.CashOut,
          quoteId: transferOutFcQuote.getQuoteId(),
          fiatConnectQuote: transferOutFcQuote,
          fiatAccountId: 'account1',
        })
      )
        .provide([
          [select(tokensListSelector), Object.values(mockTokenBalances)],
          [select(feeEstimatesSelector), emptyFees],
          [matches.call.fn(buildAndSendPayment), { error: 'tx error' }],
        ])
        .put(
          fiatConnectTransferFailed({
            flow: CICOFlow.CashOut,
            quoteId: transferOutFcQuote.getQuoteId(),
          })
        )
        .run()

      expect(doTransferOut).toHaveBeenCalledWith(transferOutFcQuote, 'account1')
    })
  })
})
