import { CryptoType, FiatAccountSchema, FiatAccountType } from '@fiatconnect/fiatconnect-types'
import { fireEvent, render } from '@testing-library/react-native'
import _ from 'lodash'
import * as React from 'react'
import { Provider } from 'react-redux'
import { FiatConnectQuoteSuccess } from 'src/fiatconnect'
import FiatConnectReviewScreen from 'src/fiatconnect/ReviewScreen'
import { createFiatConnectTransfer, FiatAccount, refetchQuote } from 'src/fiatconnect/slice'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { Currency } from 'src/utils/currencies'
import { createMockStore, getMockStackScreenProps, sleep } from 'test/utils'
import { mockFiatConnectQuotes } from 'test/values'

const MVP_SUPPORTED_COUNTRIES: Partial<Record<FiatAccountSchema, Array<string>>> = {
  [FiatAccountSchema.AccountNumber]: [
    'GH', //Ghana
    'IN', //India
    'KE', //Kenya
    'NG', //Nigeria
    'PH', //Philippines
  ],
  [FiatAccountSchema.MobileMoney]: [
    'BF', //Burkina Faso
    'BJ', //Benin
    'CI', //Cote D'ivoire
    'GH', //Ghana
    'GM', //Gambia
    'GN', //Guinea
    'KE', //Kenya
    'ML', //Mali
    'SL', //Sierra Leone
    'SN', //Senegal
    'TG', //Togo
    'TZ', //Tanzania
    'UG', //Uganda
    'ZM', //Zambia
  ],
}

function getProps(
  flow: CICOFlow,
  withFee = false,
  cryptoType = CryptoType.cUSD,
  shouldRefetchQuote = false,
  quoteExpireMs = 0
) {
  const quoteData = _.cloneDeep(mockFiatConnectQuotes[1]) as FiatConnectQuoteSuccess
  if (!withFee) {
    delete quoteData.quote.fee
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
  const fiatAccount: FiatAccount = {
    fiatAccountId: '123',
    accountName: 'Chase (...2345)',
    institutionName: 'Chase',
    fiatAccountType: FiatAccountType.BankAccount,
    fiatAccountSchema: FiatAccountSchema.AccountNumber,
    providerId: normalizedQuote.getProviderId(),
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
    it('shows fiat amount, transaction details and payment method', () => {
      const { queryByTestId, queryByText } = render(
        <Provider store={store}>
          <FiatConnectReviewScreen {...getProps(CICOFlow.CashIn, true, CryptoType.cEUR)} />
        </Provider>
      )

      expect(queryByText('fiatConnectReviewScreen.bankFeeDisclaimer')).toBeFalsy()
      expect(queryByTestId('receive-amount')?.children).toEqual(['', '100.00', ' cEUR'])
      expect(queryByText('fiatConnectReviewScreen.transactionDetails')).toBeTruthy()
      expect(queryByText('fiatConnectReviewScreen.cashIn.transactionDetailsAmount')).toBeTruthy()
      expect(queryByTestId('txDetails-total/value')?.children).toEqual(['', '$', '100.00'])
      expect(queryByTestId('txDetails-converted/value')?.children).toEqual(['', '$', '98.94'])
      expect(queryByTestId('txDetails-fee/value')?.children).toEqual(['', '$', '1.06'])
      expect(queryByTestId('txDetails-exchangeRate/value')?.children).toEqual(['', '$', '0.9894'])
      expect(queryByTestId('txDetails-receive')?.children).toEqual(['', '100.00', ' cEUR'])
      expect(queryByText('fiatConnectReviewScreen.cashIn.paymentMethodHeader')).toBeTruthy()
      expect(queryByTestId('paymentMethod-text')?.children).toEqual(['Chase (...2345)'])
      expect(queryByTestId('paymentMethod-via')?.children).toEqual([
        'fiatConnectReviewScreen.paymentMethodVia, {"providerName":"Provider Two"}',
      ])
    })
    it('shows fee disclaimer when quote currency does not match user locale currency', () => {
      const mockProps = getProps(CICOFlow.CashIn)
      const countryStore = createMockStore({
        networkInfo: {
          connected: true,
          rehydrated: true,
          userLocationData: {
            countryCodeAlpha2: 'NG',
            region: null,
            ipAddress: null,
          },
        },
      })
      const { queryByText } = render(
        <Provider store={countryStore}>
          <FiatConnectReviewScreen {...mockProps} />
        </Provider>
      )

      expect(queryByText('fiatConnectReviewScreen.bankFeeDisclaimer')).toBeTruthy()
    })
  })

  describe('cashOut', () => {
    it('shows fiat amount, transaction details and payment method', () => {
      const { queryByTestId, queryByText } = render(
        <Provider store={store}>
          <FiatConnectReviewScreen {...getProps(CICOFlow.CashOut, true, CryptoType.cEUR)} />
        </Provider>
      )

      expect(queryByText('fiatConnectReviewScreen.bankFeeDisclaimer')).toBeFalsy()
      expect(queryByTestId('receive-amount/value')?.children).toEqual(['', '$', '100.00'])
      expect(queryByText('fiatConnectReviewScreen.transactionDetails')).toBeTruthy()
      expect(queryByText('fiatConnectReviewScreen.cashOut.transactionDetailsAmount')).toBeTruthy()
      expect(queryByTestId('txDetails-total')?.children).toEqual(['', '100.00', ' cEUR'])
      expect(queryByTestId('txDetails-converted')?.children).toEqual(['', '99.47', ' cEUR'])
      expect(queryByTestId('txDetails-fee')?.children).toEqual(['', '0.53', ' cEUR'])
      expect(queryByTestId('txDetails-exchangeRate/value')?.children).toEqual(['', '$', '1.0053'])
      expect(queryByTestId('txDetails-receive/value')?.children).toEqual(['', '$', '100.00'])
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
          cryptoType: props.route.params.normalizedQuote.getCryptoType(),
          cryptoAmount: props.route.params.normalizedQuote.getCryptoAmount(),
          fiatAmount: props.route.params.normalizedQuote.getFiatAmount(),
          providerId: props.route.params.normalizedQuote.getProviderId(),
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
          cryptoType: props.route.params.normalizedQuote.getCryptoType(),
          cryptoAmount: props.route.params.normalizedQuote.getCryptoAmount(),
          fiatAmount: props.route.params.normalizedQuote.getFiatAmount(),
          providerId: props.route.params.normalizedQuote.getProviderId(),
          fiatAccount: props.route.params.fiatAccount,
        })
      )
      expect(queryByTestId('TryAgain')).toBeTruthy()
      await fireEvent.press(getByTestId('TryAgain'))
      expect(store.dispatch).toHaveBeenCalledWith(
        refetchQuote({
          flow: CICOFlow.CashOut,
          cryptoType: props.route.params.normalizedQuote.getCryptoType(),
          cryptoAmount: props.route.params.normalizedQuote.getCryptoAmount(),
          fiatAmount: props.route.params.normalizedQuote.getFiatAmount(),
          providerId: props.route.params.normalizedQuote.getProviderId(),
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

      expect(queryByTestId('receive-amount/value')?.children).toEqual(['', '$', '100.00'])
      expect(queryByText('fiatConnectReviewScreen.transactionDetails')).toBeTruthy()
      expect(queryByText('fiatConnectReviewScreen.cashOut.transactionDetailsAmount')).toBeTruthy()
      expect(queryByTestId('txDetails-total')?.children).toEqual(['', '100.00', ' cUSD'])
      expect(queryByTestId('txDetails-converted')?.children).toEqual(['', '100.00', ' cUSD'])
      expect(queryByTestId('txDetails-fee')).toBeFalsy()
      expect(queryByTestId('txDetails-exchangeRate/value')?.children).toEqual(['', '$', '1'])
      expect(queryByTestId('txDetails-receive/value')?.children).toEqual(['', '$', '100.00'])
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
          cryptoType: props.route.params.normalizedQuote.getCryptoType(),
          cryptoAmount: props.route.params.normalizedQuote.getCryptoAmount(),
          fiatAmount: props.route.params.normalizedQuote.getFiatAmount(),
          providerId: props.route.params.normalizedQuote.getProviderId(),
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
    describe.each([
      [
        FiatAccountType.BankAccount,
        FiatAccountSchema.AccountNumber,
        'fiatConnectReviewScreen.bankFeeDisclaimer',
      ],
      [
        FiatAccountType.MobileMoney,
        FiatAccountSchema.MobileMoney,
        'fiatConnectReviewScreen.mobileMoneyFeeDisclaimer',
      ],
    ])('Fee Disclaimer for %s', (accountType, schema, disclaimer) => {
      const mvpCountriesForSchema = MVP_SUPPORTED_COUNTRIES[schema]!
      const mockProps = getProps(CICOFlow.CashOut)
      mockProps.route.params.fiatAccount.fiatAccountType = accountType
      it.each(mvpCountriesForSchema)(
        'shows when user locale is %s and quote currency does not match locale currency',
        (countryCode) => {
          const countryStore = createMockStore({
            networkInfo: {
              connected: true,
              rehydrated: true,
              userLocationData: {
                countryCodeAlpha2: countryCode,
                region: null,
                ipAddress: null,
              },
            },
          })
          const { queryByText } = render(
            <Provider store={countryStore}>
              <FiatConnectReviewScreen {...mockProps} />
            </Provider>
          )

          expect(queryByText(disclaimer)).toBeTruthy()
        }
      )
    })
  })
})
