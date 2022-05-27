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

function getProps(flow: CICOFlow, fee?: string, image?: string) {
  return getMockStackScreenProps(Screens.FiatConnectReview, {
    flow,
    cicoQuote: {
      quote: {
        fiatAmount: '20',
        fiatType: FiatType.USD,
        cryptoAmount: '25.02345',
        cryptoType: CryptoType.cUSD,
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
    fiatAccountLogo: image,
  })
}

describe('ReviewScreen', () => {
  const store = createMockStore()

  describe('cashIn', () => {
    it('shows crypto amount, transaction details and payment method', () => {
      const { queryByTestId, queryByText } = render(
        <Provider store={store}>
          <FiatConnectReviewScreen {...getProps(CICOFlow.CashIn, '2.00', 'http://logo')} />
        </Provider>
      )

      expect(queryByTestId('amount-crypto')?.children).toEqual(['', '25.02', ' cUSD'])
      expect(queryByText('fiatConnectReviewScreen.transactionDetails')).toBeTruthy()
      expect(queryByText('fiatConnectReviewScreen.cashIn.transactionDetailsAmount')).toBeTruthy()
      expect(queryByTestId('txDetails-fiat/value')?.children).toEqual(['', '$', '20.00'])
      expect(queryByTestId('txDetails-crypto')?.children).toEqual(['', '25.02', ' cUSD'])
      expect(queryByTestId('txDetails-fee/value')).toBeTruthy()
      expect(queryByText('fiatConnectReviewScreen.paymentMethod')).toBeTruthy()
      expect(queryByTestId('paymentMethod-text')?.children).toEqual(['Chase (...2345)'])
      expect(queryByTestId('paymentMethod-via')?.children).toEqual([
        'fiatConnectReviewScreen.paymentMethodVia, {"providerName":"Provider1"}',
      ])
      expect(queryByTestId('paymentMethod-image')).toBeTruthy()
    })

    it('shows crypto amount, transaction details and payment method without fee and image', () => {
      const { queryByTestId, queryByText } = render(
        <Provider store={store}>
          <FiatConnectReviewScreen {...getProps(CICOFlow.CashIn)} />
        </Provider>
      )

      expect(queryByTestId('amount-crypto')?.children).toEqual(['', '25.02', ' cUSD'])
      expect(queryByText('fiatConnectReviewScreen.transactionDetails')).toBeTruthy()
      expect(queryByText('fiatConnectReviewScreen.cashIn.transactionDetailsAmount')).toBeTruthy()
      expect(queryByTestId('txDetails-fiat/value')?.children).toEqual(['', '$', '20.00'])
      expect(queryByTestId('txDetails-crypto')?.children).toEqual(['', '25.02', ' cUSD'])
      expect(queryByTestId('txDetails-fee/value')).toBeFalsy()
      expect(queryByText('fiatConnectReviewScreen.paymentMethod')).toBeTruthy()
      expect(queryByTestId('paymentMethod-text')?.children).toEqual(['Chase (...2345)'])
      expect(queryByTestId('paymentMethod-via')?.children).toEqual([
        'fiatConnectReviewScreen.paymentMethodVia, {"providerName":"Provider1"}',
      ])
      expect(queryByTestId('paymentMethod-image')).toBeFalsy()
    })
  })

  describe('cashOut', () => {
    it('shows fiat amount, transaction details and payment method', () => {
      const { queryByTestId, queryByText } = render(
        <Provider store={store}>
          <FiatConnectReviewScreen {...getProps(CICOFlow.CashOut, '2.00', 'http://logo')} />
        </Provider>
      )

      expect(queryByTestId('amount-fiat/value')?.children).toEqual(['', '$', '20.00'])
      expect(queryByText('fiatConnectReviewScreen.transactionDetails')).toBeTruthy()
      expect(queryByText('fiatConnectReviewScreen.cashOut.transactionDetailsAmount')).toBeTruthy()
      expect(queryByTestId('txDetails-fiat/value')?.children).toEqual(['', '$', '20.00'])
      expect(queryByTestId('txDetails-crypto')?.children).toEqual(['', '25.02', ' cUSD'])
      expect(queryByTestId('txDetails-fee/value')).toBeTruthy()
      expect(queryByText('fiatConnectReviewScreen.paymentMethod')).toBeTruthy()
      expect(queryByTestId('paymentMethod-text')?.children).toEqual(['Chase (...2345)'])
      expect(queryByTestId('paymentMethod-via')?.children).toEqual([
        'fiatConnectReviewScreen.paymentMethodVia, {"providerName":"Provider1"}',
      ])
      expect(queryByTestId('paymentMethod-image')).toBeTruthy()
    })

    it('shows fiat amount, transaction details and payment method without fee and image', () => {
      const { queryByTestId, queryByText } = render(
        <Provider store={store}>
          <FiatConnectReviewScreen {...getProps(CICOFlow.CashOut)} />
        </Provider>
      )

      expect(queryByTestId('amount-fiat/value')?.children).toEqual(['', '$', '20.00'])
      expect(queryByText('fiatConnectReviewScreen.transactionDetails')).toBeTruthy()
      expect(queryByText('fiatConnectReviewScreen.cashOut.transactionDetailsAmount')).toBeTruthy()
      expect(queryByTestId('txDetails-fiat/value')?.children).toEqual(['', '$', '20.00'])
      expect(queryByTestId('txDetails-crypto')?.children).toEqual(['', '25.02', ' cUSD'])
      expect(queryByTestId('txDetails-fee/value')).toBeFalsy()
      expect(queryByText('fiatConnectReviewScreen.paymentMethod')).toBeTruthy()
      expect(queryByTestId('paymentMethod-text')?.children).toEqual(['Chase (...2345)'])
      expect(queryByTestId('paymentMethod-via')?.children).toEqual([
        'fiatConnectReviewScreen.paymentMethodVia, {"providerName":"Provider1"}',
      ])
      expect(queryByTestId('paymentMethod-image')).toBeFalsy()
    })
  })
})
