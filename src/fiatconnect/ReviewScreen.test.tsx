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
import { createFiatConnectTransfer, fiatAccountUsed } from 'src/fiatconnect/slice'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockFiatConnectQuotes } from 'test/values'

function getProps(flow: CICOFlow, withFee = false, cryptoType = CryptoType.cUSD) {
  const quoteData = _.cloneDeep(mockFiatConnectQuotes[1]) as FiatConnectQuoteSuccess
  if (!withFee) {
    delete quoteData.fiatAccount.BankAccount?.fee
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
  })
}

describe('ReviewScreen', () => {
  const store = createMockStore()

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
      expect(queryByText('fiatConnectReviewScreen.paymentMethod')).toBeTruthy()
      expect(queryByTestId('paymentMethod-text')?.children).toEqual(['Chase (...2345)'])
      expect(queryByTestId('paymentMethod-via')?.children).toEqual([
        'fiatConnectReviewScreen.paymentMethodVia, {"providerName":"Provider Two"}',
      ])
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
      expect(queryByText('fiatConnectReviewScreen.paymentMethod')).toBeTruthy()
      expect(queryByTestId('paymentMethod-text')?.children).toEqual(['Chase (...2345)'])
      expect(queryByTestId('paymentMethod-via')?.children).toEqual([
        'fiatConnectReviewScreen.paymentMethodVia, {"providerName":"Provider Two"}',
      ])
    })

    it('dispatches fiat transfer action, fiatAccountUsed action, and navigates on clicking button', async () => {
      const mockProps = getProps(CICOFlow.CashOut)

      const { getByTestId } = render(
        <Provider store={store}>
          <FiatConnectReviewScreen {...mockProps} />
        </Provider>
      )

      await fireEvent.press(getByTestId('submitButton'))

      expect(store.getActions()).toEqual([
        createFiatConnectTransfer({
          flow: CICOFlow.CashOut,
          fiatConnectQuote: mockProps.route.params.normalizedQuote,
          fiatAccountId: '123',
        }),
        fiatAccountUsed({
          providerId: 'provider-two',
          fiatAccountId: '123',
          accountName: 'Chase (...2345)',
          institutionName: 'Chase',
          fiatAccountType: FiatAccountType.BankAccount,
          supportedFlows: [CICOFlow.CashOut],
        }),
      ])
      expect(navigate).toHaveBeenCalledWith(Screens.FiatConnectTransferStatus, {
        flow: CICOFlow.CashOut,
        normalizedQuote: mockProps.route.params.normalizedQuote,
        fiatAccount: mockProps.route.params.fiatAccount,
      })
    })
  })
})
