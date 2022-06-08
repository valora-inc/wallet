import {
  CryptoType,
  FiatAccountSchema,
  FiatAccountType,
  FiatType,
} from '@fiatconnect/fiatconnect-types'
import { render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import FiatConnectReviewScreen from 'src/fiatconnect/ReviewScreen'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

function getProps(flow: CICOFlow, fee?: string, cryptoType = CryptoType.cUSD) {
  return getMockStackScreenProps(Screens.FiatConnectReview, {
    flow,
    cicoQuote: {
      quote: {
        fiatAmount: '20',
        fiatType: FiatType.USD,
        cryptoAmount: '22.05',
        cryptoType,
        quoteId: '1',
        guaranteedUntil: '2022-01-05',
      },
      kyc: { kycRequired: false, kycSchemas: [] },
      fiatAccount: {
        BankAccount: {
          fiatAccountSchemas: [],
          fee,
        },
      },
    },
    provider: {
      name: 'Provider1',
      logo: '',
      logoWide: '',
    },
    fiatAccount: {
      accountName: 'MyAccount',
      institutionName: 'Chase',
      accountNumber: '12345',
      country: 'US',
      fiatAccountType: FiatAccountType.BankAccount,
    },
    fiatAccountSchema: FiatAccountSchema.AccountNumber,
  })
}

describe('ReviewScreen', () => {
  const store = createMockStore()

  describe('cashIn', () => {
    it('throws not implemented', () => {
      expect(() => {
        render(
          <Provider store={store}>
            <FiatConnectReviewScreen {...getProps(CICOFlow.CashIn, '2.00')} />
          </Provider>
        )
      }).toThrowError('Not implemented')
    })
  })

  describe('cashOut', () => {
    it('shows fiat amount, transaction details and payment method', () => {
      const { queryByTestId, queryByText } = render(
        <Provider store={store}>
          <FiatConnectReviewScreen {...getProps(CICOFlow.CashOut, '2.00', CryptoType.cEUR)} />
        </Provider>
      )

      expect(queryByTestId('amount-fiat/value')?.children).toEqual(['', '$', '20.00'])
      expect(queryByText('fiatConnectReviewScreen.transactionDetails')).toBeTruthy()
      expect(queryByText('fiatConnectReviewScreen.cashOut.transactionDetailsAmount')).toBeTruthy()
      expect(queryByTestId('txDetails-total')?.children).toEqual(['', '22.05', ' cEUR'])
      expect(queryByTestId('txDetails-converted')?.children).toEqual(['', '20.05', ' cEUR'])
      expect(queryByTestId('txDetails-fee')).toBeTruthy()
      expect(queryByTestId('txDetails-exchangeRate/value')?.children).toEqual(['', '$', '0.9975'])
      expect(queryByTestId('txDetails-exchangeAmount/value')?.children).toEqual(['', '$', '20.00'])
      expect(queryByText('fiatConnectReviewScreen.paymentMethod')).toBeTruthy()
      expect(queryByTestId('paymentMethod-text')?.children).toEqual(['Chase (...2345)'])
      expect(queryByTestId('paymentMethod-via')?.children).toEqual([
        'fiatConnectReviewScreen.paymentMethodVia, {"providerName":"Provider1"}',
      ])
    })

    it('shows fiat amount, transaction details and payment method without fee', () => {
      const { queryByTestId, queryByText } = render(
        <Provider store={store}>
          <FiatConnectReviewScreen {...getProps(CICOFlow.CashOut)} />
        </Provider>
      )

      expect(queryByTestId('amount-fiat/value')?.children).toEqual(['', '$', '20.00'])
      expect(queryByText('fiatConnectReviewScreen.transactionDetails')).toBeTruthy()
      expect(queryByText('fiatConnectReviewScreen.cashOut.transactionDetailsAmount')).toBeTruthy()
      expect(queryByTestId('txDetails-total')?.children).toEqual(['', '22.05', ' cUSD'])
      expect(queryByTestId('txDetails-converted')?.children).toEqual(['', '22.05', ' cUSD'])
      expect(queryByTestId('txDetails-fee')).toBeFalsy()
      expect(queryByTestId('txDetails-exchangeRate/value')?.children).toEqual(['', '$', '0.907'])
      expect(queryByTestId('txDetails-exchangeAmount/value')?.children).toEqual(['', '$', '20.00'])
      expect(queryByText('fiatConnectReviewScreen.paymentMethod')).toBeTruthy()
      expect(queryByTestId('paymentMethod-text')?.children).toEqual(['Chase (...2345)'])
      expect(queryByTestId('paymentMethod-via')?.children).toEqual([
        'fiatConnectReviewScreen.paymentMethodVia, {"providerName":"Provider1"}',
      ])
    })
  })
})
