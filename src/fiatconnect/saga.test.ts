import { FiatAccountType } from '@fiatconnect/fiatconnect-types'
import { expectSaga } from 'redux-saga-test-plan'
import { select } from 'redux-saga/effects'
import {
  fiatConnectCashInEnabledSelector,
  fiatConnectCashOutEnabledSelector,
} from 'src/app/selectors'
import { fetchQuotes } from 'src/fiatconnect'
import { handleFetchFiatConnectQuotes, handleFetchQuoteAndFiatAccount } from 'src/fiatconnect/saga'
import { fiatConnectQuotesSelector } from 'src/fiatconnect/selectors'
import {
  fetchFiatConnectQuotes,
  fetchFiatConnectQuotesCompleted,
  fetchFiatConnectQuotesFailed,
  fetchQuoteAndFiatAccount,
  fetchQuoteAndFiatAccountFailed,
} from 'src/fiatconnect/slice'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import { CiCoCurrency } from 'src/utils/currencies'
import { currentAccountSelector } from 'src/web3/selectors'
import { mockFiatConnectQuotes } from 'test/values'
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
    it('fails when fetching the fiatAccount has errors', async () => {
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
          fetchQuoteAndFiatAccountFailed({
            error: 'handleFetchQuoteAndFiatAccount failed. Quote has errors: FiatAmountTooHigh',
          })
        )
        .run()
    })
    it('fails when the specified fiatAccountId is not found and removes the account from state', async () => {})
    it('saves the fiatAccount to state when all calls are successful', () => {})
  })
})
