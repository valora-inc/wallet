import { act, fireEvent, render, within } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import { FetchMock } from 'jest-fetch-mock/types'
import React from 'react'
import { Provider } from 'react-redux'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { setSwapUserInput } from 'src/swap/slice'
import SwapScreen from 'src/swap/SwapScreen'
import { Field } from 'src/swap/types'
import networkConfig from 'src/web3/networkConfig'
import { createMockStore } from 'test/utils'
import { mockAccount, mockCeloAddress, mockCeurAddress, mockCusdAddress } from 'test/values'

const mockFetch = fetch as FetchMock

// Use comma as decimal separator for all tests here
// Input with "." will still work, but it will also work with ",".
jest.mock('react-native-localize', () => ({
  getNumberFormatSettings: () => ({
    decimalSeparator: ',',
  }),
}))

const renderScreen = ({ hasZeroCeloBalance = false }) => {
  const store = createMockStore({
    tokens: {
      tokenBalances: {
        [mockCeurAddress]: {
          address: mockCeurAddress,
          symbol: 'cEUR',
          priceFetchedAt: 1658144640753,
          historicalUsdPrices: {
            lastDay: {
              at: 1658057880747,
              price: '5.03655958698530226301',
            },
          },
          usdPrice: '5.03655958698530226301',
          decimals: 18,
          imageUrl:
            'https://raw.githubusercontent.com/valora-inc/address-metadata/main/assets/tokens/cEUR.png',
          isCoreToken: true,
          name: 'Celo Euro',
          balance: '0',
        },
        [mockCusdAddress]: {
          usdPrice: '1',
          isCoreToken: true,
          address: mockCusdAddress,
          priceFetchedAt: 1658144640753,
          symbol: 'cUSD',
          imageUrl:
            'https://raw.githubusercontent.com/valora-inc/address-metadata/main/assets/tokens/cUSD.png',
          decimals: 18,
          balance: '20.456',
          historicalUsdPrices: {
            lastDay: {
              at: 1658057880747,
              price: '1',
            },
          },
          name: 'Celo Dollar',
        },
        [mockCeloAddress]: {
          address: mockCeloAddress,
          symbol: 'CELO',
          priceFetchedAt: 1658144640753,
          historicalUsdPrices: {
            lastDay: {
              at: 1658057880747,
              price: '13.05584965485329753569',
            },
          },
          usdPrice: '13.05584965485329753569',
          decimals: 18,
          imageUrl:
            'https://raw.githubusercontent.com/valora-inc/address-metadata/main/assets/tokens/CELO.png',
          isCoreToken: true,
          name: 'Celo native asset',
          balance: hasZeroCeloBalance ? '0' : '10',
        },
      },
    },
  })

  const tree = render(
    <Provider store={store}>
      <SwapScreen />
    </Provider>
  )
  const [swapFromContainer, swapToContainer] = tree.getAllByTestId('SwapAmountInput')

  return {
    ...tree,
    store,
    swapFromContainer,
    swapToContainer,
  }
}

describe('SwapScreen', () => {
  beforeEach(() => {
    mockFetch.resetMocks()

    BigNumber.config({
      FORMAT: {
        decimalSeparator: '.',
      },
    })
  })

  it('should display the correct elements on load', () => {
    const { getByText, swapFromContainer, swapToContainer } = renderScreen({})

    expect(getByText('swapScreen.title')).toBeTruthy()
    expect(getByText('swapScreen.review')).toBeDisabled()

    expect(within(swapFromContainer).getByText('swapScreen.swapFrom')).toBeTruthy()
    expect(within(swapFromContainer).getByTestId('SwapAmountInput/MaxButton')).toBeTruthy()
    expect(within(swapFromContainer).getByTestId('SwapAmountInput/TokenSelect')).toBeTruthy()
    expect(within(swapFromContainer).getByText('CELO')).toBeTruthy()

    expect(within(swapToContainer).getByText('swapScreen.swapTo')).toBeTruthy()
    expect(within(swapToContainer).getByTestId('SwapAmountInput/TokenSelect')).toBeTruthy()
    expect(within(swapToContainer).getByText('cUSD')).toBeTruthy()
  })

  it('should allow selecting tokens', () => {
    const { swapFromContainer, swapToContainer, getByTestId } = renderScreen({})

    expect(within(swapFromContainer).getByText('CELO')).toBeTruthy()
    expect(within(swapToContainer).getByText('cUSD')).toBeTruthy()

    act(() => {
      fireEvent.press(within(swapFromContainer).getByTestId('SwapAmountInput/TokenSelect'))
      jest.runAllTimers()
      fireEvent.press(getByTestId('cEURTouchable'))

      fireEvent.press(within(swapToContainer).getByTestId('SwapAmountInput/TokenSelect'))
      jest.runAllTimers()
      fireEvent.press(getByTestId('CELOTouchable'))
    })

    expect(within(swapFromContainer).getByText('cEUR')).toBeTruthy()
    expect(within(swapToContainer).getByText('CELO')).toBeTruthy()
  })

  it('should swap the to/from tokens if the same token is selected', () => {
    const { swapFromContainer, swapToContainer, getByTestId } = renderScreen({})

    expect(within(swapFromContainer).getByText('CELO')).toBeTruthy()
    expect(within(swapToContainer).getByText('cUSD')).toBeTruthy()

    act(() => {
      fireEvent.press(within(swapFromContainer).getByTestId('SwapAmountInput/TokenSelect'))
      jest.runAllTimers()
      fireEvent.press(getByTestId('cUSDTouchable'))
    })

    expect(within(swapFromContainer).getByText('cUSD')).toBeTruthy()
    expect(within(swapToContainer).getByText('CELO')).toBeTruthy()
  })

  it('should keep the to amount in sync with the exchange rate', () => {
    mockFetch.mockResponse(
      JSON.stringify({
        unvalidatedSwapTransaction: {
          price: '1.2345678',
        },
      })
    )
    const { swapFromContainer, swapToContainer, getByText } = renderScreen({})

    act(() => {
      fireEvent.changeText(within(swapFromContainer).getByTestId('SwapAmountInput/Input'), '1.234')
      jest.runAllTimers()
    })

    expect(getByText('1 CELO ≈ 1.23456 cUSD')).toBeTruthy()
    expect(within(swapFromContainer).getByTestId('SwapAmountInput/Input').props.value).toBe('1.234')
    expect(within(swapToContainer).getByTestId('SwapAmountInput/Input').props.value).toBe(
      '1.5234566652'
    )
    expect(getByText('swapScreen.review')).not.toBeDisabled()
  })

  it('should display a loader when initially fetching exchange rate', () => {
    mockFetch.mockResponse(
      JSON.stringify({
        unvalidatedSwapTransaction: {
          price: '1.2345678',
        },
      })
    )
    const { swapFromContainer, swapToContainer, getByText } = renderScreen({})

    act(() => {
      fireEvent.changeText(within(swapFromContainer).getByTestId('SwapAmountInput/Input'), '1.234')
      jest.runAllTimers()
    })

    expect(mockFetch.mock.calls[0][0]).toEqual(
      `${
        networkConfig.approveSwapUrl
      }?buyToken=${mockCusdAddress}&sellToken=${mockCeloAddress}&sellAmount=1234000000000000000&userAddress=${mockAccount.toLowerCase()}`
    )

    expect(getByText('1 CELO ≈ 1.23456 cUSD')).toBeTruthy()
    expect(within(swapFromContainer).getByTestId('SwapAmountInput/Input').props.value).toBe('1.234')
    expect(within(swapToContainer).getByTestId('SwapAmountInput/Input').props.value).toBe(
      '1.5234566652'
    )
    expect(getByText('swapScreen.review')).not.toBeDisabled()
  })

  it('should keep the from amount in sync with the exchange rate', () => {
    mockFetch.mockResponse(
      JSON.stringify({
        unvalidatedSwapTransaction: {
          price: '0.12345678',
        },
      })
    )
    const { swapFromContainer, swapToContainer, getByText } = renderScreen({})

    act(() => {
      fireEvent.changeText(within(swapToContainer).getByTestId('SwapAmountInput/Input'), '1.234')
      jest.runAllTimers()
    })

    expect(mockFetch.mock.calls[0][0]).toEqual(
      `${
        networkConfig.approveSwapUrl
      }?buyToken=${mockCusdAddress}&sellToken=${mockCeloAddress}&buyAmount=1234000000000000000&userAddress=${mockAccount.toLowerCase()}`
    )

    expect(getByText('1 CELO ≈ 8.10000 cUSD')).toBeTruthy()
    expect(within(swapFromContainer).getByTestId('SwapAmountInput/Input').props.value).toBe(
      '0.15234566652'
    )
    expect(within(swapToContainer).getByTestId('SwapAmountInput/Input').props.value).toBe('1.234')
    expect(getByText('swapScreen.review')).not.toBeDisabled()
  })

  it('should support from amount with comma as the decimal separator', () => {
    // This only changes the display format, the input is parsed with getNumberFormatSettings
    BigNumber.config({
      FORMAT: {
        decimalSeparator: ',',
      },
    })
    mockFetch.mockResponse(
      JSON.stringify({
        unvalidatedSwapTransaction: {
          price: '1.2345678',
        },
      })
    )
    const { swapFromContainer, swapToContainer, getByText } = renderScreen({})

    void act(() => {
      fireEvent.changeText(within(swapFromContainer).getByTestId('SwapAmountInput/Input'), '1,234')
      jest.runAllTimers()
    })

    expect(mockFetch.mock.calls[0][0]).toEqual(
      `${
        networkConfig.approveSwapUrl
      }?buyToken=${mockCusdAddress}&sellToken=${mockCeloAddress}&sellAmount=1234000000000000000&userAddress=${mockAccount.toLowerCase()}`
    )

    expect(getByText('1 CELO ≈ 1,23456 cUSD')).toBeTruthy()
    expect(within(swapFromContainer).getByTestId('SwapAmountInput/Input').props.value).toBe('1,234')
    expect(within(swapToContainer).getByTestId('SwapAmountInput/Input').props.value).toBe(
      '1,5234566652'
    )
    expect(getByText('swapScreen.review')).not.toBeDisabled()
  })

  it('should support to amount with comma as the decimal separator', () => {
    // This only changes the display format, the input is parsed with getNumberFormatSettings
    BigNumber.config({
      FORMAT: {
        decimalSeparator: ',',
      },
    })
    mockFetch.mockResponse(
      JSON.stringify({
        unvalidatedSwapTransaction: {
          price: '0.12345678',
        },
      })
    )
    const { swapFromContainer, swapToContainer, getByText } = renderScreen({})

    void act(() => {
      fireEvent.changeText(within(swapToContainer).getByTestId('SwapAmountInput/Input'), '1,234')
      jest.runAllTimers()
    })

    expect(mockFetch.mock.calls[0][0]).toEqual(
      `${
        networkConfig.approveSwapUrl
      }?buyToken=${mockCusdAddress}&sellToken=${mockCeloAddress}&buyAmount=1234000000000000000&userAddress=${mockAccount.toLowerCase()}`
    )

    expect(getByText('1 CELO ≈ 8,10000 cUSD')).toBeTruthy()
    expect(within(swapFromContainer).getByTestId('SwapAmountInput/Input').props.value).toBe(
      '0,15234566652'
    )
    expect(within(swapToContainer).getByTestId('SwapAmountInput/Input').props.value).toBe('1,234')
    expect(getByText('swapScreen.review')).not.toBeDisabled()
  })

  it('should set max from value', () => {
    mockFetch.mockResponse(
      JSON.stringify({
        unvalidatedSwapTransaction: {
          price: '1.2345678',
        },
      })
    )
    const { swapFromContainer, swapToContainer, getByText, getByTestId } = renderScreen({})

    act(() => {
      fireEvent.press(getByTestId('SwapAmountInput/MaxButton'))
      jest.runAllTimers()
    })

    expect(getByText('1 CELO ≈ 1.23456 cUSD')).toBeTruthy()
    expect(within(swapFromContainer).getByTestId('SwapAmountInput/Input').props.value).toBe(
      '10' // matching the value inside the mocked store
    )
    expect(within(swapToContainer).getByTestId('SwapAmountInput/Input').props.value).toBe(
      '12.345678'
    )
    expect(getByText('swapScreen.review')).not.toBeDisabled()
  })

  it('should set max value if it is zero', () => {
    const { swapFromContainer, swapToContainer, getByText, getByTestId } = renderScreen({
      hasZeroCeloBalance: true,
    })

    act(() => {
      fireEvent.press(getByTestId('SwapAmountInput/MaxButton'))
      jest.runAllTimers()
    })

    expect(within(swapFromContainer).getByTestId('SwapAmountInput/Input').props.value).toBe('0')
    expect(within(swapToContainer).getByTestId('SwapAmountInput/Input').props.value).toBe('')
    expect(mockFetch).not.toHaveBeenCalled()
    expect(getByText('swapScreen.review')).toBeDisabled()
  })

  it('should display an error banner if api request fails', () => {
    mockFetch.mockReject()

    const { swapFromContainer, swapToContainer, getByText, store } = renderScreen({})

    act(() => {
      fireEvent.changeText(within(swapFromContainer).getByTestId('SwapAmountInput/Input'), '1.234')
      jest.runAllTimers()
    })

    expect(within(swapToContainer).getByTestId('SwapAmountInput/Loader')).toBeTruthy()
    expect(getByText('swapScreen.review')).toBeDisabled()
    expect(store.getActions()).toEqual(
      expect.arrayContaining([showError(ErrorMessages.FETCH_SWAP_QUOTE_FAILED)])
    )
  })

  it('should be able to navigate to swap review screen', () => {
    mockFetch.mockResponse(
      JSON.stringify({
        unvalidatedSwapTransaction: {
          price: '1.2345678',
        },
      })
    )
    const { getByText, getByTestId, store } = renderScreen({})

    act(() => {
      fireEvent.press(getByTestId('SwapAmountInput/MaxButton'))
      jest.runAllTimers()
    })

    fireEvent.press(getByText('swapScreen.review'))
    expect(navigate).toHaveBeenCalledWith(Screens.SwapReviewScreen)

    expect(store.getActions()).toEqual(
      expect.arrayContaining([
        setSwapUserInput({
          toToken: mockCusdAddress,
          fromToken: mockCeloAddress,
          swapAmount: {
            [Field.FROM]: '10',
            [Field.TO]: '12.345678',
          },
          updatedField: Field.FROM,
        }),
      ])
    )
  })

  it('should be able to navigate to swap review screen when the entered value uses comma as the decimal separator', () => {
    mockFetch.mockResponse(
      JSON.stringify({
        unvalidatedSwapTransaction: {
          price: '1.2345678',
        },
      })
    )
    const { swapFromContainer, getByText, store } = renderScreen({})

    void act(() => {
      fireEvent.changeText(within(swapFromContainer).getByTestId('SwapAmountInput/Input'), '1,5')
      jest.runAllTimers()
    })

    fireEvent.press(getByText('swapScreen.review'))
    expect(navigate).toHaveBeenCalledWith(Screens.SwapReviewScreen)

    expect(store.getActions()).toEqual(
      expect.arrayContaining([
        setSwapUserInput({
          toToken: mockCusdAddress,
          fromToken: mockCeloAddress,
          swapAmount: {
            [Field.FROM]: '1.5',
            [Field.TO]: '1.8518517', // 1.5 * 1.2345678
          },
          updatedField: Field.FROM,
        }),
      ])
    )
  })
})
