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
import { createMockStore } from 'test/utils'
import { mockAccount, mockCeloAddress, mockCeurAddress, mockCusdAddress } from 'test/values'

const mockFetch = fetch as FetchMock

jest.mock('src/analytics/ValoraAnalytics')

const mockBuyAmount = '3000000000000000000'
const mockSellAmount = '1000000000000000000'

const store = createMockStore({
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
  stableToken: {
    balances: { [Currency.Dollar]: '10', [Currency.Euro]: '20' },
  },
  swap: {
    swapUserInput: {
      toToken: mockCusdAddress,
      fromToken: mockCeloAddress,
      swapAmount: {
        FROM: mockSellAmount,
        TO: mockBuyAmount,
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
      },
      [mockCusdAddress]: {
        balance: '10',
        usdPrice: '1',
        symbol: 'cUSD',
        address: mockCusdAddress,
        isCoreToken: true,
        priceFetchedAt: Date.now(),
      },
      [mockCeurAddress]: {
        balance: '20',
        usdPrice: '1.2',
        symbol: 'cEUR',
        address: mockCeurAddress,
        isCoreToken: true,
        priceFetchedAt: Date.now(),
      },
    },
  },
})

const unvalidatedSwapTransaction = {
  sellToken: mockCeloAddress,
  buyToken: mockCusdAddress,
  buyAmount: mockBuyAmount,
  sellAmount: mockSellAmount,
  price: '3.00',
  gas: '300000',
  gasPrice: '500000000',
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
    FROM: mockSellAmount,
    TO: mockBuyAmount,
  },
  updatedField: Field.FROM,
}

const mockSwap = {
  approveTransaction,
  userInput,
  unvalidatedSwapTransaction,
}

const mock0xResponse = {
  unvalidatedSwapTransaction,
  approveTransaction,
}

describe('SwapReviewScreen', () => {
  beforeEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
    mockFetch.resetMocks()
  })

  it('should display correct info on fetch', async () => {
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

    const { getByTestId, getByText } = render(
      <Provider store={store}>
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
      expect(getByText('1 CELO ≈ 3.10 cUSD')).toBeTruthy()
      // Estimated Gas
      expect(getByTestId('EstimatedGas')).toHaveTextContent('0.00015 CELO')
      // Swap Fee
      expect(getByTestId('SwapFee')).toHaveTextContent('swapReviewScreen.free')
    })
  })

  it('should display error banner on fetch error', async () => {
    mockFetch.mockReject()

    render(
      <Provider store={store}>
        <SwapReviewScreen />
      </Provider>
    )

    await waitFor(() => {
      expect(store.getActions()).toEqual(
        expect.arrayContaining([showError(ErrorMessages.FETCH_SWAP_QUOTE_FAILED)])
      )
    })
  })

  it('should have correct analytics on screen open', () => {
    mockFetch.mockResponse(JSON.stringify(mock0xResponse))

    render(
      <Provider store={store}>
        <SwapReviewScreen />
      </Provider>
    )

    expect(ValoraAnalytics.track).toHaveBeenCalledWith(SwapEvents.swap_review_screen_open, {
      amount: mockSellAmount,
      fromToken: mockCeloAddress,
      toToken: mockCusdAddress,
      amountType: 'sellAmount',
    })
  })

  it('should correctly dispatch swapStart', async () => {
    store.dispatch = jest.fn()
    mockFetch.mockResponse(JSON.stringify(mock0xResponse))

    const { getByText } = render(
      <Provider store={store}>
        <SwapReviewScreen />
      </Provider>
    )

    await waitFor(() => expect(getByText('swapReviewScreen.complete')).not.toBeDisabled())

    fireEvent.press(getByText('swapReviewScreen.complete'))
    expect(store.dispatch).toHaveBeenCalledWith(swapStart(mockSwap as any))
  })

  it('should have correct analytics on swap submission', async () => {
    store.dispatch = jest.fn()
    mockFetch.mockResponse(JSON.stringify(mock0xResponse))

    const { getByText } = render(
      <Provider store={store}>
        <SwapReviewScreen />
      </Provider>
    )

    await waitFor(() => expect(getByText('swapReviewScreen.complete')).not.toBeDisabled())

    fireEvent.press(getByText('swapReviewScreen.complete'))
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(SwapEvents.swap_review_submit, {
      toToken: mockCusdAddress,
      fromToken: mockCeloAddress,
      amount: mockSellAmount,
      amountType: 'sellAmount',
      usdTotal: 3,
    })
  })
})
