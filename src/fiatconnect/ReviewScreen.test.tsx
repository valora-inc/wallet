import { CryptoType, FiatAccountSchema, FiatAccountType } from '@fiatconnect/fiatconnect-types'
import { fireEvent, render, waitFor } from '@testing-library/react-native'
import _ from 'lodash'
import * as React from 'react'
import { Provider } from 'react-redux'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { FiatConnectQuoteSuccess } from 'src/fiatconnect'
import FiatConnectReviewScreen from 'src/fiatconnect/ReviewScreen'
import { FiatAccount, createFiatConnectTransfer, refetchQuote } from 'src/fiatconnect/slice'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { getDefaultLocalCurrencyCode } from 'src/localCurrency/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { prepareSendTransactionsCallback } from 'src/send/usePrepareSendTransactions'
import { NetworkId } from 'src/transactions/types'
import { TransactionRequest } from 'src/viem/prepareTransactions'
import { getSerializablePreparedTransaction } from 'src/viem/preparedTransactionSerialization'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import {
  mockAccount,
  mockCeloAddress,
  mockCeloTokenId,
  mockCeurAddress,
  mockCeurTokenBalance,
  mockCeurTokenId,
  mockCusdAddress,
  mockCusdTokenBalance,
  mockCusdTokenId,
  mockFiatConnectQuotes,
} from 'test/values'
import { Address, parseGwei } from 'viem'

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

jest.mock('src/send/usePrepareSendTransactions')
jest.mock('src/fiatconnect/clients', () => ({
  getFiatConnectClient: jest.fn(() => ({
    transferIn: jest.fn(() => ({
      unwrap: jest.fn().mockResolvedValue({
        transferAddress: '0x123',
        transferId: '123',
        transferStatus: 'success',
      }),
      isErr: false,
    })),
    transferOut: jest.fn(() => ({
      unwrap: jest.fn().mockResolvedValue({
        transferAddress: '0x123',
        transferId: '123',
        transferStatus: 'success',
      }),
      isErr: false,
    })),
  })),
}))

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

const store = createMockStore({
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

describe('ReviewScreen', () => {
  beforeEach(() => {
    jest.mocked(getDefaultLocalCurrencyCode).mockReturnValue(LocalCurrencyCode.USD)
  })

  describe('cashIn', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('shows fiat amount, transaction details and payment method', async () => {
      const { getByTestId, getByText, findByTestId, queryByText } = render(
        <Provider store={store}>
          <FiatConnectReviewScreen {...getProps(CICOFlow.CashIn, true, CryptoType.cEUR)} />
        </Provider>
      )

      expect(await findByTestId('receive-amount')).toHaveTextContent('100.00 cEUR')
      expect(queryByText('fiatConnectReviewScreen.bankFeeDisclaimer')).toBeFalsy()
      expect(getByText('fiatConnectReviewScreen.transactionDetails')).toBeTruthy()
      expect(getByText('fiatConnectReviewScreen.cashIn.transactionDetailsAmount')).toBeTruthy()
      expect(getByTestId('txDetails-total/value')).toHaveTextContent('$100.00')
      expect(getByTestId('txDetails-converted/value')).toHaveTextContent('$99.15')
      expect(getByTestId('txDetails-fee/value')).toHaveTextContent('$0.84')
      expect(getByTestId('txDetails-exchangeRate/value')).toHaveTextContent('$0.9915')
      expect(getByTestId('txDetails-receive')).toHaveTextContent('100.00 cEUR')
      expect(getByText('fiatConnectReviewScreen.cashIn.paymentMethodHeader')).toBeTruthy()
      expect(getByTestId('paymentMethod-text')).toHaveTextContent('Chase (...2345)')
      expect(getByTestId('paymentMethod-via')).toHaveTextContent(
        'fiatConnectReviewScreen.paymentMethodVia, {"providerName":"Provider Two"}'
      )
    })
    it('shows the fees even if the prepared transaction is loading', async () => {
      jest.mocked(prepareSendTransactionsCallback).mockImplementation(async () => {
        return new Promise(() => {
          // do nothing so that the loading state persists
        })
      })
      const props = getProps(CICOFlow.CashIn, true, CryptoType.cUSD)
      const { findByTestId } = render(
        <Provider store={store}>
          <FiatConnectReviewScreen {...props} />
        </Provider>
      )
      expect(await findByTestId('txDetails-fee/value')).toHaveTextContent('$0.70')
    })
    it('shows the fees even if the prepared transaction has an error', async () => {
      jest.mocked(prepareSendTransactionsCallback).mockRejectedValue(new Error('some error'))
      const props = getProps(CICOFlow.CashIn, true, CryptoType.cUSD)
      const { findByTestId } = render(
        <Provider store={store}>
          <FiatConnectReviewScreen {...props} />
        </Provider>
      )
      expect(await findByTestId('txDetails-fee/value')).toHaveTextContent('$0.70')
    })
  })

  describe('cashOut', () => {
    beforeEach(() => {
      store.clearActions()
      jest.clearAllMocks()
    })

    it('shows fiat amount, transaction details and payment method, with provider and network fees', async () => {
      jest.mocked(prepareSendTransactionsCallback).mockResolvedValue({
        type: 'possible',
        transactions: [
          {
            from: mockAccount,
            to: '0x123',
            value: BigInt(0),
            data: '0xtransferEncodedData',
            gas: BigInt(4_000_000), // max gas = gas * maxFeePerGas = 0.02 cEUR
            maxFeePerGas: parseGwei('5'),
            _baseFeePerGas: parseGwei('1'),
            feeCurrency: mockCeurAddress as Address,
          },
        ],
        feeCurrency: mockCeurTokenBalance,
      })

      const { findByTestId, queryByText, getByText, getByTestId } = render(
        <Provider store={store}>
          <FiatConnectReviewScreen {...getProps(CICOFlow.CashOut, true, CryptoType.cEUR)} />
        </Provider>
      )

      expect(await findByTestId('receive-amount/value')).toHaveTextContent('$100.00')
      expect(queryByText('fiatConnectReviewScreen.bankFeeDisclaimer')).toBeFalsy()
      expect(getByText('fiatConnectReviewScreen.transactionDetails')).toBeTruthy()
      expect(getByText('fiatConnectReviewScreen.cashOut.transactionDetailsAmount')).toBeTruthy()
      expect(getByTestId('txDetails-total')).toHaveTextContent('100.02 cEUR')
      expect(getByTestId('txDetails-converted')).toHaveTextContent('99.47 cEUR')
      expect(getByTestId('txDetails-fee')).toHaveTextContent('0.55 cEUR')
      expect(getByTestId('txDetails-exchangeRate/value')).toHaveTextContent('$1.0053')
      expect(getByTestId('txDetails-receive/value')).toHaveTextContent('$100.00')
      expect(getByText('fiatConnectReviewScreen.cashOut.paymentMethodHeader')).toBeTruthy()
      expect(getByTestId('paymentMethod-text')).toHaveTextContent('Chase (...2345)')
      expect(getByTestId('paymentMethod-via')).toHaveTextContent(
        'fiatConnectReviewScreen.paymentMethodVia, {"providerName":"Provider Two"}'
      )
    })
    it('dispatches refetchQuote when shouldRefetchQuote is true', async () => {
      const props = getProps(CICOFlow.CashOut, true, CryptoType.cEUR, true)
      render(
        <Provider store={store}>
          <FiatConnectReviewScreen {...props} />
        </Provider>
      )
      await waitFor(() =>
        expect(store.getActions()).toEqual([
          refetchQuote({
            flow: CICOFlow.CashOut,
            cryptoType: props.route.params.normalizedQuote.getCryptoType(),
            cryptoAmount: props.route.params.normalizedQuote.getCryptoAmount(),
            fiatAmount: props.route.params.normalizedQuote.getFiatAmount(),
            providerId: props.route.params.normalizedQuote.getProviderId(),
            fiatAccount: props.route.params.fiatAccount,
            tokenId: props.route.params.normalizedQuote.getTokenId(),
          }),
        ])
      )
    })
    it('shows an error page when fiatConnectQuotesError is truthy, try again button dispatches refetchQuote', async () => {
      const props = getProps(CICOFlow.CashOut, true, CryptoType.cEUR, false)
      const mockStore = createMockStore({
        fiatConnect: {
          quotesError: 'error',
        },
      })
      const { findByTestId, getByTestId } = render(
        <Provider store={mockStore}>
          <FiatConnectReviewScreen {...props} />
        </Provider>
      )

      expect(await findByTestId('TryAgain')).toBeEnabled()
      expect(mockStore.getActions()).toEqual([])

      fireEvent.press(getByTestId('TryAgain'))
      await waitFor(() =>
        expect(mockStore.getActions()).toEqual([
          refetchQuote({
            flow: CICOFlow.CashOut,
            cryptoType: props.route.params.normalizedQuote.getCryptoType(),
            cryptoAmount: props.route.params.normalizedQuote.getCryptoAmount(),
            fiatAmount: props.route.params.normalizedQuote.getFiatAmount(),
            providerId: props.route.params.normalizedQuote.getProviderId(),
            fiatAccount: props.route.params.fiatAccount,
            tokenId: props.route.params.normalizedQuote.getTokenId(),
          }),
        ])
      )
    })

    it('shows fiat amount, transaction details and payment method without provider fee', async () => {
      jest.mocked(prepareSendTransactionsCallback).mockResolvedValue({
        type: 'possible',
        transactions: [
          {
            from: mockAccount,
            to: '0x123',
            value: BigInt(0),
            data: '0xtransferEncodedData',
            gas: BigInt(3_000_000), // max gas = gas * maxFeePerGas = 0.015 cUSD
            maxFeePerGas: parseGwei('5'),
            _baseFeePerGas: parseGwei('1'),
            feeCurrency: mockCusdAddress as Address,
          },
        ],
        feeCurrency: mockCusdTokenBalance,
      })

      const { findByTestId, queryByText, getByText, getByTestId } = render(
        <Provider store={store}>
          <FiatConnectReviewScreen {...getProps(CICOFlow.CashOut)} />
        </Provider>
      )

      expect(await findByTestId('receive-amount/value')).toHaveTextContent('$100.00')
      expect(queryByText('fiatConnectReviewScreen.bankFeeDisclaimer')).toBeFalsy()
      expect(getByText('fiatConnectReviewScreen.transactionDetails')).toBeTruthy()
      expect(getByText('fiatConnectReviewScreen.cashOut.transactionDetailsAmount')).toBeTruthy()
      expect(getByTestId('txDetails-total')).toHaveTextContent('100.02 cUSD')
      expect(getByTestId('txDetails-converted')).toHaveTextContent('100.00 cUSD')
      expect(getByTestId('txDetails-fee')).toHaveTextContent('0.015 cUSD') // only network fee
      expect(getByTestId('txDetails-exchangeRate/value')).toHaveTextContent('$1')
      expect(getByTestId('txDetails-receive/value')).toHaveTextContent('$100.00')
      expect(getByText('fiatConnectReviewScreen.cashOut.paymentMethodHeader')).toBeTruthy()
      expect(getByTestId('paymentMethod-text')).toHaveTextContent('Chase (...2345)')
      expect(getByTestId('paymentMethod-via')).toHaveTextContent(
        'fiatConnectReviewScreen.paymentMethodVia, {"providerName":"Provider Two"}'
      )
    })
    it('disables the submit button if prepared transaction is not possible', async () => {
      jest.mocked(prepareSendTransactionsCallback).mockResolvedValue({
        type: 'not-enough-balance-for-gas',
        feeCurrencies: [mockCusdTokenBalance],
      })
      const props = getProps(CICOFlow.CashOut, false, CryptoType.cUSD, false)
      const { findByTestId } = render(
        <Provider store={store}>
          <FiatConnectReviewScreen {...props} />
        </Provider>
      )

      expect(await findByTestId('submitButton')).toBeDisabled()
    })
    it('shows a loading spinner for fees if there is a provider fee and the prepared transaction is loading', async () => {
      jest.mocked(prepareSendTransactionsCallback).mockImplementation(async () => {
        return new Promise(() => {
          // do nothing so that the loading state persists
        })
      })
      const props = getProps(CICOFlow.CashOut, true, CryptoType.cUSD, false)
      const { getByTestId } = render(
        <Provider store={store}>
          <FiatConnectReviewScreen {...props} />
        </Provider>
      )

      await waitFor(() => expect(getByTestId('LineItemLoading')).toBeTruthy())
    })
    it('shows a --- for fees if there is a provider fee and there was an error preparing transactions', async () => {
      jest.mocked(prepareSendTransactionsCallback).mockRejectedValue(new Error('some error'))
      const props = getProps(CICOFlow.CashOut, true, CryptoType.cUSD, false)
      const { getByTestId } = render(
        <Provider store={store}>
          <FiatConnectReviewScreen {...props} />
        </Provider>
      )

      await waitFor(() =>
        expect(getByTestId('LineItemRow/feeEstimateRow')).toHaveTextContent('---')
      )
    })
    it('shows expired dialog when quote is expired', async () => {
      const expireMs = -100
      const props = getProps(CICOFlow.CashOut, false, CryptoType.cUSD, false, expireMs)
      const quote = _.cloneDeep(mockFiatConnectQuotes[1]) as FiatConnectQuoteSuccess
      quote.quote.guaranteedUntil = new Date(Date.now() + expireMs).toISOString()
      const mockStore = createMockStore({
        fiatConnect: {
          quotes: [quote],
        },
      })
      const { getByTestId } = render(
        <Provider store={mockStore}>
          <FiatConnectReviewScreen {...props} />
        </Provider>
      )

      await waitFor(() => expect(getByTestId('expiredQuoteDialog')?.props.visible).toEqual(true))

      fireEvent.press(getByTestId('expiredQuoteDialog/PrimaryAction'))
      await waitFor(() =>
        expect(mockStore.getActions()).toEqual([
          refetchQuote({
            flow: CICOFlow.CashOut,
            cryptoType: props.route.params.normalizedQuote.getCryptoType(),
            cryptoAmount: props.route.params.normalizedQuote.getCryptoAmount(),
            fiatAmount: props.route.params.normalizedQuote.getFiatAmount(),
            providerId: props.route.params.normalizedQuote.getProviderId(),
            fiatAccount: props.route.params.fiatAccount,
            tokenId: props.route.params.normalizedQuote.getTokenId(),
          }),
        ])
      )
    })
    it.only('shows expired dialog when submitting expired quote', async () => {
      jest.mocked(prepareSendTransactionsCallback).mockResolvedValue({
        type: 'possible',
        transactions: [
          {
            from: mockAccount,
            to: '0x123',
            value: BigInt(0),
            data: '0xtransferEncodedData',
            gas: BigInt(3_000_000), // max gas = gas * maxFeePerGas = 0.015 cUSD
            maxFeePerGas: parseGwei('5'),
            _baseFeePerGas: parseGwei('1'),
            feeCurrency: mockCusdAddress as Address,
          },
        ],
        feeCurrency: mockCusdTokenBalance,
      })
      jest.useRealTimers()
      const expireMs = 100
      const mockProps = getProps(CICOFlow.CashOut, false, CryptoType.cUSD, false, expireMs)
      const { getByTestId, findByTestId } = render(
        <Provider store={store}>
          <FiatConnectReviewScreen {...mockProps} />
        </Provider>
      )

      expect((await findByTestId('expiredQuoteDialog'))?.props.visible).toEqual(false)
      await new Promise((resolve) => setTimeout(resolve, expireMs))
      fireEvent.press(getByTestId('submitButton'))

      expect(store.getActions()).toEqual([])
      expect((await findByTestId('expiredQuoteDialog'))?.props.visible).toEqual(true)
    })
    it('dispatches fiat transfer action and navigates on clicking button', async () => {
      const mockTransaction: TransactionRequest = {
        from: mockAccount,
        to: '0x123',
        value: BigInt(0),
        data: '0xtransferEncodedData',
        gas: BigInt(3_000_000), // max gas = gas * maxFeePerGas = 0.015 cUSD
        maxFeePerGas: parseGwei('5'),
        _baseFeePerGas: parseGwei('1'),
        feeCurrency: mockCusdAddress as Address,
      }
      jest.mocked(prepareSendTransactionsCallback).mockResolvedValue({
        type: 'possible',
        transactions: [mockTransaction],
        feeCurrency: mockCusdTokenBalance,
      })
      const mockProps = getProps(CICOFlow.CashOut)

      const { getByTestId } = render(
        <Provider store={store}>
          <FiatConnectReviewScreen {...mockProps} />
        </Provider>
      )

      await waitFor(() => expect(getByTestId('submitButton')).toBeEnabled())
      fireEvent.press(getByTestId('submitButton'))

      expect(store.getActions()).toEqual([
        createFiatConnectTransfer({
          flow: CICOFlow.CashOut,
          fiatConnectQuote: mockProps.route.params.normalizedQuote,
          fiatAccountId: '123',
          networkId: NetworkId['celo-alfajores'],
          serializablePreparedTransaction: getSerializablePreparedTransaction(mockTransaction),
          transferAddress: '0x123',
          transferId: '123',
        }),
      ])
      expect(navigate).toHaveBeenCalledWith(Screens.FiatConnectTransferStatus, {
        flow: CICOFlow.CashOut,
        normalizedQuote: mockProps.route.params.normalizedQuote,
        fiatAccount: mockProps.route.params.fiatAccount,
      })
    })
    it.only('navigates back to select providers screen when the provider is pressed', async () => {
      const mockProps = getProps(CICOFlow.CashOut)

      const { findByTestId } = render(
        <Provider store={store}>
          <FiatConnectReviewScreen {...mockProps} />
        </Provider>
      )

      fireEvent.press(await findByTestId('paymentMethod-text'))

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
      it(`${accountType} does not show disclaimer when quote fiat currency matches locale currency`, async () => {
        const { queryByText } = render(
          <Provider store={store}>
            <FiatConnectReviewScreen {...mockProps} />
          </Provider>
        )

        await waitFor(() => expect(queryByText(disclaimer)).toBeFalsy())
      })
      it(`${accountType} shows disclaimer when quote fiat currency does not match locale currency`, async () => {
        jest
          .mocked(getDefaultLocalCurrencyCode)
          .mockReturnValue('Locale Currency' as LocalCurrencyCode)
        const { findByText } = render(
          <Provider store={store}>
            <FiatConnectReviewScreen {...mockProps} />
          </Provider>
        )

        expect(await findByText(disclaimer)).toBeTruthy()
      })
    })
  })
})
