import { act, fireEvent, render, waitFor, within } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import { FetchMock } from 'jest-fetch-mock/types'
import React from 'react'
import { Provider } from 'react-redux'
import { ReactTestInstance } from 'react-test-renderer'
import { showError } from 'src/alert/actions'
import { SwapEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { TRANSACTION_FEES_LEARN_MORE } from 'src/brandingConfig'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import SwapScreen from 'src/swap/SwapScreen'
import { swapStart, swapStartPrepared } from 'src/swap/slice'
import { Field } from 'src/swap/types'
import { NetworkId } from 'src/transactions/types'
import { SerializableTransactionRequest } from 'src/viem/preparedTransactionSerialization'
import networkConfig from 'src/web3/networkConfig'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'
import {
  mockAccount,
  mockCeloAddress,
  mockCeloTokenId,
  mockCeurAddress,
  mockCeurTokenId,
  mockCusdAddress,
  mockCusdTokenId,
  mockPoofAddress,
  mockPoofTokenId,
  mockTestTokenAddress,
  mockTestTokenTokenId,
} from 'test/values'

const mockFetch = fetch as FetchMock
const mockExperimentParams = jest.fn()
const mockGetNumberFormatSettings = jest.fn()

// Use comma as decimal separator for all tests here
// Input with "." will still work, but it will also work with ",".
jest.mock('react-native-localize', () => ({
  getNumberFormatSettings: () => mockGetNumberFormatSettings(),
}))

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

jest.mock('src/statsig', () => {
  return {
    getExperimentParams: (_: any) => mockExperimentParams(),
    getFeatureGate: jest.fn(),
    getDynamicConfigParams: () => ({
      maxSlippagePercentage: '0.3',
      showSwap: ['celo-alfajores'],
    }),
  }
})

jest.mock('viem/actions', () => ({
  ...jest.requireActual('viem/actions'),
  estimateGas: jest.fn(async () => BigInt(21000)),
}))

jest.mock('src/viem/estimateFeesPerGas', () => ({
  estimateFeesPerGas: jest.fn(async () => ({
    maxFeePerGas: BigInt(12000000000),
    maxPriorityFeePerGas: BigInt(2000000000),
  })),
}))

const now = Date.now()

const renderScreen = ({
  celoBalance = '10',
  cUSDBalance = '20.456',
  fromTokenId = undefined,
}: {
  celoBalance?: string
  cUSDBalance?: string
  fromTokenId?: string
}) => {
  const store = createMockStore({
    tokens: {
      tokenBalances: {
        [mockCeurTokenId]: {
          address: mockCeurAddress,
          tokenId: mockCeurTokenId,
          networkId: NetworkId['celo-alfajores'],
          symbol: 'cEUR',
          priceFetchedAt: now,
          historicalPricesUsd: {
            lastDay: {
              at: 1658057880747,
              price: '5.03655958698530226301',
            },
          },
          priceUsd: '5.03655958698530226301',
          decimals: 18,
          imageUrl:
            'https://raw.githubusercontent.com/valora-inc/address-metadata/main/assets/tokens/cEUR.png',
          isCoreToken: true,
          isSwappable: true,
          name: 'Celo Euro',
          balance: '0',
        },
        [mockCusdTokenId]: {
          priceUsd: '1',
          isCoreToken: true,
          isSwappable: true,
          address: mockCusdAddress,
          tokenId: mockCusdTokenId,
          networkId: NetworkId['celo-alfajores'],
          priceFetchedAt: now,
          symbol: 'cUSD',
          imageUrl:
            'https://raw.githubusercontent.com/valora-inc/address-metadata/main/assets/tokens/cUSD.png',
          decimals: 18,
          balance: cUSDBalance,
          historicalPricesUsd: {
            lastDay: {
              at: 1658057880747,
              price: '1',
            },
          },
          name: 'Celo Dollar',
        },
        [mockCeloTokenId]: {
          address: mockCeloAddress,
          tokenId: mockCeloTokenId,
          networkId: NetworkId['celo-alfajores'],
          symbol: 'CELO',
          priceFetchedAt: now,
          historicalPricesUsd: {
            lastDay: {
              at: 1658057880747,
              price: '13.05584965485329753569',
            },
          },
          priceUsd: '13.05584965485329753569',
          decimals: 18,
          imageUrl:
            'https://raw.githubusercontent.com/valora-inc/address-metadata/main/assets/tokens/CELO.png',
          isNative: true,
          isCoreToken: true,
          isSwappable: true,
          name: 'Celo native asset',
          balance: celoBalance,
        },
        [mockTestTokenTokenId]: {
          // no priceUsd
          address: mockTestTokenAddress,
          tokenId: mockTestTokenTokenId,
          networkId: NetworkId['celo-alfajores'],
          symbol: 'TT',
          decimals: 18,
          imageUrl:
            'https://raw.githubusercontent.com/valora-inc/address-metadata/main/assets/tokens/TT.png',
          isCoreToken: false,
          isSwappable: false,
          name: 'Test Token',
          balance: '100',
        },
        [mockPoofTokenId]: {
          // no priceUsd
          address: mockPoofAddress,
          tokenId: mockPoofTokenId,
          networkId: NetworkId['celo-alfajores'],
          symbol: 'POOF',
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
      <MockedNavigator component={SwapScreen} params={{ fromTokenId }} />
    </Provider>
  )
  const [swapFromContainer, swapToContainer] = tree.getAllByTestId('SwapAmountInput')
  const tokenBottomSheet = tree.getByTestId('TokenBottomSheet')

  return {
    ...tree,
    store,
    swapFromContainer,
    swapToContainer,
    tokenBottomSheet,
  }
}

const defaultQuote = {
  unvalidatedSwapTransaction: {
    price: '1.2345678',
    guaranteedPrice: '1.1234567',
    sellTokenAddress: mockCeloAddress,
    buyTokenAddress: mockCusdAddress,
    sellAmount: '1234000000000000000',
    buyAmount: '1523456665200000000',
    allowanceTarget: '0x0000000000000000000000000000000000000123',
    from: mockAccount,
    to: '0x0000000000000000000000000000000000000123',
    value: '0',
    data: '0x0',
    gas: '1800000',
    gasPrice: '500000000',
    estimatedPriceImpact: '0.1',
  },
  details: {
    swapProvider: 'someProvider',
  },
}
const defaultQuoteResponse = JSON.stringify(defaultQuote)

const preparedTransactions: SerializableTransactionRequest[] = [
  {
    data: '0x095ea7b3000000000000000000000000000000000000000000000000000000000000012300000000000000000000000000000000000000000000000011200c7644d50000',
    from: '0x0000000000000000000000000000000000007E57',
    gas: '21000',
    maxFeePerGas: '12000000000',
    maxPriorityFeePerGas: '2000000000',
    to: '0xf194afdf50b03e69bd7d057c1aa9e10c9954e4c9',
  },
  {
    data: '0x0',
    from: '0x0000000000000000000000000000000000007E57',
    gas: '1800000',
    maxFeePerGas: '12000000000',
    maxPriorityFeePerGas: '2000000000',
    to: '0x0000000000000000000000000000000000000123',
    value: '0',
  },
]

const selectToken = (
  swapAmountContainer: ReactTestInstance,
  tokenSymbol: string,
  tokenBottomSheet: ReactTestInstance
) => {
  const tokenSymbolNameMap: Record<string, string> = {
    cUSD: 'Celo Dollar',
    cEUR: 'Celo Euro',
    CELO: 'Celo native asset',
    POOF: 'Poof',
  }
  fireEvent.press(within(swapAmountContainer).getByTestId('SwapAmountInput/TokenSelect'))
  fireEvent.press(within(tokenBottomSheet).getByText(tokenSymbolNameMap[tokenSymbol]))

  expect(within(swapAmountContainer).getByText(tokenSymbol)).toBeTruthy()
}

describe('SwapScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.resetMocks()

    mockGetNumberFormatSettings.mockReturnValue({ decimalSeparator: '.' })
    BigNumber.config({
      FORMAT: {
        decimalSeparator: '.',
      },
    })

    mockExperimentParams.mockReturnValue({
      swapBuyAmountEnabled: true,
    })
  })

  it('should display the correct elements on load', () => {
    const { getByText, swapFromContainer, swapToContainer } = renderScreen({})

    expect(getByText('swapScreen.title')).toBeTruthy()
    expect(getByText('swapScreen.confirmSwap')).toBeDisabled()

    expect(within(swapFromContainer).getByText('swapScreen.swapFrom')).toBeTruthy()
    expect(within(swapFromContainer).getByTestId('SwapAmountInput/MaxButton')).toBeTruthy()
    expect(within(swapFromContainer).getByTestId('SwapAmountInput/TokenSelect')).toBeTruthy()
    expect(within(swapFromContainer).getByText('swapScreen.swapFromTokenSelection')).toBeTruthy()

    expect(within(swapToContainer).getByText('swapScreen.swapTo')).toBeTruthy()
    expect(within(swapToContainer).getByTestId('SwapAmountInput/TokenSelect')).toBeTruthy()
    expect(within(swapToContainer).getByText('swapScreen.swapToTokenSelection')).toBeTruthy()
  })

  it('should display the token set via fromTokenId prop', () => {
    const { swapFromContainer, swapToContainer } = renderScreen({ fromTokenId: mockCeurTokenId })

    expect(within(swapFromContainer).getByText('cEUR')).toBeTruthy()
    expect(within(swapToContainer).getByText('swapScreen.swapToTokenSelection')).toBeTruthy()
  })

  it('should allow selecting tokens', async () => {
    const { swapFromContainer, swapToContainer, tokenBottomSheet } = renderScreen({})

    expect(within(swapFromContainer).getByText('swapScreen.swapFromTokenSelection')).toBeTruthy()
    expect(within(swapToContainer).getByText('swapScreen.swapToTokenSelection')).toBeTruthy()

    selectToken(swapFromContainer, 'cEUR', tokenBottomSheet)
    selectToken(swapToContainer, 'CELO', tokenBottomSheet)
  })

  it('should swap the to/from tokens if the same token is selected', async () => {
    const { swapFromContainer, swapToContainer, tokenBottomSheet } = renderScreen({})

    selectToken(swapFromContainer, 'CELO', tokenBottomSheet)
    selectToken(swapToContainer, 'cUSD', tokenBottomSheet)
    selectToken(swapFromContainer, 'cUSD', tokenBottomSheet)

    expect(within(swapFromContainer).getByText('cUSD')).toBeTruthy()
    expect(within(swapToContainer).getByText('CELO')).toBeTruthy()
  })

  it('should swap the to/from tokens even if the to token was not selected', async () => {
    const { swapFromContainer, swapToContainer, tokenBottomSheet } = renderScreen({})

    selectToken(swapFromContainer, 'CELO', tokenBottomSheet)
    selectToken(swapToContainer, 'CELO', tokenBottomSheet)

    expect(within(swapFromContainer).getByText('swapScreen.swapFromTokenSelection')).toBeTruthy()
    expect(within(swapToContainer).getByText('CELO')).toBeTruthy()
  })

  it('should keep the to amount in sync with the exchange rate', async () => {
    mockFetch.mockResponse(defaultQuoteResponse)
    const { swapFromContainer, swapToContainer, tokenBottomSheet, getByText, getByTestId } =
      renderScreen({})

    selectToken(swapFromContainer, 'CELO', tokenBottomSheet)
    selectToken(swapToContainer, 'cUSD', tokenBottomSheet)

    fireEvent.changeText(within(swapFromContainer).getByTestId('SwapAmountInput/Input'), '1.234')

    await act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(getByTestId('SwapTransactionDetails/ExchangeRate')).toHaveTextContent(
      '1 CELO ≈ 1.23456 cUSD'
    )
    expect(within(swapFromContainer).getByTestId('SwapAmountInput/Input').props.value).toBe('1.234')
    expect(within(swapFromContainer).getByTestId('SwapAmountInput/FiatValue')).toHaveTextContent(
      '~₱21.43'
    )
    expect(within(swapToContainer).getByTestId('SwapAmountInput/Input').props.value).toBe(
      '1.5234566652'
    )
    expect(within(swapToContainer).getByTestId('SwapAmountInput/FiatValue')).toHaveTextContent(
      '~₱2.03'
    )
    expect(getByText('swapScreen.confirmSwap')).not.toBeDisabled()
  })

  it('should display a loader when initially fetching exchange rate', async () => {
    mockFetch.mockResponse(defaultQuoteResponse)
    const { tokenBottomSheet, swapFromContainer, swapToContainer, getByText, getByTestId } =
      renderScreen({})

    selectToken(swapFromContainer, 'CELO', tokenBottomSheet)
    selectToken(swapToContainer, 'cUSD', tokenBottomSheet)
    fireEvent.changeText(within(swapFromContainer).getByTestId('SwapAmountInput/Input'), '1.234')

    await act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(mockFetch.mock.calls.length).toEqual(1)
    expect(mockFetch.mock.calls[0][0]).toEqual(
      `${
        networkConfig.approveSwapUrl
      }?buyToken=${mockCusdAddress}&sellToken=${mockCeloAddress}&sellAmount=1234000000000000000&userAddress=${mockAccount.toLowerCase()}&slippagePercentage=0.3`
    )

    expect(getByTestId('SwapTransactionDetails/ExchangeRate')).toHaveTextContent(
      '1 CELO ≈ 1.23456 cUSD'
    )
    expect(within(swapFromContainer).getByTestId('SwapAmountInput/Input').props.value).toBe('1.234')
    expect(within(swapToContainer).getByTestId('SwapAmountInput/Input').props.value).toBe(
      '1.5234566652'
    )
    expect(getByText('swapScreen.confirmSwap')).not.toBeDisabled()
  })

  it('should keep the from amount in sync with the exchange rate', async () => {
    mockFetch.mockResponse(
      JSON.stringify({
        ...defaultQuote,
        unvalidatedSwapTransaction: {
          ...defaultQuote.unvalidatedSwapTransaction,
          price: '0.12345678',
        },
      })
    )
    const { tokenBottomSheet, swapFromContainer, swapToContainer, getByText, getByTestId } =
      renderScreen({})

    selectToken(swapFromContainer, 'CELO', tokenBottomSheet)
    selectToken(swapToContainer, 'cUSD', tokenBottomSheet)
    fireEvent.changeText(within(swapToContainer).getByTestId('SwapAmountInput/Input'), '1.234')

    await act(() => {
      jest.runOnlyPendingTimers()
    })
    expect(mockFetch.mock.calls.length).toEqual(1)
    expect(mockFetch.mock.calls[0][0]).toEqual(
      `${
        networkConfig.approveSwapUrl
      }?buyToken=${mockCusdAddress}&sellToken=${mockCeloAddress}&buyAmount=1234000000000000000&userAddress=${mockAccount.toLowerCase()}&slippagePercentage=0.3`
    )

    expect(getByTestId('SwapTransactionDetails/ExchangeRate')).toHaveTextContent(
      '1 CELO ≈ 8.10000 cUSD'
    )
    expect(within(swapFromContainer).getByTestId('SwapAmountInput/Input').props.value).toBe(
      '0.15234566652'
    )
    expect(within(swapToContainer).getByTestId('SwapAmountInput/Input').props.value).toBe('1.234')
    expect(getByText('swapScreen.confirmSwap')).not.toBeDisabled()
  })

  it('should show and hide the price impact warning', async () => {
    // mock priceUsd data: CELO price ~$13, cUSD price = $1
    const lowPriceImpactPrice = '13.12345' // within 4% price impact
    const highPriceImpactPrice = '12.44445' // more than 4% price impact

    const lowPriceImpact = '1.88' // within 4% price impact
    const highPriceImpact = '5.2' // more than 4% price impact

    mockFetch.mockResponseOnce(
      JSON.stringify({
        ...defaultQuote,
        unvalidatedSwapTransaction: {
          ...defaultQuote.unvalidatedSwapTransaction,
          price: highPriceImpactPrice,
          estimatedPriceImpact: highPriceImpact,
        },
      })
    )
    mockFetch.mockResponseOnce(
      JSON.stringify({
        ...defaultQuote,
        unvalidatedSwapTransaction: {
          ...defaultQuote.unvalidatedSwapTransaction,
          price: lowPriceImpactPrice,
          estimatedPriceImpact: lowPriceImpact,
        },
      })
    )

    const {
      swapFromContainer,
      swapToContainer,
      tokenBottomSheet,
      getByText,
      queryByText,
      getByTestId,
    } = renderScreen({})

    // select 100000 CELO to cUSD swap
    selectToken(swapFromContainer, 'CELO', tokenBottomSheet)
    selectToken(swapToContainer, 'cUSD', tokenBottomSheet)
    fireEvent.changeText(within(swapFromContainer).getByTestId('SwapAmountInput/Input'), '100000')
    await act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(getByTestId('SwapTransactionDetails/ExchangeRate')).toHaveTextContent(
      '1 CELO ≈ 12.44445 cUSD'
    )
    expect(getByText('swapScreen.priceImpactWarning.title')).toBeTruthy()
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      SwapEvents.swap_price_impact_warning_displayed,
      {
        toToken: '0x874069fa1eb16d44d622f2e0ca25eea172369bc1',
        fromToken: '0xf194afdf50b03e69bd7d057c1aa9e10c9954e4c9',
        amount: '100000',
        amountType: 'sellAmount',
        priceImpact: '0.052',
        provider: 'someProvider',
      }
    )

    // select 100 CELO to cUSD swap
    fireEvent.changeText(within(swapFromContainer).getByTestId('SwapAmountInput/Input'), '100')
    await act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(getByTestId('SwapTransactionDetails/ExchangeRate')).toHaveTextContent(
      '1 CELO ≈ 13.12345 cUSD'
    )
    expect(queryByText('swapScreen.priceImpactWarning.title')).toBeFalsy()
  })

  it('should show and hide the missing price impact warning', async () => {
    const lowPriceImpactPrice = '13.12345'
    const highPriceImpactPrice = '12.44445'

    mockFetch.mockResponseOnce(
      JSON.stringify({
        ...defaultQuote,
        unvalidatedSwapTransaction: {
          ...defaultQuote.unvalidatedSwapTransaction,
          price: highPriceImpactPrice,
          estimatedPriceImpact: null,
        },
      })
    )
    mockFetch.mockResponseOnce(
      JSON.stringify({
        ...defaultQuote,
        unvalidatedSwapTransaction: {
          ...defaultQuote.unvalidatedSwapTransaction,
          price: lowPriceImpactPrice,
          estimatedPriceImpact: '2.3',
        },
      })
    )

    const {
      tokenBottomSheet,
      swapFromContainer,
      swapToContainer,
      getByText,
      queryByText,
      getByTestId,
    } = renderScreen({})

    // select 100000 CELO to cUSD swap
    selectToken(swapFromContainer, 'CELO', tokenBottomSheet)
    selectToken(swapToContainer, 'cUSD', tokenBottomSheet)
    fireEvent.changeText(within(swapFromContainer).getByTestId('SwapAmountInput/Input'), '100000')
    await act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(getByTestId('SwapTransactionDetails/ExchangeRate')).toHaveTextContent(
      '1 CELO ≈ 12.44445 cUSD'
    )
    expect(getByText('swapScreen.missingSwapImpactWarning.title')).toBeTruthy()
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      SwapEvents.swap_price_impact_warning_displayed,
      {
        toToken: '0x874069fa1eb16d44d622f2e0ca25eea172369bc1',
        fromToken: '0xf194afdf50b03e69bd7d057c1aa9e10c9954e4c9',
        amount: '100000',
        amountType: 'sellAmount',
        priceImpact: undefined,
        provider: 'someProvider',
      }
    )

    // select 100 CELO to cUSD swap
    fireEvent.changeText(within(swapFromContainer).getByTestId('SwapAmountInput/Input'), '100')
    await act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(getByTestId('SwapTransactionDetails/ExchangeRate')).toHaveTextContent(
      '1 CELO ≈ 13.12345 cUSD'
    )
    expect(queryByText('swapScreen.missingSwapImpactWarning.title')).toBeFalsy()
  })

  it('should prioritise showing the price impact warning when there is no priceUsd for a token', async () => {
    mockFetch.mockResponseOnce(
      JSON.stringify({
        ...defaultQuote,
        unvalidatedSwapTransaction: {
          ...defaultQuote.unvalidatedSwapTransaction,
          estimatedPriceImpact: 5, // above warning threshold
        },
      })
    )

    const {
      tokenBottomSheet,
      swapFromContainer,
      swapToContainer,
      getByText,
      queryByText,
      getByTestId,
    } = renderScreen({})

    selectToken(swapFromContainer, 'CELO', tokenBottomSheet)
    selectToken(swapToContainer, 'POOF', tokenBottomSheet) // no priceUsd
    fireEvent.changeText(within(swapFromContainer).getByTestId('SwapAmountInput/Input'), '100')
    await act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(getByTestId('SwapTransactionDetails/ExchangeRate')).toHaveTextContent(
      '1 CELO ≈ 1.23456 POOF'
    )
    expect(getByText('swapScreen.priceImpactWarning.title')).toBeTruthy()
    expect(queryByText('swapScreen.missingSwapImpactWarning.title')).toBeFalsy()
  })

  it('should support from amount with comma as the decimal separator', async () => {
    // This only changes the display format, the input is parsed with getNumberFormatSettings
    BigNumber.config({
      FORMAT: {
        decimalSeparator: ',',
      },
    })
    mockGetNumberFormatSettings.mockReturnValue({ decimalSeparator: ',' })
    mockFetch.mockResponse(defaultQuoteResponse)
    const { tokenBottomSheet, swapFromContainer, swapToContainer, getByText, getByTestId } =
      renderScreen({})

    selectToken(swapFromContainer, 'CELO', tokenBottomSheet)
    selectToken(swapToContainer, 'cUSD', tokenBottomSheet)
    fireEvent.changeText(within(swapFromContainer).getByTestId('SwapAmountInput/Input'), '1,234')

    await act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(mockFetch.mock.calls.length).toEqual(1)
    expect(mockFetch.mock.calls[0][0]).toEqual(
      `${
        networkConfig.approveSwapUrl
      }?buyToken=${mockCusdAddress}&sellToken=${mockCeloAddress}&sellAmount=1234000000000000000&userAddress=${mockAccount.toLowerCase()}&slippagePercentage=0.3`
    )

    expect(getByTestId('SwapTransactionDetails/ExchangeRate')).toHaveTextContent(
      '1 CELO ≈ 1,23456 cUSD'
    )
    expect(within(swapFromContainer).getByTestId('SwapAmountInput/Input').props.value).toBe('1,234')
    expect(within(swapToContainer).getByTestId('SwapAmountInput/Input').props.value).toBe(
      '1,5234566652'
    )
    expect(getByText('swapScreen.confirmSwap')).not.toBeDisabled()
  })

  it('should support to amount with comma as the decimal separator', async () => {
    // This only changes the display format, the input is parsed with getNumberFormatSettings
    BigNumber.config({
      FORMAT: {
        decimalSeparator: ',',
      },
    })
    mockGetNumberFormatSettings.mockReturnValue({ decimalSeparator: ',' })
    mockFetch.mockResponse(
      JSON.stringify({
        ...defaultQuote,
        unvalidatedSwapTransaction: {
          ...defaultQuote.unvalidatedSwapTransaction,
          price: '0.12345678',
        },
      })
    )
    const { tokenBottomSheet, swapFromContainer, swapToContainer, getByText, getByTestId } =
      renderScreen({})

    selectToken(swapFromContainer, 'CELO', tokenBottomSheet)
    selectToken(swapToContainer, 'cUSD', tokenBottomSheet)
    fireEvent.changeText(within(swapToContainer).getByTestId('SwapAmountInput/Input'), '1,234')

    await act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(mockFetch.mock.calls.length).toEqual(1)
    expect(mockFetch.mock.calls[0][0]).toEqual(
      `${
        networkConfig.approveSwapUrl
      }?buyToken=${mockCusdAddress}&sellToken=${mockCeloAddress}&buyAmount=1234000000000000000&userAddress=${mockAccount.toLowerCase()}&slippagePercentage=0.3`
    )

    expect(getByTestId('SwapTransactionDetails/ExchangeRate')).toHaveTextContent(
      '1 CELO ≈ 8,10000 cUSD'
    )
    expect(within(swapFromContainer).getByTestId('SwapAmountInput/Input').props.value).toBe(
      '0,15234566652'
    )
    expect(within(swapToContainer).getByTestId('SwapAmountInput/Input').props.value).toBe('1,234')
    expect(getByText('swapScreen.confirmSwap')).not.toBeDisabled()
  })

  it('should set max from value', async () => {
    mockFetch.mockResponse(defaultQuoteResponse)
    const { swapFromContainer, swapToContainer, getByText, getByTestId, tokenBottomSheet } =
      renderScreen({})

    selectToken(swapFromContainer, 'CELO', tokenBottomSheet)
    selectToken(swapToContainer, 'cUSD', tokenBottomSheet)
    fireEvent.press(getByTestId('SwapAmountInput/MaxButton'))

    await act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(getByTestId('SwapTransactionDetails/ExchangeRate')).toHaveTextContent(
      '1 CELO ≈ 1.23456 cUSD'
    )
    expect(within(swapFromContainer).getByTestId('SwapAmountInput/Input').props.value).toBe(
      '10' // matching the value inside the mocked store
    )
    expect(within(swapToContainer).getByTestId('SwapAmountInput/Input').props.value).toBe(
      '12.345678'
    )
    expect(getByText('swapScreen.confirmSwap')).not.toBeDisabled()
  })

  it('should show and hide the max warning', async () => {
    mockFetch.mockResponse(defaultQuoteResponse)
    const { swapFromContainer, getByText, getByTestId, queryByText, tokenBottomSheet } =
      renderScreen({})

    selectToken(swapFromContainer, 'CELO', tokenBottomSheet)
    fireEvent.press(getByTestId('SwapAmountInput/MaxButton'))
    await waitFor(() => expect(getByText('swapScreen.maxSwapAmountWarning.body')).toBeTruthy())

    fireEvent.press(getByText('swapScreen.maxSwapAmountWarning.learnMore'))
    expect(navigate).toHaveBeenCalledWith(Screens.WebViewScreen, {
      uri: TRANSACTION_FEES_LEARN_MORE,
    })

    fireEvent.changeText(within(swapFromContainer).getByTestId('SwapAmountInput/Input'), '1.234')
    await waitFor(() => expect(queryByText('swapScreen.maxSwapAmountWarning.body')).toBeFalsy())
  })

  it('should fetch the quote if the amount is cleared and re-entered', async () => {
    mockFetch.mockResponse(defaultQuoteResponse)
    const { swapFromContainer, swapToContainer, getByText, getByTestId, tokenBottomSheet } =
      renderScreen({})

    selectToken(swapFromContainer, 'CELO', tokenBottomSheet)
    selectToken(swapToContainer, 'cUSD', tokenBottomSheet)
    fireEvent.press(getByTestId('SwapAmountInput/MaxButton'))

    await act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(mockFetch.mock.calls.length).toEqual(1)
    expect(getByText('swapScreen.confirmSwap')).not.toBeDisabled()

    fireEvent.changeText(within(swapFromContainer).getByTestId('SwapAmountInput/Input'), '')

    expect(within(swapFromContainer).getByTestId('SwapAmountInput/Input').props.value).toBe('')
    expect(within(swapToContainer).getByTestId('SwapAmountInput/Input').props.value).toBe('')
    expect(getByText('swapScreen.confirmSwap')).toBeDisabled()
    expect(mockFetch.mock.calls.length).toEqual(1)

    fireEvent.press(getByTestId('SwapAmountInput/MaxButton'))

    await act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(getByTestId('SwapTransactionDetails/ExchangeRate')).toHaveTextContent(
      '1 CELO ≈ 1.23456 cUSD'
    )
    expect(within(swapFromContainer).getByTestId('SwapAmountInput/Input').props.value).toBe(
      '10' // matching the value inside the mocked store
    )
    expect(within(swapToContainer).getByTestId('SwapAmountInput/Input').props.value).toBe(
      '12.345678'
    )
    expect(getByText('swapScreen.confirmSwap')).not.toBeDisabled()
    expect(mockFetch.mock.calls.length).toEqual(2)
  })

  it('should set max value if it is zero', async () => {
    const { swapFromContainer, swapToContainer, getByText, getByTestId, tokenBottomSheet } =
      renderScreen({
        celoBalance: '0',
        cUSDBalance: '0',
      })

    selectToken(swapFromContainer, 'CELO', tokenBottomSheet)
    selectToken(swapToContainer, 'cUSD', tokenBottomSheet)
    fireEvent.press(getByTestId('SwapAmountInput/MaxButton'))

    expect(within(swapFromContainer).getByTestId('SwapAmountInput/Input').props.value).toBe('0')
    expect(within(swapToContainer).getByTestId('SwapAmountInput/Input').props.value).toBe('')
    expect(mockFetch).not.toHaveBeenCalled()
    expect(getByText('swapScreen.confirmSwap')).toBeDisabled()
  })

  it('should display an error banner if api request fails', async () => {
    mockFetch.mockReject()

    const { swapFromContainer, swapToContainer, getByText, store, tokenBottomSheet } = renderScreen(
      {}
    )

    selectToken(swapFromContainer, 'CELO', tokenBottomSheet)
    selectToken(swapToContainer, 'cUSD', tokenBottomSheet)
    fireEvent.changeText(within(swapFromContainer).getByTestId('SwapAmountInput/Input'), '1.234')

    await act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(getByText('swapScreen.confirmSwap')).toBeDisabled()
    expect(store.getActions()).toEqual(
      expect.arrayContaining([showError(ErrorMessages.FETCH_SWAP_QUOTE_FAILED)])
    )
  })

  it('should be able to start a swap', async () => {
    const quoteReceivedTimestamp = 1000
    jest.spyOn(Date, 'now').mockReturnValue(quoteReceivedTimestamp) // quote received timestamp

    mockFetch.mockResponse(defaultQuoteResponse)
    const { getByText, getByTestId, store, swapToContainer, swapFromContainer, tokenBottomSheet } =
      renderScreen({})

    selectToken(swapFromContainer, 'CELO', tokenBottomSheet)
    selectToken(swapToContainer, 'cUSD', tokenBottomSheet)
    fireEvent.press(getByTestId('SwapAmountInput/MaxButton'))

    await act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(getByText('swapScreen.confirmSwap')).not.toBeDisabled()
    fireEvent.press(getByText('swapScreen.confirmSwap'))

    expect(store.getActions()).toEqual(
      expect.arrayContaining([
        swapStart({
          ...defaultQuote,
          userInput: {
            toTokenId: mockCusdTokenId,
            fromTokenId: mockCeloTokenId,
            swapAmount: {
              [Field.FROM]: '10',
              [Field.TO]: '12.345678', // 10 * 1.2345678
            },
            updatedField: Field.FROM,
          },
          quoteReceivedAt: quoteReceivedTimestamp,
        } as any),
      ])
    )
  })

  it('should be able to start a swap when the entered value uses comma as the decimal separator', async () => {
    const userInput = {
      toTokenId: mockCusdTokenId,
      fromTokenId: mockCeloTokenId,
      swapAmount: {
        [Field.FROM]: '1.5',
        [Field.TO]: '1.8518517', // 1.5 * 1.2345678
      },
      updatedField: Field.FROM,
    }

    const quoteReceivedTimestamp = 1000
    jest.spyOn(Date, 'now').mockReturnValue(quoteReceivedTimestamp) // quote received timestamp

    mockGetNumberFormatSettings.mockReturnValue({ decimalSeparator: ',' })
    mockFetch.mockResponse(defaultQuoteResponse)
    const { swapToContainer, swapFromContainer, getByText, store, tokenBottomSheet } = renderScreen(
      {}
    )

    selectToken(swapFromContainer, 'CELO', tokenBottomSheet)
    selectToken(swapToContainer, 'cUSD', tokenBottomSheet)
    fireEvent.changeText(within(swapFromContainer).getByTestId('SwapAmountInput/Input'), '1.5')

    await act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(getByText('swapScreen.confirmSwap')).not.toBeDisabled()
    fireEvent.press(getByText('swapScreen.confirmSwap'))

    expect(store.getActions()).toEqual(
      expect.arrayContaining([
        swapStart({
          ...defaultQuote,
          userInput,
          quoteReceivedAt: quoteReceivedTimestamp,
        } as any),
      ])
    )
  })

  it('should have correct analytics on swap submission', async () => {
    mockFetch.mockResponse(defaultQuoteResponse)
    const { getByText, getByTestId, swapToContainer, swapFromContainer, tokenBottomSheet } =
      renderScreen({})

    selectToken(swapFromContainer, 'CELO', tokenBottomSheet)
    selectToken(swapToContainer, 'cUSD', tokenBottomSheet)
    fireEvent.press(getByTestId('SwapAmountInput/MaxButton'))

    await act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(getByText('swapScreen.confirmSwap')).not.toBeDisabled()

    // Clear any previous events
    jest.mocked(ValoraAnalytics.track).mockClear()

    fireEvent.press(getByText('swapScreen.confirmSwap'))
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(SwapEvents.swap_review_submit, {
      toToken: mockCusdAddress,
      fromToken: mockCeloAddress,
      amount: '10',
      amountType: 'sellAmount',
      usdTotal: 1.5234566652,
      allowanceTarget: defaultQuote.unvalidatedSwapTransaction.allowanceTarget,
      estimatedPriceImpact: defaultQuote.unvalidatedSwapTransaction.estimatedPriceImpact,
      price: defaultQuote.unvalidatedSwapTransaction.price,
      provider: defaultQuote.details.swapProvider,
      web3Library: 'contract-kit',
    })
  })

  it('should show swappable tokens and search box', async () => {
    const { swapToContainer, getByPlaceholderText, swapFromContainer, tokenBottomSheet } =
      renderScreen({})

    selectToken(swapFromContainer, 'CELO', tokenBottomSheet)
    fireEvent.press(within(swapToContainer).getByTestId('SwapAmountInput/TokenSelect'))

    expect(getByPlaceholderText('tokenBottomSheet.searchAssets')).toBeTruthy()

    expect(within(tokenBottomSheet).getByText('Celo Dollar')).toBeTruthy()
    expect(within(tokenBottomSheet).getByText('Celo Euro')).toBeTruthy()
    expect(within(tokenBottomSheet).getByText('Celo native asset')).toBeTruthy()
    expect(within(tokenBottomSheet).getByText('Poof')).toBeTruthy()
    expect(within(tokenBottomSheet).queryByText('Test Token')).toBeFalsy()
  })

  it('should disable buy amount input when swap buy amount experiment is set is false', () => {
    mockExperimentParams.mockReturnValue({
      swapBuyAmountEnabled: false,
    })
    const { swapFromContainer, swapToContainer } = renderScreen({})

    expect(within(swapFromContainer).getByTestId('SwapAmountInput/Input').props.editable).toBe(true)
    expect(within(swapToContainer).getByTestId('SwapAmountInput/Input').props.editable).toBe(false)
  })

  // TODO remove this test when viem is enabled by default for swaps
  it('should display the correct transaction details', async () => {
    mockFetch.mockResponse(defaultQuoteResponse)
    const { getByTestId, getByText, swapFromContainer, swapToContainer, tokenBottomSheet } =
      renderScreen({
        celoBalance: '10',
        cUSDBalance: '10',
      })

    const transactionDetails = getByTestId('SwapTransactionDetails')
    expect(transactionDetails).toHaveTextContent(
      'swapScreen.transactionDetails.networkFeeNoNetwork'
    )
    expect(getByTestId('SwapTransactionDetails/NetworkFee')).toHaveTextContent('-')
    expect(transactionDetails).toHaveTextContent('swapScreen.transactionDetails.swapFee')
    expect(transactionDetails).toHaveTextContent('swapScreen.transactionDetails.swapFeeWaived')
    expect(transactionDetails).toHaveTextContent('swapScreen.transactionDetails.slippagePercentage')
    expect(getByTestId('SwapTransactionDetails/Slippage')).toHaveTextContent('0.3%')

    selectToken(swapFromContainer, 'CELO', tokenBottomSheet)
    selectToken(swapToContainer, 'cUSD', tokenBottomSheet)
    fireEvent.changeText(within(swapFromContainer).getByTestId('SwapAmountInput/Input'), '2')

    await act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(
      getByText('swapScreen.transactionDetails.networkFee, {"networkName":"Celo Alfajores"}')
    ).toBeTruthy()
    expect(getByTestId('SwapTransactionDetails/NetworkFee')).toHaveTextContent(
      '₱0.016 (0.0009 CELO)'
    ) // matches gas * gasPrice in defaultQuoteResponse
  })

  // When viem is enabled, it also uses the new fee estimation logic
  describe('when USE_VIEM_FOR_SWAP is enabled', () => {
    beforeEach(() => {
      jest
        .mocked(getFeatureGate)
        .mockImplementation((gate) => gate === StatsigFeatureGates.USE_VIEM_FOR_SWAP)
    })

    it('should display the correct transaction details', async () => {
      mockFetch.mockResponse(defaultQuoteResponse)
      const { getByTestId, getByText, swapFromContainer, swapToContainer, tokenBottomSheet } =
        renderScreen({
          celoBalance: '10',
          cUSDBalance: '10',
        })

      const transactionDetails = getByTestId('SwapTransactionDetails')
      expect(transactionDetails).toHaveTextContent(
        'swapScreen.transactionDetails.networkFeeNoNetwork'
      )
      expect(getByTestId('SwapTransactionDetails/NetworkFee')).toHaveTextContent('-')
      expect(transactionDetails).toHaveTextContent('swapScreen.transactionDetails.swapFee')
      expect(transactionDetails).toHaveTextContent('swapScreen.transactionDetails.swapFeeWaived')
      expect(transactionDetails).toHaveTextContent(
        'swapScreen.transactionDetails.slippagePercentage'
      )
      expect(getByTestId('SwapTransactionDetails/Slippage')).toHaveTextContent('0.3%')

      selectToken(swapFromContainer, 'CELO', tokenBottomSheet)
      selectToken(swapToContainer, 'cUSD', tokenBottomSheet)
      fireEvent.changeText(within(swapFromContainer).getByTestId('SwapAmountInput/Input'), '2')

      await act(() => {
        jest.runOnlyPendingTimers()
      })

      expect(
        getByText('swapScreen.transactionDetails.networkFee, {"networkName":"Celo Alfajores"}')
      ).toBeTruthy()
      expect(getByTestId('SwapTransactionDetails/NetworkFee')).toHaveTextContent(
        '₱0.38 (0.022 CELO)'
      ) // matches mocked value provided to estimateFeesPerGas, estimateGas, and gas in defaultQuoteResponse
    })

    it("should warn when the balances for feeCurrencies are 0 and can't cover the fee", async () => {
      // Swap from POOF to CELO, when no feeCurrency has any balance
      mockFetch.mockResponse(defaultQuoteResponse)
      const { getByText, getByTestId, swapFromContainer, swapToContainer, tokenBottomSheet } =
        renderScreen({
          celoBalance: '0',
          cUSDBalance: '0',
        })

      selectToken(swapFromContainer, 'POOF', tokenBottomSheet)
      selectToken(swapToContainer, 'CELO', tokenBottomSheet)
      fireEvent.press(getByTestId('SwapAmountInput/MaxButton'))

      await act(() => {
        jest.runOnlyPendingTimers()
      })

      expect(getByText('swapScreen.confirmSwap')).not.toBeDisabled()
      fireEvent.press(getByText('swapScreen.confirmSwap'))

      expect(
        getByText(
          'swapScreen.notEnoughBalanceForGas.dismissButton, {"feeCurrencies":"CELO, cEUR, cUSD"}'
        )
      ).toBeTruthy()
    })

    it('should warn when the balances for feeCurrencies are too low to cover the fee', async () => {
      // Swap from POOF to CELO, when no feeCurrency has any balance
      mockFetch.mockResponse(defaultQuoteResponse)
      const { getByText, getByTestId, swapFromContainer, swapToContainer, tokenBottomSheet } =
        renderScreen({
          celoBalance: '0.001',
          cUSDBalance: '0.001',
        })

      selectToken(swapFromContainer, 'POOF', tokenBottomSheet)
      selectToken(swapToContainer, 'CELO', tokenBottomSheet)
      fireEvent.press(getByTestId('SwapAmountInput/MaxButton'))

      await act(() => {
        jest.runOnlyPendingTimers()
      })

      expect(getByText('swapScreen.confirmSwap')).not.toBeDisabled()
      fireEvent.press(getByText('swapScreen.confirmSwap'))

      expect(
        getByText(
          'swapScreen.notEnoughBalanceForGas.dismissButton, {"feeCurrencies":"CELO, cUSD, cEUR"}'
        )
      ).toBeTruthy()
    })

    it('should prompt the user to decrease the swap amount when swapping the max amount of a feeCurrency, and no other feeCurrency has enough balance to pay for the fee', async () => {
      // Swap CELO to cUSD, when only CELO has balance
      mockFetch.mockResponse(defaultQuoteResponse)
      const {
        getByText,
        getByTestId,
        queryByText,
        swapToContainer,
        swapFromContainer,
        tokenBottomSheet,
      } = renderScreen({
        celoBalance: '1.234',
        cUSDBalance: '0',
      })

      selectToken(swapFromContainer, 'CELO', tokenBottomSheet)
      selectToken(swapToContainer, 'cUSD', tokenBottomSheet)
      fireEvent.press(getByTestId('SwapAmountInput/MaxButton'))

      await act(() => {
        jest.runOnlyPendingTimers()
      })

      expect(within(swapFromContainer).getByTestId('SwapAmountInput/Input').props.value).toBe(
        '1.234' // matching the value inside the mocked store
      )

      expect(getByText('swapScreen.confirmSwap')).not.toBeDisabled()
      fireEvent.press(getByText('swapScreen.confirmSwap'))

      const confirmDecrease = getByText(
        'swapScreen.needDecreaseSwapAmountForGas.confirmDecreaseButton, {"tokenSymbol":"CELO"}'
      )
      expect(confirmDecrease).toBeTruthy()

      // Mock next call with the decreased amount
      mockFetch.mockResponse(
        JSON.stringify({
          ...defaultQuote,
          unvalidatedSwapTransaction: {
            ...defaultQuote.unvalidatedSwapTransaction,
            sellAmount: '1207057600000000000',
          },
        })
      )

      // Now, decrease the swap amount
      fireEvent.press(confirmDecrease)

      expect(within(swapFromContainer).getByTestId('SwapAmountInput/Input').props.value).toBe(
        '1.2077776' // 1.234 minus the max fee calculated for the swap
      )

      await act(() => {
        jest.runOnlyPendingTimers()
      })

      expect(
        queryByText(
          'swapScreen.needDecreaseSwapAmountForGas.confirmDecreaseButton, {"tokenSymbol":"CELO"}'
        )
      ).toBeFalsy()
    })

    it('should prompt the user to decrease the swap amount when swapping close to the max amount of a feeCurrency, and no other feeCurrency has enough balance to pay for the fee', async () => {
      // Swap CELO to cUSD, when only CELO has balance
      mockFetch.mockResponse(
        JSON.stringify({
          ...defaultQuote,
          unvalidatedSwapTransaction: {
            ...defaultQuote.unvalidatedSwapTransaction,
            sellAmount: '1233000000000000000', // 1.233
          },
        })
      )
      const { getByText, queryByText, swapToContainer, swapFromContainer, tokenBottomSheet } =
        renderScreen({
          celoBalance: '1.234',
          cUSDBalance: '0',
        })

      selectToken(swapFromContainer, 'CELO', tokenBottomSheet)
      selectToken(swapToContainer, 'cUSD', tokenBottomSheet)
      fireEvent.changeText(within(swapFromContainer).getByTestId('SwapAmountInput/Input'), '1.233')

      await act(() => {
        jest.runOnlyPendingTimers()
      })

      expect(getByText('swapScreen.confirmSwap')).not.toBeDisabled()
      fireEvent.press(getByText('swapScreen.confirmSwap'))

      const confirmDecrease = getByText(
        'swapScreen.needDecreaseSwapAmountForGas.confirmDecreaseButton, {"tokenSymbol":"CELO"}'
      )
      expect(confirmDecrease).toBeTruthy()

      // Mock next call with the decreased amount
      mockFetch.mockResponse(
        JSON.stringify({
          ...defaultQuote,
          unvalidatedSwapTransaction: {
            ...defaultQuote.unvalidatedSwapTransaction,
            sellAmount: '1207057600000000000',
          },
        })
      )

      // Now, decrease the swap amount
      fireEvent.press(confirmDecrease)

      expect(within(swapFromContainer).getByTestId('SwapAmountInput/Input').props.value).toBe(
        '1.2077776' // 1.234 (max balance) minus the max fee calculated for the swap
      )

      await act(() => {
        jest.runOnlyPendingTimers()
      })

      expect(
        queryByText(
          'swapScreen.needDecreaseSwapAmountForGas.confirmDecreaseButton, {"tokenSymbol":"CELO"}'
        )
      ).toBeFalsy()
    })

    it("should allow swapping the entered amount of a feeCurrency when there's enough balance to cover for the fee, while no other feeCurrency can pay for the fee", async () => {
      // Swap CELO to cUSD, when only CELO has balance
      mockFetch.mockResponse(
        JSON.stringify({
          ...defaultQuote,
          unvalidatedSwapTransaction: {
            ...defaultQuote.unvalidatedSwapTransaction,
            sellAmount: '1000000000000000000', // 1
          },
        })
      )
      const { getByText, queryByTestId, swapToContainer, swapFromContainer, tokenBottomSheet } =
        renderScreen({
          celoBalance: '1.234',
          cUSDBalance: '0',
        })

      selectToken(swapFromContainer, 'CELO', tokenBottomSheet)
      selectToken(swapToContainer, 'cUSD', tokenBottomSheet)
      fireEvent.changeText(within(swapFromContainer).getByTestId('SwapAmountInput/Input'), '1')

      await act(() => {
        jest.runOnlyPendingTimers()
      })

      expect(getByText('swapScreen.confirmSwap')).not.toBeDisabled()
      fireEvent.press(getByText('swapScreen.confirmSwap'))

      expect(queryByTestId('QuoteResultNotEnoughBalanceForGasBottomSheet')).toBeFalsy()
      expect(queryByTestId('QuoteResultNeedDecreaseSwapAmountForGasBottomSheet')).toBeFalsy()
    })

    it("should allow swapping the max balance of a feeCurrency when there's another feeCurrency to pay for the fee", async () => {
      // Swap full CELO balance to cUSD
      mockFetch.mockResponse(defaultQuoteResponse)
      const {
        getByText,
        getByTestId,
        queryByTestId,
        swapToContainer,
        swapFromContainer,
        tokenBottomSheet,
      } = renderScreen({
        celoBalance: '1.234',
        cUSDBalance: '10',
      })

      selectToken(swapFromContainer, 'CELO', tokenBottomSheet)
      selectToken(swapToContainer, 'cUSD', tokenBottomSheet)
      fireEvent.press(getByTestId('SwapAmountInput/MaxButton'))

      await act(() => {
        jest.runOnlyPendingTimers()
      })

      expect(within(swapFromContainer).getByTestId('SwapAmountInput/Input').props.value).toBe(
        '1.234' // matching the value inside the mocked store
      )

      expect(getByText('swapScreen.confirmSwap')).not.toBeDisabled()
      fireEvent.press(getByText('swapScreen.confirmSwap'))

      expect(queryByTestId('QuoteResultNotEnoughBalanceForGasBottomSheet')).toBeFalsy()
      expect(queryByTestId('QuoteResultNeedDecreaseSwapAmountForGasBottomSheet')).toBeFalsy()
    })

    it('should be able to start a swap', async () => {
      const quoteReceivedTimestamp = 1000
      jest.spyOn(Date, 'now').mockReturnValue(quoteReceivedTimestamp) // quote received timestamp

      mockFetch.mockResponse(defaultQuoteResponse)
      const {
        getByText,
        getByTestId,
        store,
        swapToContainer,
        swapFromContainer,
        tokenBottomSheet,
      } = renderScreen({})

      selectToken(swapFromContainer, 'CELO', tokenBottomSheet)
      selectToken(swapToContainer, 'cUSD', tokenBottomSheet)
      fireEvent.press(getByTestId('SwapAmountInput/MaxButton'))

      await act(() => {
        jest.runOnlyPendingTimers()
      })

      expect(getByText('swapScreen.confirmSwap')).not.toBeDisabled()
      fireEvent.press(getByText('swapScreen.confirmSwap'))

      expect(store.getActions()).toEqual(
        expect.arrayContaining([
          swapStartPrepared({
            quote: {
              preparedTransactions,
              receivedAt: quoteReceivedTimestamp,
              rawSwapResponse: defaultQuote as any,
            },
            userInput: {
              toTokenId: mockCusdTokenId,
              fromTokenId: mockCeloTokenId,
              swapAmount: {
                [Field.FROM]: '10',
                [Field.TO]: '12.345678', // 10 * 1.2345678
              },
              updatedField: Field.FROM,
            },
          }),
        ])
      )
    })

    it('should be able to start a swap when the entered value uses comma as the decimal separator', async () => {
      const quoteReceivedTimestamp = 1000
      jest.spyOn(Date, 'now').mockReturnValue(quoteReceivedTimestamp) // quote received timestamp

      mockGetNumberFormatSettings.mockReturnValue({ decimalSeparator: ',' })
      mockFetch.mockResponse(defaultQuoteResponse)
      const { swapToContainer, swapFromContainer, getByText, store, tokenBottomSheet } =
        renderScreen({})

      selectToken(swapFromContainer, 'CELO', tokenBottomSheet)
      selectToken(swapToContainer, 'cUSD', tokenBottomSheet)
      fireEvent.changeText(within(swapFromContainer).getByTestId('SwapAmountInput/Input'), '1.5')

      await act(() => {
        jest.runOnlyPendingTimers()
      })

      expect(getByText('swapScreen.confirmSwap')).not.toBeDisabled()
      fireEvent.press(getByText('swapScreen.confirmSwap'))

      expect(store.getActions()).toEqual(
        expect.arrayContaining([
          swapStartPrepared({
            quote: {
              preparedTransactions,
              receivedAt: quoteReceivedTimestamp,
              rawSwapResponse: defaultQuote as any,
            },
            userInput: {
              toTokenId: mockCusdTokenId,
              fromTokenId: mockCeloTokenId,
              swapAmount: {
                [Field.FROM]: '1.5',
                [Field.TO]: '1.8518517', // 1.5 * 1.2345678
              },
              updatedField: Field.FROM,
            },
          }),
        ])
      )
    })

    it('should have correct analytics on swap submission', async () => {
      mockFetch.mockResponse(defaultQuoteResponse)
      const { getByText, getByTestId, swapToContainer, swapFromContainer, tokenBottomSheet } =
        renderScreen({})

      selectToken(swapFromContainer, 'CELO', tokenBottomSheet)
      selectToken(swapToContainer, 'cUSD', tokenBottomSheet)
      fireEvent.press(getByTestId('SwapAmountInput/MaxButton'))

      await act(() => {
        jest.runOnlyPendingTimers()
      })

      expect(getByText('swapScreen.confirmSwap')).not.toBeDisabled()

      // Clear any previous events
      jest.mocked(ValoraAnalytics.track).mockClear()

      fireEvent.press(getByText('swapScreen.confirmSwap'))
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(SwapEvents.swap_review_submit, {
        toToken: mockCusdAddress,
        fromToken: mockCeloAddress,
        amount: '10',
        amountType: 'sellAmount',
        usdTotal: 12.345678,
        allowanceTarget: defaultQuote.unvalidatedSwapTransaction.allowanceTarget,
        estimatedPriceImpact: defaultQuote.unvalidatedSwapTransaction.estimatedPriceImpact,
        price: defaultQuote.unvalidatedSwapTransaction.price,
        provider: defaultQuote.details.swapProvider,
        web3Library: 'viem',
        gas: 1821000,
        maxGasFee: 0.021852,
        maxGasFeeUsd: 0.28529642665785426,
        feeCurrency: undefined,
        feeCurrencySymbol: 'CELO',
        txCount: 2,
      })
    })
  })
})
