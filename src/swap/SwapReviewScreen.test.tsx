import { fireEvent, render, waitFor } from '@testing-library/react-native'
import { FetchMock } from 'jest-fetch-mock/types'
import React from 'react'
import { Provider } from 'react-redux'
import { showError } from 'src/alert/actions'
import { SwapEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { swapStart } from 'src/swap/slice'
import SwapReviewScreen from 'src/swap/SwapReviewScreen'
import { Field } from 'src/swap/types'
import { Currency } from 'src/utils/currencies'
import networkConfig from 'src/web3/networkConfig'
import { createMockStore } from 'test/utils'
import {
  mockAccount,
  mockCeloAddress,
  mockCeurAddress,
  mockCusdAddress,
  mockWBTCAddress,
} from 'test/values'

const mockFetch = fetch as FetchMock
const mockFeeCurrency = jest.fn()

jest.mock('src/fees/hooks', () => ({
  useFeeCurrency: () => mockFeeCurrency(),
}))

jest.mock('src/analytics/ValoraAnalytics')

const mockBuyAmount = '3000000000000000000'
const mockSellAmount = '1000000000000000000'

const store = {
  localCurrency: {
    exchangeRates: {
      [Currency.Dollar]: '1',
      [Currency.Euro]: '1.2',
      [Currency.Celo]: '3.1',
    },
    fetchedCurrencyCode: LocalCurrencyCode.USD,
    preferredCurrencyCode: LocalCurrencyCode.USD,
  },
  web3: {
    account: mockAccount,
  },
  swap: {
    swapUserInput: {
      toToken: mockCusdAddress,
      fromToken: mockCeloAddress,
      swapAmount: {
        FROM: '1',
        TO: '3',
      },
      updatedField: Field.FROM,
    },
  },
  tokens: {
    tokenBalances: {
      [mockCeloAddress]: {
        balance: '5',
        usdPrice: '3.1',
        symbol: 'CELO',
        address: mockCeloAddress,
        priceFetchedAt: Date.now(),
        isCoreToken: true,
        decimals: 18,
      },
      [mockCusdAddress]: {
        balance: '10',
        usdPrice: '1',
        symbol: 'cUSD',
        address: mockCusdAddress,
        isCoreToken: true,
        priceFetchedAt: Date.now(),
        decimals: 18,
      },
      [mockCeurAddress]: {
        balance: '20',
        usdPrice: '1.2',
        symbol: 'cEUR',
        address: mockCeurAddress,
        isCoreToken: true,
        priceFetchedAt: Date.now(),
        decimals: 18,
      },
      [mockWBTCAddress]: {
        balance: '0',
        usdPrice: '20000',
        symbol: 'WBTC',
        address: mockWBTCAddress,
        isCoreToken: false,
        priceFetchedAt: Date.now(),
        decimals: 8,
      },
    },
  },
}

const mockStore = createMockStore(store)

const unvalidatedSwapTransaction = {
  sellToken: mockCeloAddress,
  buyToken: mockCusdAddress,
  buyAmount: mockBuyAmount,
  sellAmount: mockSellAmount,
  price: '3.00',
  gas: '300000',
  gasPrice: '500000000',
  allowanceTarget: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
  estimatedPriceImpact: '0.1',
}

const approveTransaction = {
  chainId: 42220,
  data: '0xData',
  from: mockAccount,
  gas: '300000',
  to: '0xMockAddress',
}

const userInput = {
  toToken: mockCusdAddress,
  fromToken: mockCeloAddress,
  swapAmount: {
    FROM: '1',
    TO: '3',
  },
  updatedField: Field.FROM,
}

const mock0xResponse = {
  unvalidatedSwapTransaction,
  approveTransaction,
  details: {
    swapProvider: 'test',
  },
}

const mockSwap = {
  ...mock0xResponse,
  userInput,
}

describe('SwapReviewScreen', () => {
  beforeEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
    mockFetch.resetMocks()
  })

  it('should display correct info on fetch', async () => {
    mockFeeCurrency.mockImplementation(() => mockCeloAddress)

    mockFetch.mockResponse(
      JSON.stringify({
        unvalidatedSwapTransaction: {
          sellToken: mockCeloAddress,
          buyToken: mockCusdAddress,
          buyAmount: '3100000000000000000',
          sellAmount: '1000000000000000000',
          price: '3.10',
          gas: '300000',
          gasPrice: '500000000',
        },
      })
    )

    const { getByTestId } = render(
      <Provider store={mockStore}>
        <SwapReviewScreen />
      </Provider>
    )

    await waitFor(() => {
      // Swap From
      expect(getByTestId('FromSwapAmountToken')).toHaveTextContent('1.00 CELO')
      expect(getByTestId('FromSwapAmountTokenLocal')).toHaveTextContent('$3.10')
      // Swap To
      expect(getByTestId('ToSwapAmountToken')).toHaveTextContent('3.10 cUSD')
      // Exchange Rate
      expect(getByTestId('ExchangeRate')).toHaveTextContent('1 CELO ≈ 3.10 cUSD')
      // Estimated Gas
      expect(getByTestId('EstimatedGas')).toHaveTextContent('0.00015 CELO')
      // Swap Fee
      expect(getByTestId('SwapFee')).toHaveTextContent('swapReviewScreen.free')
    })

    expect(mockFetch).toHaveBeenCalledWith(
      `${
        networkConfig.approveSwapUrl
      }?buyToken=${mockCusdAddress}&sellToken=${mockCeloAddress}&sellAmount=1000000000000000000&userAddress=${mockAccount.toLowerCase()}`
    )
  })

  it('should display correct exchange rate when buyAmount is used', async () => {
    mockFeeCurrency.mockImplementation(() => mockCusdAddress)

    const newStore = {
      ...store,
      swap: {
        ...store.swap,
        swapUserInput: {
          ...store.swap.swapUserInput,
          toToken: mockCeloAddress,
          fromToken: mockCusdAddress,
          swapAmount: {
            FROM: '8.20',
            TO: '2',
          },
          // This updated field set to To indicates the buy amount is used
          updatedField: Field.TO,
        },
      },
    }

    const newMockStore = createMockStore(newStore)

    mockFetch.mockResponse(
      JSON.stringify({
        unvalidatedSwapTransaction: {
          sellToken: mockCusdAddress,
          buyToken: mockCeloAddress,
          buyAmount: '2000000000000000000',
          sellAmount: '8200000000000000000',
          price: '4.10',
          gas: '300000',
          gasPrice: '500000000',
        },
      })
    )

    const { getByTestId } = render(
      <Provider store={newMockStore}>
        <SwapReviewScreen />
      </Provider>
    )

    await waitFor(() => {
      // Swap From
      expect(getByTestId('FromSwapAmountToken')).toHaveTextContent('8.20 cUSD')
      expect(getByTestId('FromSwapAmountTokenLocal')).toHaveTextContent('$8.20')
      // Swap To
      expect(getByTestId('ToSwapAmountToken')).toHaveTextContent('2.00 CELO')
      // Exchange Rate
      expect(getByTestId('ExchangeRate')).toHaveTextContent('4.10 cUSD ≈ 1 CELO')
      // Estimated Gas
      expect(getByTestId('EstimatedGas')).toHaveTextContent('0.00047 cUSD')
      // Swap Fee
      expect(getByTestId('SwapFee')).toHaveTextContent('swapReviewScreen.free')
    })

    expect(mockFetch).toHaveBeenCalledWith(
      `${
        networkConfig.approveSwapUrl
      }?buyToken=${mockCeloAddress}&sellToken=${mockCusdAddress}&buyAmount=2000000000000000000&userAddress=${mockAccount.toLowerCase()}`
    )
  })

  it('should display correct info when swapping tokens with non-default decimals', async () => {
    mockFeeCurrency.mockImplementation(() => mockCeloAddress)

    const newStore = {
      ...store,
      swap: {
        ...store.swap,
        swapUserInput: {
          ...store.swap.swapUserInput,
          toToken: mockWBTCAddress,
          fromToken: mockCusdAddress,
          swapAmount: {
            FROM: '200',
            TO: '0.01',
          },
          updatedField: Field.FROM,
        },
      },
    }

    const newMockStore = createMockStore(newStore)

    mockFetch.mockResponse(
      JSON.stringify({
        unvalidatedSwapTransaction: {
          sellToken: mockCusdAddress,
          buyToken: mockWBTCAddress,
          buyAmount: '1000000',
          sellAmount: '2000000000000000000',
          price: '0.005',
          gas: '300000',
          gasPrice: '500000000',
        },
      })
    )

    const { getByTestId } = render(
      <Provider store={newMockStore}>
        <SwapReviewScreen />
      </Provider>
    )

    await waitFor(() => {
      // Swap From
      expect(getByTestId('FromSwapAmountToken')).toHaveTextContent('2.00 cUSD')
      expect(getByTestId('FromSwapAmountTokenLocal')).toHaveTextContent('$2.00')
      // Swap To
      expect(getByTestId('ToSwapAmountToken')).toHaveTextContent('0.01 WBTC')
      // Exchange Rate
      expect(getByTestId('ExchangeRate')).toHaveTextContent('1 cUSD ≈ 0.005 WBTC')
      // Estimated Gas
      expect(getByTestId('EstimatedGas')).toHaveTextContent('0.00015 CELO')
      // Swap Fee
      expect(getByTestId('SwapFee')).toHaveTextContent('swapReviewScreen.free')
    })

    expect(mockFetch).toHaveBeenCalledWith(
      `${
        networkConfig.approveSwapUrl
      }?buyToken=${mockWBTCAddress}&sellToken=${mockCusdAddress}&sellAmount=200000000000000000000&userAddress=${mockAccount.toLowerCase()}`
    )
  })

  it('should display error banner on fetch error', async () => {
    mockFetch.mockReject()

    render(
      <Provider store={mockStore}>
        <SwapReviewScreen />
      </Provider>
    )

    await waitFor(() => {
      expect(mockStore.getActions()).toEqual(
        expect.arrayContaining([showError(ErrorMessages.FETCH_SWAP_QUOTE_FAILED)])
      )
    })
  })

  it('should have correct analytics on screen open', () => {
    mockFetch.mockResponse(JSON.stringify(mock0xResponse))

    render(
      <Provider store={mockStore}>
        <SwapReviewScreen />
      </Provider>
    )

    expect(ValoraAnalytics.track).toHaveBeenCalledWith(SwapEvents.swap_review_screen_open, {
      amount: '1',
      fromToken: mockCeloAddress,
      toToken: mockCusdAddress,
      amountType: 'sellAmount',
    })
  })

  it('should correctly dispatch swapStart', async () => {
    mockStore.dispatch = jest.fn()
    mockFetch.mockResponse(JSON.stringify(mock0xResponse))

    const { getByText } = render(
      <Provider store={mockStore}>
        <SwapReviewScreen />
      </Provider>
    )

    await waitFor(() => expect(getByText('swapReviewScreen.complete')).not.toBeDisabled())

    fireEvent.press(getByText('swapReviewScreen.complete'))
    expect(mockStore.dispatch).toHaveBeenCalledWith(
      swapStart({
        ...mockSwap,
        quoteRequestAt: expect.any(Number),
        quoteResponseAt: expect.any(Number),
      } as any)
    )
  })

  it('should have correct analytics on swap submission', async () => {
    mockStore.dispatch = jest.fn()
    mockFetch.mockResponse(JSON.stringify(mock0xResponse))

    const { getByText } = render(
      <Provider store={mockStore}>
        <SwapReviewScreen />
      </Provider>
    )

    await waitFor(() => expect(getByText('swapReviewScreen.complete')).not.toBeDisabled())

    fireEvent.press(getByText('swapReviewScreen.complete'))
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(SwapEvents.swap_review_submit, {
      toToken: mockCusdAddress,
      fromToken: mockCeloAddress,
      amount: '1',
      amountType: 'sellAmount',
      usdTotal: 3,
      allowanceTarget: mock0xResponse.unvalidatedSwapTransaction.allowanceTarget,
      estimatedPriceImpact: mock0xResponse.unvalidatedSwapTransaction.estimatedPriceImpact,
      price: mock0xResponse.unvalidatedSwapTransaction.price,
      provider: mock0xResponse.details.swapProvider,
    })
  })
})
