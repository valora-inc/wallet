import { act, fireEvent, render, waitFor, within } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import { FetchMock } from 'jest-fetch-mock/types'
import React from 'react'
import { Provider } from 'react-redux'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { TRANSACTION_FEES_LEARN_MORE } from 'src/brandingConfig'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import SwapScreen, { SwapScreenSection } from 'src/swap/SwapScreen'
import { setSwapUserInput } from 'src/swap/slice'
import { Field } from 'src/swap/types'
import networkConfig from 'src/web3/networkConfig'
import { createMockStore } from 'test/utils'
import {
  mockAccount,
  mockCeloAddress,
  mockCeurAddress,
  mockCusdAddress,
  mockPoofAddress,
  mockTestTokenAddress,
} from 'test/values'

const mockFetch = fetch as FetchMock
const mockExperimentParams = jest.fn()

// Use comma as decimal separator for all tests here
// Input with "." will still work, but it will also work with ",".
jest.mock('react-native-localize', () => ({
  getNumberFormatSettings: () => ({
    decimalSeparator: ',',
  }),
}))

jest.mock('src/statsig', () => {
  return {
    getExperimentParams: (_: any) => mockExperimentParams(),
  }
})

const now = Date.now()

const renderScreen = ({ celoBalance = '10', cUSDBalance = '20.456', showDrawerTopNav = true }) => {
  const store = createMockStore({
    tokens: {
      tokenBalances: {
        [mockCeurAddress]: {
          address: mockCeurAddress,
          symbol: 'cEUR',
          priceFetchedAt: now,
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
          isSwappable: true,
          name: 'Celo Euro',
          balance: '0',
        },
        [mockCusdAddress]: {
          usdPrice: '1',
          isCoreToken: true,
          isSwappable: true,
          address: mockCusdAddress,
          priceFetchedAt: now,
          symbol: 'cUSD',
          imageUrl:
            'https://raw.githubusercontent.com/valora-inc/address-metadata/main/assets/tokens/cUSD.png',
          decimals: 18,
          balance: cUSDBalance,
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
          priceFetchedAt: now,
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
          isSwappable: true,
          name: 'Celo native asset',
          balance: celoBalance,
        },
        [mockTestTokenAddress]: {
          address: mockTestTokenAddress,
          symbol: 'TT',
          priceFetchedAt: now,
          decimals: 18,
          imageUrl:
            'https://raw.githubusercontent.com/valora-inc/address-metadata/main/assets/tokens/TT.png',
          isCoreToken: false,
          isSwappable: false,
          name: 'Test Token',
          balance: '100',
        },
        [mockPoofAddress]: {
          address: mockPoofAddress,
          symbol: 'POOF',
          priceFetchedAt: now,
          decimals: 18,
          imageUrl: `https://raw.githubusercontent.com/valora-inc/address-metadata/main/assets/tokens/POOF.png`,
          isCoreToken: false,
          isSwappable: true,
          name: 'Poof',
          balance: '100',
        },
      },
    },
  })

  const tree = render(
    <Provider store={store}>
      <SwapScreenSection showDrawerTopNav={showDrawerTopNav} />
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
    jest.clearAllMocks()
    mockFetch.resetMocks()

    BigNumber.config({
      FORMAT: {
        decimalSeparator: '.',
      },
    })

    mockExperimentParams.mockReturnValue({
      swappingNonNativeTokensEnabled: false,
    })
  })

  it('should display the correct elements on load', () => {
    const { getByText, swapFromContainer, swapToContainer, queryByTestId } = renderScreen({})

    expect(getByText('swapScreen.title')).toBeTruthy()
    expect(getByText('swapScreen.review')).toBeDisabled()
    expect(queryByTestId('SwapScreen/DrawerBar')).toBeTruthy()

    expect(within(swapFromContainer).getByText('swapScreen.swapFrom')).toBeTruthy()
    expect(within(swapFromContainer).getByTestId('SwapAmountInput/MaxButton')).toBeTruthy()
    expect(within(swapFromContainer).getByTestId('SwapAmountInput/TokenSelect')).toBeTruthy()
    expect(within(swapFromContainer).getByText('CELO')).toBeTruthy()

    expect(within(swapToContainer).getByText('swapScreen.swapTo')).toBeTruthy()
    expect(within(swapToContainer).getByTestId('SwapAmountInput/TokenSelect')).toBeTruthy()
    expect(within(swapToContainer).getByText('swapScreen.swapToTokenSelection')).toBeTruthy()
  })

  it('should display the token with the highest usd balance as from token', () => {
    const { swapFromContainer, swapToContainer } = renderScreen({ cUSDBalance: '1000' })

    expect(within(swapFromContainer).getByText('cUSD')).toBeTruthy()
    expect(within(swapToContainer).getByText('swapScreen.swapToTokenSelection')).toBeTruthy()
  })

  it('should allow selecting tokens', () => {
    const { swapFromContainer, swapToContainer, getByTestId } = renderScreen({})

    expect(within(swapFromContainer).getByText('CELO')).toBeTruthy()
    expect(within(swapToContainer).getByText('swapScreen.swapToTokenSelection')).toBeTruthy()

    act(() => {
      fireEvent.press(within(swapFromContainer).getByTestId('SwapAmountInput/TokenSelect'))
      jest.runOnlyPendingTimers()
      fireEvent.press(getByTestId('cEURTouchable'))

      fireEvent.press(within(swapToContainer).getByTestId('SwapAmountInput/TokenSelect'))
      jest.runOnlyPendingTimers()
      fireEvent.press(getByTestId('CELOTouchable'))
    })

    expect(within(swapFromContainer).getByText('cEUR')).toBeTruthy()
    expect(within(swapToContainer).getByText('CELO')).toBeTruthy()
  })

  it('should swap the to/from tokens if the same token is selected', () => {
    const { swapFromContainer, swapToContainer, getByTestId } = renderScreen({})

    act(() => {
      fireEvent.press(within(swapToContainer).getByTestId('SwapAmountInput/TokenSelect'))
      jest.runOnlyPendingTimers()
      fireEvent.press(getByTestId('cUSDTouchable'))
    })

    expect(within(swapFromContainer).getByText('CELO')).toBeTruthy()
    expect(within(swapToContainer).getByText('cUSD')).toBeTruthy()

    act(() => {
      fireEvent.press(within(swapFromContainer).getByTestId('SwapAmountInput/TokenSelect'))
      jest.runOnlyPendingTimers()
      fireEvent.press(getByTestId('cUSDTouchable'))
    })

    expect(within(swapFromContainer).getByText('cUSD')).toBeTruthy()
    expect(within(swapToContainer).getByText('CELO')).toBeTruthy()
  })

  it('should swap the to/from tokens even if the to token was not selected', () => {
    const { swapFromContainer, swapToContainer, getByTestId } = renderScreen({})

    expect(within(swapFromContainer).getByText('CELO')).toBeTruthy()
    expect(within(swapToContainer).getByText('swapScreen.swapToTokenSelection')).toBeTruthy()

    act(() => {
      fireEvent.press(within(swapToContainer).getByTestId('SwapAmountInput/TokenSelect'))
      jest.runOnlyPendingTimers()
      fireEvent.press(getByTestId('CELOTouchable'))
    })

    expect(within(swapFromContainer).getByText('swapScreen.swapFromTokenSelection')).toBeTruthy()
    expect(within(swapToContainer).getByText('CELO')).toBeTruthy()
  })

  it('should keep the to amount in sync with the exchange rate', async () => {
    mockFetch.mockResponse(
      JSON.stringify({
        unvalidatedSwapTransaction: {
          price: '1.2345678',
        },
      })
    )
    const { getByTestId, swapFromContainer, swapToContainer, getByText } = renderScreen({})

    act(() => {
      fireEvent.press(within(swapToContainer).getByTestId('SwapAmountInput/TokenSelect'))
      jest.runOnlyPendingTimers()
      fireEvent.press(getByTestId('cUSDTouchable'))

      fireEvent.changeText(within(swapFromContainer).getByTestId('SwapAmountInput/Input'), '1.234')
      jest.runOnlyPendingTimers()
    })

    await waitFor(() => expect(getByText('1 CELO ≈ 1.23456 cUSD')).toBeTruthy())
    expect(within(swapFromContainer).getByTestId('SwapAmountInput/Input').props.value).toBe('1.234')
    expect(within(swapToContainer).getByTestId('SwapAmountInput/Input').props.value).toBe(
      '1.5234566652'
    )
    expect(getByText('swapScreen.review')).not.toBeDisabled()
  })

  it('should display a loader when initially fetching exchange rate', async () => {
    mockFetch.mockResponse(
      JSON.stringify({
        unvalidatedSwapTransaction: {
          price: '1.2345678',
        },
      })
    )
    const { getByTestId, swapFromContainer, swapToContainer, getByText } = renderScreen({})

    act(() => {
      fireEvent.press(within(swapToContainer).getByTestId('SwapAmountInput/TokenSelect'))
      jest.runOnlyPendingTimers()
      fireEvent.press(getByTestId('cUSDTouchable'))

      fireEvent.changeText(within(swapFromContainer).getByTestId('SwapAmountInput/Input'), '1.234')
      jest.runOnlyPendingTimers()
    })

    await waitFor(() => expect(mockFetch.mock.calls.length).toEqual(1))
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

  it('should keep the from amount in sync with the exchange rate', async () => {
    mockFetch.mockResponse(
      JSON.stringify({
        unvalidatedSwapTransaction: {
          price: '0.12345678',
        },
      })
    )
    const { getByTestId, swapFromContainer, swapToContainer, getByText } = renderScreen({})

    act(() => {
      fireEvent.press(within(swapToContainer).getByTestId('SwapAmountInput/TokenSelect'))
      jest.runOnlyPendingTimers()
      fireEvent.press(getByTestId('cUSDTouchable'))

      fireEvent.changeText(within(swapToContainer).getByTestId('SwapAmountInput/Input'), '1.234')
      jest.runOnlyPendingTimers()
    })

    await waitFor(() => expect(mockFetch.mock.calls.length).toEqual(1))
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

  it('should support from amount with comma as the decimal separator', async () => {
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
    const { getByTestId, swapFromContainer, swapToContainer, getByText } = renderScreen({})

    act(() => {
      fireEvent.press(within(swapToContainer).getByTestId('SwapAmountInput/TokenSelect'))
      jest.runOnlyPendingTimers()
      fireEvent.press(getByTestId('cUSDTouchable'))

      fireEvent.changeText(within(swapFromContainer).getByTestId('SwapAmountInput/Input'), '1,234')
      jest.runOnlyPendingTimers()
    })

    await waitFor(() => expect(mockFetch.mock.calls.length).toEqual(1))
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

  it('should support to amount with comma as the decimal separator', async () => {
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
    const { getByTestId, swapFromContainer, swapToContainer, getByText } = renderScreen({})

    act(() => {
      fireEvent.press(within(swapToContainer).getByTestId('SwapAmountInput/TokenSelect'))
      jest.runOnlyPendingTimers()
      fireEvent.press(getByTestId('cUSDTouchable'))

      fireEvent.changeText(within(swapToContainer).getByTestId('SwapAmountInput/Input'), '1,234')
      jest.runOnlyPendingTimers()
    })

    await waitFor(() => expect(mockFetch.mock.calls.length).toEqual(1))
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

  it('should set max from value', async () => {
    mockFetch.mockResponse(
      JSON.stringify({
        unvalidatedSwapTransaction: {
          price: '1.2345678',
        },
      })
    )
    const { swapFromContainer, swapToContainer, getByText, getByTestId } = renderScreen({})

    act(() => {
      fireEvent.press(within(swapToContainer).getByTestId('SwapAmountInput/TokenSelect'))
      jest.runOnlyPendingTimers()
      fireEvent.press(getByTestId('cUSDTouchable'))

      fireEvent.press(getByTestId('SwapAmountInput/MaxButton'))
      jest.runOnlyPendingTimers()
    })

    await waitFor(() => expect(getByText('1 CELO ≈ 1.23456 cUSD')).toBeTruthy())
    expect(within(swapFromContainer).getByTestId('SwapAmountInput/Input').props.value).toBe(
      '10' // matching the value inside the mocked store
    )
    expect(within(swapToContainer).getByTestId('SwapAmountInput/Input').props.value).toBe(
      '12.345678'
    )
    expect(getByText('swapScreen.review')).not.toBeDisabled()
  })

  it('should show and hide the max warning', async () => {
    mockFetch.mockResponse(
      JSON.stringify({
        unvalidatedSwapTransaction: {
          price: '1.2345678',
        },
      })
    )
    const { swapFromContainer, getByText, getByTestId, queryByText } = renderScreen({})

    act(() => {
      fireEvent.press(getByTestId('SwapAmountInput/MaxButton'))
      jest.runOnlyPendingTimers()
    })
    expect(getByText('swapScreen.maxSwapAmountWarning.body')).toBeTruthy()

    fireEvent.press(getByText('swapScreen.maxSwapAmountWarning.learnMore'))
    expect(navigate).toHaveBeenCalledWith(Screens.WebViewScreen, {
      uri: TRANSACTION_FEES_LEARN_MORE,
    })

    act(() => {
      fireEvent.changeText(within(swapFromContainer).getByTestId('SwapAmountInput/Input'), '1.234')
      jest.runOnlyPendingTimers()
    })
    expect(queryByText('swapScreen.maxSwapAmountWarning.body')).toBeFalsy()
  })

  it('should fetch the quote if the amount is cleared and re-entered', async () => {
    mockFetch.mockResponse(
      JSON.stringify({
        unvalidatedSwapTransaction: {
          price: '1.2345678',
        },
      })
    )
    const { swapFromContainer, swapToContainer, getByText, getByTestId } = renderScreen({})

    act(() => {
      fireEvent.press(within(swapToContainer).getByTestId('SwapAmountInput/TokenSelect'))
      jest.runOnlyPendingTimers()
      fireEvent.press(getByTestId('cUSDTouchable'))

      fireEvent.press(getByTestId('SwapAmountInput/MaxButton'))
      jest.runOnlyPendingTimers()
    })

    await waitFor(() => expect(mockFetch.mock.calls.length).toEqual(1))
    expect(getByText('swapScreen.review')).not.toBeDisabled()

    act(() => {
      fireEvent.changeText(within(swapFromContainer).getByTestId('SwapAmountInput/Input'), '')
      jest.runAllTimers()
    })

    expect(within(swapFromContainer).getByTestId('SwapAmountInput/Input').props.value).toBe('')
    expect(within(swapToContainer).getByTestId('SwapAmountInput/Input').props.value).toBe('')
    expect(getByText('swapScreen.review')).toBeDisabled()
    expect(mockFetch.mock.calls.length).toEqual(1)

    act(() => {
      fireEvent.press(getByTestId('SwapAmountInput/MaxButton'))
      jest.runOnlyPendingTimers()
    })

    await waitFor(() => expect(getByText('1 CELO ≈ 1.23456 cUSD')).toBeTruthy())
    expect(within(swapFromContainer).getByTestId('SwapAmountInput/Input').props.value).toBe(
      '10' // matching the value inside the mocked store
    )
    expect(within(swapToContainer).getByTestId('SwapAmountInput/Input').props.value).toBe(
      '12.345678'
    )
    expect(getByText('swapScreen.review')).not.toBeDisabled()
    expect(mockFetch.mock.calls.length).toEqual(2)
  })

  it('should set max value if it is zero', () => {
    const { swapFromContainer, swapToContainer, getByText, getByTestId } = renderScreen({
      celoBalance: '0',
      cUSDBalance: '0',
    })

    act(() => {
      fireEvent.press(within(swapToContainer).getByTestId('SwapAmountInput/TokenSelect'))
      jest.runOnlyPendingTimers()
      fireEvent.press(getByTestId('cUSDTouchable'))

      fireEvent.press(getByTestId('SwapAmountInput/MaxButton'))
      jest.runOnlyPendingTimers()
    })

    expect(within(swapFromContainer).getByTestId('SwapAmountInput/Input').props.value).toBe('0')
    expect(within(swapToContainer).getByTestId('SwapAmountInput/Input').props.value).toBe('')
    expect(mockFetch).not.toHaveBeenCalled()
    expect(getByText('swapScreen.review')).toBeDisabled()
  })

  it('should display an error banner if api request fails', async () => {
    mockFetch.mockReject()

    const { swapFromContainer, swapToContainer, getByText, store, getByTestId } = renderScreen({})

    act(() => {
      fireEvent.press(within(swapToContainer).getByTestId('SwapAmountInput/TokenSelect'))
      jest.runOnlyPendingTimers()
      fireEvent.press(getByTestId('cUSDTouchable'))

      fireEvent.changeText(within(swapFromContainer).getByTestId('SwapAmountInput/Input'), '1.234')
      jest.runOnlyPendingTimers()
    })

    await waitFor(() =>
      expect(within(swapToContainer).getByTestId('SwapAmountInput/Loader')).toBeTruthy()
    )
    expect(getByText('swapScreen.review')).toBeDisabled()
    expect(store.getActions()).toEqual(
      expect.arrayContaining([showError(ErrorMessages.FETCH_SWAP_QUOTE_FAILED)])
    )
  })

  it('should be able to navigate to swap review screen', async () => {
    mockFetch.mockResponse(
      JSON.stringify({
        unvalidatedSwapTransaction: {
          price: '1.2345678',
        },
      })
    )
    const { getByText, getByTestId, store, swapToContainer } = renderScreen({})

    act(() => {
      fireEvent.press(within(swapToContainer).getByTestId('SwapAmountInput/TokenSelect'))
      jest.runOnlyPendingTimers()
      fireEvent.press(getByTestId('cUSDTouchable'))

      fireEvent.press(getByTestId('SwapAmountInput/MaxButton'))
      jest.runOnlyPendingTimers()
    })

    await waitFor(() => expect(getByText('swapScreen.review')).not.toBeDisabled())
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

  it('should be able to navigate to swap review screen when the entered value uses comma as the decimal separator', async () => {
    mockFetch.mockResponse(
      JSON.stringify({
        unvalidatedSwapTransaction: {
          price: '1.2345678',
        },
      })
    )
    const { getByTestId, swapToContainer, swapFromContainer, getByText, store } = renderScreen({})

    act(() => {
      fireEvent.press(within(swapToContainer).getByTestId('SwapAmountInput/TokenSelect'))
      jest.runOnlyPendingTimers()
      fireEvent.press(getByTestId('cUSDTouchable'))

      fireEvent.changeText(within(swapFromContainer).getByTestId('SwapAmountInput/Input'), '1,5')
      jest.runOnlyPendingTimers()
    })

    await waitFor(() => expect(getByText('swapScreen.review')).not.toBeDisabled())
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

  it('should show swappable tokens and search box when the swapping non native tokens experiment is enabled', async () => {
    mockExperimentParams.mockReturnValue({
      swappingNonNativeTokensEnabled: true,
    })

    const { swapToContainer, getByPlaceholderText, queryByTestId } = renderScreen({})
    act(() => {
      fireEvent.press(within(swapToContainer).getByTestId('SwapAmountInput/TokenSelect'))
      jest.runOnlyPendingTimers()
    })

    expect(getByPlaceholderText('tokenBottomSheet.searchAssets')).toBeTruthy()
    expect(queryByTestId('cUSDTouchable')).toBeTruthy()
    expect(queryByTestId('cEURTouchable')).toBeTruthy()
    expect(queryByTestId('POOFTouchable')).toBeTruthy()
    expect(queryByTestId('CELOTouchable')).toBeTruthy()
    expect(queryByTestId('TTTouchable')).toBeNull()
  })

  it('should be able to hide top drawer nav when parameter is set', () => {
    const { getByText, swapFromContainer, swapToContainer, queryByTestId } = renderScreen({
      showDrawerTopNav: false,
    })

    expect(queryByTestId('SwapScreen/DrawerBar')).toBeFalsy()
    expect(getByText('swapScreen.review')).toBeDisabled()

    expect(within(swapFromContainer).getByText('swapScreen.swapFrom')).toBeTruthy()
    expect(within(swapFromContainer).getByTestId('SwapAmountInput/MaxButton')).toBeTruthy()
    expect(within(swapFromContainer).getByTestId('SwapAmountInput/TokenSelect')).toBeTruthy()
    expect(within(swapFromContainer).getByText('CELO')).toBeTruthy()

    expect(within(swapToContainer).getByText('swapScreen.swapTo')).toBeTruthy()
    expect(within(swapToContainer).getByTestId('SwapAmountInput/TokenSelect')).toBeTruthy()
    expect(within(swapToContainer).getByText('swapScreen.swapToTokenSelection')).toBeTruthy()
  })
  it('SwapScreen component renders the top drawer', () => {
    const { queryByTestId } = render(
      <Provider store={createMockStore()}>
        <SwapScreen />
      </Provider>
    )

    expect(queryByTestId('SwapScreen/DrawerBar')).toBeTruthy()
  })
})
