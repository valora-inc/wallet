import { CryptoType, FiatAccountSchema, FiatAccountType } from '@fiatconnect/fiatconnect-types'
import { fireEvent, render } from '@testing-library/react-native'
import _ from 'lodash'
import * as React from 'react'
import { Provider } from 'react-redux'
import { MockStoreEnhanced } from 'redux-mock-store'
import { FeeEstimateState } from 'src/fees/reducer'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { FiatConnectQuoteSuccess } from 'src/fiatconnect'
import FiatConnectReviewScreen from 'src/fiatconnect/ReviewScreen'
import { FiatAccount, createFiatConnectTransfer, refetchQuote } from 'src/fiatconnect/slice'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { getDefaultLocalCurrencyCode } from 'src/localCurrency/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { NetworkId } from 'src/transactions/types'
import { createMockStore, getMockStackScreenProps, sleep } from 'test/utils'
import {
  mockCeloAddress,
  mockCeloTokenId,
  mockCeurAddress,
  mockCeurTokenId,
  mockCusdAddress,
  mockCusdTokenId,
  mockFeeInfo,
  mockFiatConnectQuotes,
} from 'test/values'

jest.mock('src/web3/networkConfig', () => {
  const originalModule = jest.requireActual('src/web3/networkConfig')
  return {
    ...originalModule,
    __esModule: true,
    default: {
      ...originalModule.default,
      defaultNetworkId: 'celo-alfajores',
    },
  }
})
jest.mock('src/localCurrency/selectors', () => {
  const originalModule = jest.requireActual('src/localCurrency/selectors')

  return {
    ...originalModule,
    getDefaultLocalCurrencyCode: jest.fn(),
  }
})

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
    tokenId: cryptoType === CryptoType.cEUR ? mockCeurTokenId : mockCusdTokenId,
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

const defaultFeeEstimate = {
  usdFee: '0.02',
  lastUpdated: 500,
  loading: false,
  error: false,
  feeInfo: mockFeeInfo,
}

function getStore({ feeEstimate = defaultFeeEstimate }: { feeEstimate?: FeeEstimateState }) {
  return createMockStore({
    fees: {
      estimates: {
        [mockCusdAddress]: {
          send: feeEstimate,
          exchange: undefined,
          'register-dek': undefined,
          swap: undefined,
        },
        [mockCeurAddress]: {
          send: {
            usdFee: '0.03',
            lastUpdated: 500,
            loading: false,
            error: false,
            feeInfo: mockFeeInfo,
          },
          exchange: undefined,
          'register-dek': undefined,
          swap: undefined,
        },
      },
    },
    tokens: {
      tokenBalances: {
        [mockCusdTokenId]: {
          address: mockCusdAddress,
          tokenId: mockCusdTokenId,
          networkId: NetworkId['celo-alfajores'],
          symbol: 'cUSD',
          balance: '200',
          priceUsd: '1',
          isFeeCurrency: true,
          priceFetchedAt: Date.now(),
        },
        [mockCeurTokenId]: {
          address: mockCeurAddress,
          tokenId: mockCeurTokenId,
          networkId: NetworkId['celo-alfajores'],
          symbol: 'cEUR',
          balance: '100',
          priceUsd: '1.2',
          isFeeCurrency: true,
          priceFetchedAt: Date.now(),
        },
        [mockCeloTokenId]: {
          address: mockCeloAddress,
          tokenId: mockCeloTokenId,
          networkId: NetworkId['celo-alfajores'],
          symbol: 'CELO',
          balance: '200',
          priceUsd: '5',
          isFeeCurrency: true,
          priceFetchedAt: Date.now(),
        },
      },
    },
  })
}

describe('ReviewScreen', () => {
  let store: MockStoreEnhanced<{}>
  beforeEach(() => {
    store = getStore({})
    store.dispatch = jest.fn()
    jest.mocked(getDefaultLocalCurrencyCode).mockReturnValue(LocalCurrencyCode.USD)
  })
  describe('cashIn', () => {
    it('shows fiat amount, transaction details and payment method', () => {
      const { queryByTestId, queryByText } = render(
        <Provider store={store}>
          <FiatConnectReviewScreen {...getProps(CICOFlow.CashIn, true, CryptoType.cEUR)} />
        </Provider>
      )

      expect(queryByText('fiatConnectReviewScreen.bankFeeDisclaimer')).toBeFalsy()
      expect(queryByTestId('receive-amount')?.children).toEqual(['100.00', ' cEUR'])
      expect(queryByText('fiatConnectReviewScreen.transactionDetails')).toBeTruthy()
      expect(queryByText('fiatConnectReviewScreen.cashIn.transactionDetailsAmount')).toBeTruthy()
      expect(queryByTestId('txDetails-total/value')?.children).toEqual(['$', '100.00'])
      expect(queryByTestId('txDetails-converted/value')?.children).toEqual(['$', '99.15'])
      expect(queryByTestId('txDetails-fee/value')?.children).toEqual(['$', '0.84'])
      expect(queryByTestId('txDetails-exchangeRate/value')?.children).toEqual(['$', '0.9915'])
      expect(queryByTestId('txDetails-receive')?.children).toEqual(['100.00', ' cEUR'])
      expect(queryByText('fiatConnectReviewScreen.cashIn.paymentMethodHeader')).toBeTruthy()
      expect(queryByTestId('paymentMethod-text')?.children).toEqual(['Chase (...2345)'])
      expect(queryByTestId('paymentMethod-via')?.children).toEqual([
        'fiatConnectReviewScreen.paymentMethodVia, {"providerName":"Provider Two"}',
      ])
    })
    it('enables the submit button even if feeInfo is not available', () => {
      const props = getProps(CICOFlow.CashIn, true, CryptoType.cUSD)
      store = getStore({
        feeEstimate: {
          usdFee: '0.02',
          lastUpdated: 500,
          loading: false,
          error: false,
          feeInfo: undefined,
        },
      })
      const { getByTestId } = render(
        <Provider store={store}>
          <FiatConnectReviewScreen {...props} />
        </Provider>
      )
      expect(getByTestId('submitButton')).toBeEnabled()
    })
    it('shows the fees even if feeEstimate is loading', () => {
      const props = getProps(CICOFlow.CashIn, true, CryptoType.cUSD)
      store = getStore({
        feeEstimate: {
          usdFee: '0.02',
          lastUpdated: 500,
          loading: true,
          error: false,
          feeInfo: mockFeeInfo,
        },
      })
      const { queryByTestId } = render(
        <Provider store={store}>
          <FiatConnectReviewScreen {...props} />
        </Provider>
      )
      expect(queryByTestId('txDetails-fee/value')?.children).toEqual(['$', '0.70'])
    })
    it('shows the fees even if feeEstimate has an error', () => {
      const props = getProps(CICOFlow.CashIn, true, CryptoType.cUSD)
      store = getStore({
        feeEstimate: {
          usdFee: '0.02',
          lastUpdated: 500,
          loading: false,
          error: true,
          feeInfo: mockFeeInfo,
        },
      })
      const { queryByTestId } = render(
        <Provider store={store}>
          <FiatConnectReviewScreen {...props} />
        </Provider>
      )
      expect(queryByTestId('txDetails-fee/value')?.children).toEqual(['$', '0.70'])
    })
  })

  describe('cashOut', () => {
    it('shows fiat amount, transaction details and payment method, with provider and network fees', () => {
      const { queryByTestId, queryByText } = render(
        <Provider store={store}>
          <FiatConnectReviewScreen {...getProps(CICOFlow.CashOut, true, CryptoType.cEUR)} />
        </Provider>
      )

      expect(queryByText('fiatConnectReviewScreen.bankFeeDisclaimer')).toBeFalsy()
      expect(queryByTestId('receive-amount/value')?.children).toEqual(['$', '100.00'])
      expect(queryByText('fiatConnectReviewScreen.transactionDetails')).toBeTruthy()
      expect(queryByText('fiatConnectReviewScreen.cashOut.transactionDetailsAmount')).toBeTruthy()
      expect(queryByTestId('txDetails-total')?.children).toEqual(['100.02', ' cEUR'])
      expect(queryByTestId('txDetails-converted')?.children).toEqual(['99.47', ' cEUR'])
      expect(queryByTestId('txDetails-fee')?.children).toEqual(['0.55', ' cEUR'])
      expect(queryByTestId('txDetails-exchangeRate/value')?.children).toEqual(['$', '1.0053'])
      expect(queryByTestId('txDetails-receive/value')?.children).toEqual(['$', '100.00'])
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
          tokenId: props.route.params.normalizedQuote.getTokenId(),
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
          tokenId: props.route.params.normalizedQuote.getTokenId(),
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
          tokenId: props.route.params.normalizedQuote.getTokenId(),
        })
      )
    })

    it('shows fiat amount, transaction details and payment method without provider fee', () => {
      const { queryByTestId, queryByText } = render(
        <Provider store={store}>
          <FiatConnectReviewScreen {...getProps(CICOFlow.CashOut)} />
        </Provider>
      )

      expect(queryByTestId('receive-amount/value')?.children).toEqual(['$', '100.00'])
      expect(queryByText('fiatConnectReviewScreen.transactionDetails')).toBeTruthy()
      expect(queryByText('fiatConnectReviewScreen.cashOut.transactionDetailsAmount')).toBeTruthy()
      expect(queryByTestId('txDetails-total')?.children).toEqual(['100.02', ' cUSD'])
      expect(queryByTestId('txDetails-converted')?.children).toEqual(['100.00', ' cUSD'])
      expect(queryByTestId('txDetails-fee')?.children).toEqual(['0.015', ' cUSD'])
      expect(queryByTestId('txDetails-exchangeRate/value')?.children).toEqual(['$', '1'])
      expect(queryByTestId('txDetails-receive/value')?.children).toEqual(['$', '100.00'])
      expect(queryByText('fiatConnectReviewScreen.cashOut.paymentMethodHeader')).toBeTruthy()
      expect(queryByTestId('paymentMethod-text')?.children).toEqual(['Chase (...2345)'])
      expect(queryByTestId('paymentMethod-via')?.children).toEqual([
        'fiatConnectReviewScreen.paymentMethodVia, {"providerName":"Provider Two"}',
      ])
    })
    it('disables the submit button if feeInfo is not available', () => {
      const props = getProps(CICOFlow.CashOut, false, CryptoType.cUSD, false)
      store = getStore({
        feeEstimate: {
          usdFee: '0.02',
          lastUpdated: 500,
          loading: false,
          error: false,
          feeInfo: undefined,
        },
      })
      const { getByTestId } = render(
        <Provider store={store}>
          <FiatConnectReviewScreen {...props} />
        </Provider>
      )
      expect(getByTestId('submitButton')).toBeDisabled()
    })
    it('shows a loading spinner for fees if feeEstimate is loading', () => {
      const props = getProps(CICOFlow.CashOut, false, CryptoType.cUSD, false)
      store = getStore({
        feeEstimate: {
          usdFee: '0.02',
          lastUpdated: 500,
          loading: true,
          error: false,
          feeInfo: mockFeeInfo,
        },
      })
      const { queryByTestId } = render(
        <Provider store={store}>
          <FiatConnectReviewScreen {...props} />
        </Provider>
      )
      expect(queryByTestId('LineItemLoading')).toBeTruthy()
    })
    it('shows a --- for fees if feeEstimate has an error', () => {
      const props = getProps(CICOFlow.CashOut, false, CryptoType.cUSD, false)
      store = getStore({
        feeEstimate: {
          usdFee: '0.02',
          lastUpdated: 500,
          loading: false,
          error: true,
          feeInfo: mockFeeInfo,
        },
      })
      const { queryByTestId } = render(
        <Provider store={store}>
          <FiatConnectReviewScreen {...props} />
        </Provider>
      )
      expect(queryByTestId('LineItemRow/feeEstimateRow')?.children).toEqual(['---'])
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
          tokenId: props.route.params.normalizedQuote.getTokenId(),
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
          feeInfo: mockFeeInfo,
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
        amount: {
          fiat: 100,
          crypto: 100,
        },
        tokenId: mockCusdTokenId,
      })
    })
    describe.each([
      [FiatAccountType.BankAccount, 'fiatConnectReviewScreen.bankFeeDisclaimer'],
      [FiatAccountType.MobileMoney, 'fiatConnectReviewScreen.mobileMoneyFeeDisclaimer'],
    ])('Fee Disclaimer for %s', (accountType, disclaimer) => {
      const mockProps = getProps(CICOFlow.CashOut)
      mockProps.route.params.fiatAccount.fiatAccountType = accountType
      it(`${accountType} does not show disclaimer when quote fiat currency matches locale currency`, () => {
        const { queryByText } = render(
          <Provider store={store}>
            <FiatConnectReviewScreen {...mockProps} />
          </Provider>
        )

        expect(queryByText(disclaimer)).toBeFalsy()
      })
      it(`${accountType} shows disclaimer when quote fiat currency does not match locale currency`, () => {
        jest
          .mocked(getDefaultLocalCurrencyCode)
          .mockReturnValue('Locale Currency' as LocalCurrencyCode)
        const { queryByText } = render(
          <Provider store={store}>
            <FiatConnectReviewScreen {...mockProps} />
          </Provider>
        )

        expect(queryByText(disclaimer)).toBeTruthy()
      })
    })
  })
})
