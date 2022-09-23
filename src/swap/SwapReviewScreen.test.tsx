import { render, waitFor } from '@testing-library/react-native'
import { FetchMock } from 'jest-fetch-mock/types'
import React from 'react'
import { Provider } from 'react-redux'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import SwapReviewScreen from 'src/swap/SwapReviewScreen'
import { Field } from 'src/swap/useSwapQuote'
import { Currency } from 'src/utils/currencies'
import { createMockStore } from 'test/utils'
import { mockAccount, mockCeloAddress, mockCeurAddress, mockCusdAddress } from 'test/values'

const mockFetch = fetch as FetchMock

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
        FROM: '1000000000000000000',
        TO: '3000000000000000000',
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
      expect(getByTestId('SwapFee')).toHaveTextContent('$0.023')
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

  it.todo('should correctly dispatch swapStart')
  it.todo('should have correct analytics on swap submission')
})
