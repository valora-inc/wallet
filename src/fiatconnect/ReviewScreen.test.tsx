import {
  CryptoType,
  FiatAccountType,
  ObfuscatedFiatAccountData,
} from '@fiatconnect/fiatconnect-types'
import { fireEvent, render } from '@testing-library/react-native'
import _ from 'lodash'
import * as React from 'react'
import { Provider } from 'react-redux'
import { FiatConnectQuoteSuccess } from 'src/fiatconnect'
import FiatConnectReviewScreen from 'src/fiatconnect/ReviewScreen'
import { createFiatConnectTransfer, refetchQuote } from 'src/fiatconnect/slice'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { Currency } from 'src/utils/currencies'
import { createMockStore, getMockStackScreenProps, sleep } from 'test/utils'
import { mockFiatConnectQuotes } from 'test/values'

function getProps(
  flow: CICOFlow,
  withFee = false,
  cryptoType = CryptoType.cUSD,
  shouldRefetchQuote = false,
  quoteExpireMs = 0
) {
  const quoteData = _.cloneDeep(mockFiatConnectQuotes[1]) as FiatConnectQuoteSuccess
  if (!withFee) {
    delete quoteData.fiatAccount.BankAccount?.fee
  }
  if (quoteExpireMs) {
    quoteData.quote.guaranteedUntil = new Date(Date.now() + quoteExpireMs).toISOString()
  }
  quoteData.quote.cryptoType = cryptoType
  const normalizedQuote = new FiatConnectQuote({
    quote: quoteData,
    fiatAccountType: FiatAccountType.BankAccount,
    flow: CICOFlow.CashOut,
  })
  const fiatAccount: ObfuscatedFiatAccountData = {
    fiatAccountId: '123',
    accountName: 'Chase (...2345)',
    institutionName: 'Chase',
    fiatAccountType: FiatAccountType.BankAccount,
  }

  return getMockStackScreenProps(Screens.FiatConnectReview, {
    flow,
    normalizedQuote,
    fiatAccount,
    shouldRefetchQuote,
  })
}

describe('ReviewScreen', () => {
  const store = createMockStore()
  beforeEach(() => {
    store.dispatch = jest.fn()
  })
  describe('cashIn', () => {
    it('throws not implemented', () => {
      expect(() => {
        render(
          <Provider store={store}>
            <FiatConnectReviewScreen {...getProps(CICOFlow.CashIn, true)} />
          </Provider>
        )
      }).toThrowError('Not implemented')
    })
  })

  describe('cashOut', () => {
    it('shows fiat amount, transaction details and payment method', () => {
      const { queryByTestId, queryByText } = render(
        <Provider store={store}>
          <FiatConnectReviewScreen {...getProps(CICOFlow.CashOut, true, CryptoType.cEUR)} />
        </Provider>
      )

      expect(queryByTestId('amount-fiat/value')?.children).toEqual(['', '$', '100.00'])
      expect(queryByText('fiatConnectReviewScreen.transactionDetails')).toBeTruthy()
      expect(queryByText('fiatConnectReviewScreen.cashOut.transactionDetailsAmount')).toBeTruthy()
      expect(queryByTestId('txDetails-total')?.children).toEqual(['', '100.00', ' cEUR'])
      expect(queryByTestId('txDetails-converted')?.children).toEqual(['', '99.47', ' cEUR'])
      expect(queryByTestId('txDetails-fee')).toBeTruthy()
      expect(queryByTestId('txDetails-exchangeRate/value')?.children).toEqual(['', '$', '1.0053'])
      expect(queryByTestId('txDetails-exchangeAmount/value')?.children).toEqual(['', '$', '100.00'])
      expect(queryByText('fiatConnectReviewScreen.cashOut.paymentMethodHeader')).toBeTruthy()
      expect(queryByTestId('paymentMethod-text')?.children).toEqual(['Chase (...2345)'])
      expect(queryByTestId('paymentMethod-via')?.children).toEqual([
        'fiatConnectReviewScreen.paymentMethodVia, {"providerName":"Provider Two"}',
      ])
    })
    it('dispatches refetchQuote when shouldRefetchQuote is true', () => {
      const props = getProps(CICOFlow.CashOut, true, CryptoType.cEUR, true)
      render(
        <Provider store={store}>
          <FiatConnectReviewScreen {...props} />
        </Provider>
      )
      expect(store.dispatch).toHaveBeenCalledWith(
        refetchQuote({
          flow: CICOFlow.CashOut,
          quote: props.route.params.normalizedQuote,
          fiatAccount: props.route.params.fiatAccount,
        })
      )
    })
    it('shows an error page when fiatConnectQuotesError is truthy, try again button dispatches refetchQuote', async () => {
      const props = getProps(CICOFlow.CashOut, true, CryptoType.cEUR, false)
      const store = createMockStore({
        fiatConnect: {
          quotesError: 'error',
        },
      })
      store.dispatch = jest.fn()
      const { queryByTestId, getByTestId } = render(
        <Provider store={store}>
          <FiatConnectReviewScreen {...props} />
        </Provider>
      )
      expect(store.dispatch).not.toHaveBeenCalledWith(
        refetchQuote({
          flow: CICOFlow.CashOut,
          quote: props.route.params.normalizedQuote,
          fiatAccount: props.route.params.fiatAccount,
        })
      )
      expect(queryByTestId('TryAgain')).toBeTruthy()
      await fireEvent.press(getByTestId('TryAgain'))
      expect(store.dispatch).toHaveBeenCalledWith(
        refetchQuote({
          flow: CICOFlow.CashOut,
          quote: props.route.params.normalizedQuote,
          fiatAccount: props.route.params.fiatAccount,
        })
      )
    })

    it('shows fiat amount, transaction details and payment method without fee', () => {
      const { queryByTestId, queryByText } = render(
        <Provider store={store}>
          <FiatConnectReviewScreen {...getProps(CICOFlow.CashOut)} />
        </Provider>
      )

      expect(queryByTestId('amount-fiat/value')?.children).toEqual(['', '$', '100.00'])
      expect(queryByText('fiatConnectReviewScreen.transactionDetails')).toBeTruthy()
      expect(queryByText('fiatConnectReviewScreen.cashOut.transactionDetailsAmount')).toBeTruthy()
      expect(queryByTestId('txDetails-total')?.children).toEqual(['', '100.00', ' cUSD'])
      expect(queryByTestId('txDetails-converted')?.children).toEqual(['', '100.00', ' cUSD'])
      expect(queryByTestId('txDetails-fee')).toBeFalsy()
      expect(queryByTestId('txDetails-exchangeRate/value')?.children).toEqual(['', '$', '1'])
      expect(queryByTestId('txDetails-exchangeAmount/value')?.children).toEqual(['', '$', '100.00'])
      expect(queryByText('fiatConnectReviewScreen.cashOut.paymentMethodHeader')).toBeTruthy()
      expect(queryByTestId('paymentMethod-text')?.children).toEqual(['Chase (...2345)'])
      expect(queryByTestId('paymentMethod-via')?.children).toEqual([
        'fiatConnectReviewScreen.paymentMethodVia, {"providerName":"Provider Two"}',
      ])
    })

    it('shows expired dialog when quote is expired', async () => {
      const expireMs = -100
      const props = getProps(CICOFlow.CashOut, false, CryptoType.cUSD, false, expireMs)
      const quote = _.cloneDeep(mockFiatConnectQuotes[1]) as FiatConnectQuoteSuccess
      quote.quote.guaranteedUntil = new Date(Date.now() + expireMs).toISOString()
      const store = createMockStore({
        fiatConnect: {
          quotes: [quote],
        },
      })
      store.dispatch = jest.fn()
      const { getByTestId, queryByTestId } = render(
        <Provider store={store}>
          <FiatConnectReviewScreen {...props} />
        </Provider>
      )

      expect(queryByTestId('expiredQuoteDialog')?.props.visible).toEqual(true)

      await fireEvent.press(getByTestId('expiredQuoteDialog/PrimaryAction'))

      expect(store.dispatch).toHaveBeenCalledWith(
        refetchQuote({
          flow: CICOFlow.CashOut,
          quote: props.route.params.normalizedQuote,
          fiatAccount: props.route.params.fiatAccount,
        })
      )
    })
    it('shows expired dialog when submitting expired quote', async () => {
      jest.useRealTimers()
      const expireMs = 100
      const mockProps = getProps(CICOFlow.CashOut, false, CryptoType.cUSD, false, expireMs)
      const { getByTestId, queryByTestId } = render(
        <Provider store={store}>
          <FiatConnectReviewScreen {...mockProps} />
        </Provider>
      )

      expect(queryByTestId('expiredQuoteDialog')?.props.visible).toEqual(false)
      await sleep(expireMs)
      await fireEvent.press(getByTestId('submitButton'))

      expect(store.dispatch).not.toHaveBeenCalled()
      expect(queryByTestId('expiredQuoteDialog')?.props.visible).toEqual(true)
    })
    it('dispatches fiat transfer action and navigates on clicking button', async () => {
      const mockProps = getProps(CICOFlow.CashOut)

      const { getByTestId } = render(
        <Provider store={store}>
          <FiatConnectReviewScreen {...mockProps} />
        </Provider>
      )

      await fireEvent.press(getByTestId('submitButton'))

      expect(store.dispatch).toHaveBeenCalledWith(
        createFiatConnectTransfer({
          flow: CICOFlow.CashOut,
          fiatConnectQuote: mockProps.route.params.normalizedQuote,
          fiatAccountId: '123',
        })
      )
      expect(navigate).toHaveBeenCalledWith(Screens.FiatConnectTransferStatus, {
        flow: CICOFlow.CashOut,
        normalizedQuote: mockProps.route.params.normalizedQuote,
        fiatAccount: mockProps.route.params.fiatAccount,
      })
    })
    it('navigates back to select providers screen when the provider is pressed', async () => {
      const mockProps = getProps(CICOFlow.CashOut)

      const { getByTestId } = render(
        <Provider store={store}>
          <FiatConnectReviewScreen {...mockProps} />
        </Provider>
      )

      await fireEvent.press(getByTestId('paymentMethod-text'))

      expect(navigate).toHaveBeenCalledWith(Screens.SelectProvider, {
        flow: CICOFlow.CashOut,
        selectedCrypto: Currency.Dollar,
        amount: {
          fiat: 100,
          crypto: 100,
        },
      })
    })
  })
})
