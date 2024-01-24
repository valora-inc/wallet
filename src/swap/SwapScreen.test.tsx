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
import { navigate, navigateToFiatCurrencySelection } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import SwapScreen from 'src/swap/SwapScreen'
import { swapStart } from 'src/swap/slice'
import { Field } from 'src/swap/types'
import { NetworkId } from 'src/transactions/types'
import { publicClient } from 'src/viem'
import { SerializableTransactionRequest } from 'src/viem/preparedTransactionSerialization'
import networkConfig from 'src/web3/networkConfig'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'
import {
  mockAccount,
  mockCeloAddress,
  mockCeloTokenId,
  mockCeurTokenId,
  mockCusdAddress,
  mockCusdTokenId,
  mockEthTokenId,
  mockPoofTokenId,
  mockTestTokenTokenId,
  mockTokenBalances,
  mockUSDCTokenId,
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
      showSwap: ['celo-alfajores', 'ethereum-sepolia'],
      showBalances: ['celo-alfajores', 'ethereum-sepolia'],
    }),
  }
})

jest.mock('viem/actions', () => ({
  ...jest.requireActual('viem/actions'),
  estimateGas: jest.fn(async () => BigInt(21_000)),
}))

jest.mock('src/viem/estimateFeesPerGas', () => ({
  estimateFeesPerGas: jest.fn(async () => ({
    maxFeePerGas: BigInt(12_000_000_000),
    maxPriorityFeePerGas: BigInt(2_000_000_000),
    baseFeePerGas: BigInt(6_000_000_000),
  })),
}))

const mockStoreTokenBalances = {
  [mockCeurTokenId]: {
    ...mockTokenBalances[mockCeurTokenId],
    isSwappable: true,
    balance: '0',
    priceUsd: '5.03655958698530226301',
  },
  [mockCusdTokenId]: {
    ...mockTokenBalances[mockCusdTokenId],
    isSwappable: true,
    priceUsd: '1',
  },
  [mockCeloTokenId]: {
    ...mockTokenBalances[mockCeloTokenId],
    isSwappable: true,
    priceUsd: '13.05584965485329753569',
  },
  [mockTestTokenTokenId]: {
    ...mockTokenBalances[mockTestTokenTokenId],
    isSwappable: false,
    balance: '100',
    // no priceUsd
    priceUsd: undefined,
  },
  [mockPoofTokenId]: {
    ...mockTokenBalances[mockPoofTokenId],
    isSwappable: true,
    balance: '100',
    // no priceUsd
    priceUsd: undefined,
  },
  [mockEthTokenId]: {
    ...mockTokenBalances[mockEthTokenId],
    isSwappable: true,
    priceUsd: '2000',
    balance: '10',
  },
  [mockUSDCTokenId]: {
    ...mockTokenBalances[mockUSDCTokenId],
    isSwappable: true,
    balance: '10',
    priceUsd: '1',
  },
}

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
        ...mockStoreTokenBalances,
        [mockCusdTokenId]: {
          ...mockStoreTokenBalances[mockCusdTokenId],
          balance: cUSDBalance,
        },
        [mockCeloTokenId]: {
          ...mockStoreTokenBalances[mockCeloTokenId],
          balance: celoBalance,
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
  const swapScreen = tree.getByTestId('SwapScreen')

  return {
    ...tree,
    store,
    swapFromContainer,
    swapToContainer,
    tokenBottomSheet,
    swapScreen,
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
    _baseFeePerGas: '6000000000',
    to: '0xf194afdf50b03e69bd7d057c1aa9e10c9954e4c9',
  },
  {
    data: '0x0',
    from: '0x0000000000000000000000000000000000007E57',
    gas: '1800000',
    maxFeePerGas: '12000000000',
    maxPriorityFeePerGas: '2000000000',
    _baseFeePerGas: '6000000000',
    to: '0x0000000000000000000000000000000000000123',
    value: '0',
  },
]

const selectSingleSwapToken = (
  swapAmountContainer: ReactTestInstance,
  tokenSymbol: string,
  swapScreen: ReactTestInstance
) => {
  const token = Object.values(mockStoreTokenBalances).find((token) => token.symbol === tokenSymbol)
  expect(token).toBeTruthy()

  const tokenBottomSheet = within(swapScreen).getByTestId('TokenBottomSheet')
  fireEvent.press(within(swapAmountContainer).getByTestId('SwapAmountInput/TokenSelect'))
  fireEvent.press(within(tokenBottomSheet).getByText(token!.name))

  if (!token!.priceUsd) {
    fireEvent.press(within(swapScreen).getByText('swapScreen.noUsdPriceWarning.ctaConfirm'))
  }

  expect(within(swapAmountContainer).getByText(tokenSymbol)).toBeTruthy()
}

const selectSwapTokens = (
  fromTokenSymbol: string,
  toTokenSymbol: string,
  swapScreen: ReactTestInstance
) => {
  const tokenSymbols = [fromTokenSymbol, toTokenSymbol]
  const swapInputContainers = within(swapScreen).getAllByTestId('SwapAmountInput')

  for (let i = 0; i < tokenSymbols.length; i++) {
    const tokenSymbol = tokenSymbols[i]
    const swapInputContainer = swapInputContainers[i]

    selectSingleSwapToken(swapInputContainer, tokenSymbol, swapScreen)
  }
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

    const originalReadContract = publicClient.celo.readContract
    jest.spyOn(publicClient.celo, 'readContract').mockImplementation(async (args) => {
      if (args.functionName === 'allowance') {
        return 0
      }
      return originalReadContract(args)
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
    const { swapFromContainer, swapToContainer, swapScreen } = renderScreen({})

    expect(within(swapFromContainer).getByText('swapScreen.swapFromTokenSelection')).toBeTruthy()
    expect(within(swapToContainer).getByText('swapScreen.swapToTokenSelection')).toBeTruthy()

    selectSwapTokens('CELO', 'cUSD', swapScreen)
  })

  it('should not select a token without usd price if the user dismisses the warning', async () => {
    const { swapFromContainer, queryByText, getByText, tokenBottomSheet } = renderScreen({})

    fireEvent.press(within(swapFromContainer).getByTestId('SwapAmountInput/TokenSelect'))
    fireEvent.press(
      within(tokenBottomSheet).getByText(mockStoreTokenBalances[mockPoofTokenId].name)
    )

    expect(
      getByText('swapScreen.noUsdPriceWarning.description, {"localCurrency":"PHP"}')
    ).toBeTruthy()

    fireEvent.press(getByText('swapScreen.noUsdPriceWarning.ctaDismiss'))

    expect(
      queryByText('swapScreen.noUsdPriceWarning.description, {"localCurrency":"PHP"}')
    ).toBeFalsy()
    expect(tokenBottomSheet).toBeVisible()
    expect(within(swapFromContainer).getByText('swapScreen.swapFromTokenSelection')).toBeTruthy()
  })

  it('should swap the to/from tokens if the same token is selected', async () => {
    const { swapFromContainer, swapToContainer, tokenBottomSheet } = renderScreen({})

    selectSingleSwapToken(swapFromContainer, 'CELO', tokenBottomSheet)
    selectSingleSwapToken(swapToContainer, 'cUSD', tokenBottomSheet)
    selectSingleSwapToken(swapFromContainer, 'cUSD', tokenBottomSheet)

    expect(within(swapFromContainer).getByText('cUSD')).toBeTruthy()
    expect(within(swapToContainer).getByText('CELO')).toBeTruthy()
  })

  it('should swap the to/from tokens even if the to token was not selected', async () => {
    const { swapFromContainer, swapToContainer, swapScreen } = renderScreen({})

    selectSwapTokens('CELO', 'CELO', swapScreen)

    expect(within(swapFromContainer).getByText('swapScreen.swapFromTokenSelection')).toBeTruthy()
    expect(within(swapToContainer).getByText('CELO')).toBeTruthy()
  })

  it('should keep the to amount in sync with the exchange rate', async () => {
    mockFetch.mockResponse(defaultQuoteResponse)
    const { swapFromContainer, swapToContainer, swapScreen, getByText, getByTestId } = renderScreen(
      {}
    )

    selectSwapTokens('CELO', 'cUSD', swapScreen)

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
    const { swapScreen, swapFromContainer, swapToContainer, getByText, getByTestId } = renderScreen(
      {}
    )

    selectSwapTokens('CELO', 'cUSD', swapScreen)
    fireEvent.changeText(within(swapFromContainer).getByTestId('SwapAmountInput/Input'), '1.234')

    await act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(mockFetch.mock.calls.length).toEqual(1)
    expect(mockFetch.mock.calls[0][0]).toEqual(
      `${
        networkConfig.getSwapQuoteUrl
      }?buyToken=${mockCusdAddress}&buyIsNative=false&buyNetworkId=${
        NetworkId['celo-alfajores']
      }&sellToken=${mockCeloAddress}&sellIsNative=true&sellNetworkId=${
        NetworkId['celo-alfajores']
      }&sellAmount=1234000000000000000&userAddress=${mockAccount.toLowerCase()}&slippagePercentage=0.3`
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
    const { swapScreen, swapFromContainer, swapToContainer, getByText, getByTestId } = renderScreen(
      {}
    )

    selectSwapTokens('CELO', 'cUSD', swapScreen)
    fireEvent.changeText(within(swapToContainer).getByTestId('SwapAmountInput/Input'), '1.234')

    await act(() => {
      jest.runOnlyPendingTimers()
    })
    expect(mockFetch.mock.calls.length).toEqual(1)
    expect(mockFetch.mock.calls[0][0]).toEqual(
      `${
        networkConfig.getSwapQuoteUrl
      }?buyToken=${mockCusdAddress}&buyIsNative=false&buyNetworkId=${
        NetworkId['celo-alfajores']
      }&sellToken=${mockCeloAddress}&sellIsNative=true&sellNetworkId=${
        NetworkId['celo-alfajores']
      }&buyAmount=1234000000000000000&userAddress=${mockAccount.toLowerCase()}&slippagePercentage=0.3`
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

    const { swapFromContainer, swapScreen, getByText, queryByText, getByTestId } = renderScreen({})

    // select 100000 CELO to cUSD swap
    selectSwapTokens('CELO', 'cUSD', swapScreen)
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
        toToken: mockCusdAddress,
        toTokenId: mockCusdTokenId,
        toTokenNetworkId: NetworkId['celo-alfajores'],
        fromToken: mockCeloAddress,
        fromTokenId: mockCeloTokenId,
        fromTokenNetworkId: NetworkId['celo-alfajores'],
        amount: '100000',
        amountType: 'sellAmount',
        priceImpact: '5.2',
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

    const { swapFromContainer, swapScreen, getByText, queryByText, getByTestId } = renderScreen({})

    // select 100000 CELO to cUSD swap
    selectSwapTokens('CELO', 'cUSD', swapScreen)
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
        toToken: mockCusdAddress,
        toTokenId: mockCusdTokenId,
        toTokenNetworkId: NetworkId['celo-alfajores'],
        fromToken: mockCeloAddress,
        fromTokenId: mockCeloTokenId,
        fromTokenNetworkId: NetworkId['celo-alfajores'],
        amount: '100000',
        amountType: 'sellAmount',
        priceImpact: null,
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

    const { swapFromContainer, swapScreen, getByText, queryByText, getByTestId } = renderScreen({})

    selectSwapTokens('CELO', 'POOF', swapScreen) // no priceUsd
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
    const { swapScreen, swapFromContainer, swapToContainer, getByText, getByTestId } = renderScreen(
      {}
    )

    selectSwapTokens('CELO', 'cUSD', swapScreen)
    fireEvent.changeText(within(swapFromContainer).getByTestId('SwapAmountInput/Input'), '1,234')

    await act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(mockFetch.mock.calls.length).toEqual(1)
    expect(mockFetch.mock.calls[0][0]).toEqual(
      `${
        networkConfig.getSwapQuoteUrl
      }?buyToken=${mockCusdAddress}&buyIsNative=false&buyNetworkId=${
        NetworkId['celo-alfajores']
      }&sellToken=${mockCeloAddress}&sellIsNative=true&sellNetworkId=${
        NetworkId['celo-alfajores']
      }&sellAmount=1234000000000000000&userAddress=${mockAccount.toLowerCase()}&slippagePercentage=0.3`
    )

    expect(getByTestId('SwapTransactionDetails/ExchangeRate')).toHaveTextContent(
      '1 CELO ≈ 1,23456 cUSD'
    )
    expect(within(swapFromContainer).getByTestId('SwapAmountInput/Input').props.value).toBe('1,234')
    expect(within(swapFromContainer).getByTestId('SwapAmountInput/FiatValue')).toHaveTextContent(
      '~₱21,43'
    )
    expect(within(swapToContainer).getByTestId('SwapAmountInput/Input').props.value).toBe(
      '1,5234566652'
    )
    expect(within(swapToContainer).getByTestId('SwapAmountInput/FiatValue')).toHaveTextContent(
      '~₱2,03'
    )
    expect(getByTestId('SwapTransactionDetails/Slippage')).toHaveTextContent('0,3%')
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
    const { swapScreen, swapFromContainer, swapToContainer, getByText, getByTestId } = renderScreen(
      {}
    )

    selectSwapTokens('CELO', 'cUSD', swapScreen)
    fireEvent.changeText(within(swapToContainer).getByTestId('SwapAmountInput/Input'), '1,234')

    await act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(mockFetch.mock.calls.length).toEqual(1)
    expect(mockFetch.mock.calls[0][0]).toEqual(
      `${
        networkConfig.getSwapQuoteUrl
      }?buyToken=${mockCusdAddress}&buyIsNative=false&buyNetworkId=${
        NetworkId['celo-alfajores']
      }&sellToken=${mockCeloAddress}&sellIsNative=true&sellNetworkId=${
        NetworkId['celo-alfajores']
      }&buyAmount=1234000000000000000&userAddress=${mockAccount.toLowerCase()}&slippagePercentage=0.3`
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
    const { swapFromContainer, swapToContainer, getByText, getByTestId, swapScreen } = renderScreen(
      {}
    )

    selectSwapTokens('CELO', 'cUSD', swapScreen)
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

  it('should show and hide the max warning for fee currencies', async () => {
    mockFetch.mockResponse(defaultQuoteResponse)
    const { swapFromContainer, getByText, getByTestId, queryByTestId, tokenBottomSheet } =
      renderScreen({ celoBalance: '0', cUSDBalance: '10' }) // so that cUSD is the only feeCurrency with a balance

    selectSingleSwapToken(swapFromContainer, 'cUSD', tokenBottomSheet)
    fireEvent.press(getByTestId('SwapAmountInput/MaxButton'))
    await waitFor(() =>
      expect(
        getByText('swapScreen.maxSwapAmountWarning.bodyV1_74, {"tokenSymbol":"cUSD"}')
      ).toBeTruthy()
    )

    fireEvent.press(getByText('swapScreen.maxSwapAmountWarning.learnMore'))
    expect(navigate).toHaveBeenCalledWith(Screens.WebViewScreen, {
      uri: TRANSACTION_FEES_LEARN_MORE,
    })

    fireEvent.changeText(within(swapFromContainer).getByTestId('SwapAmountInput/Input'), '1.234')
    await waitFor(() => expect(queryByTestId('MaxSwapAmountWarning')).toBeFalsy())
  })

  it("shouldn't show the max warning when there's balance for more than 1 fee currency", async () => {
    mockFetch.mockResponse(defaultQuoteResponse)
    const { swapFromContainer, getByTestId, queryByTestId, tokenBottomSheet } = renderScreen({
      celoBalance: '10',
      cUSDBalance: '20',
    })

    selectSingleSwapToken(swapFromContainer, 'CELO', tokenBottomSheet)
    fireEvent.press(getByTestId('SwapAmountInput/MaxButton'))
    await waitFor(() => expect(queryByTestId('MaxSwapAmountWarning')).toBeFalsy())
  })

  it('should fetch the quote if the amount is cleared and re-entered', async () => {
    mockFetch.mockResponse(defaultQuoteResponse)
    const { swapFromContainer, swapToContainer, getByText, getByTestId, swapScreen } = renderScreen(
      {}
    )

    selectSwapTokens('CELO', 'cUSD', swapScreen)
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
    const { swapFromContainer, swapToContainer, getByText, getByTestId, swapScreen } = renderScreen(
      {
        celoBalance: '0',
        cUSDBalance: '0',
      }
    )

    selectSwapTokens('CELO', 'cUSD', swapScreen)
    fireEvent.press(getByTestId('SwapAmountInput/MaxButton'))

    expect(within(swapFromContainer).getByTestId('SwapAmountInput/Input').props.value).toBe('0')
    expect(within(swapToContainer).getByTestId('SwapAmountInput/Input').props.value).toBe('')
    expect(mockFetch).not.toHaveBeenCalled()
    expect(getByText('swapScreen.confirmSwap')).toBeDisabled()
  })

  it('should display an error banner if api request fails', async () => {
    mockFetch.mockReject()

    const { swapFromContainer, getByText, store, swapScreen } = renderScreen({})

    selectSwapTokens('CELO', 'cUSD', swapScreen)
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
    const { getByText, getByTestId, store, swapScreen } = renderScreen({})

    selectSwapTokens('CELO', 'cUSD', swapScreen)
    fireEvent.press(getByTestId('SwapAmountInput/MaxButton'))

    await act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(getByText('swapScreen.confirmSwap')).not.toBeDisabled()
    fireEvent.press(getByText('swapScreen.confirmSwap'))

    expect(store.getActions()).toEqual(
      expect.arrayContaining([
        swapStart({
          swapId: expect.any(String),
          quote: {
            preparedTransactions,
            receivedAt: quoteReceivedTimestamp,
            price: defaultQuote.unvalidatedSwapTransaction.price,
            provider: defaultQuote.details.swapProvider,
            estimatedPriceImpact: defaultQuote.unvalidatedSwapTransaction.estimatedPriceImpact,
            allowanceTarget: defaultQuote.unvalidatedSwapTransaction.allowanceTarget,
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

  it('should start the swap without an approval transaction if the allowance is high enough', async () => {
    jest.spyOn(publicClient.celo, 'readContract').mockResolvedValueOnce(BigInt(11 * 1e18)) // greater than swap amount of 10
    mockFetch.mockResponse(
      JSON.stringify({
        ...defaultQuote,
        unvalidatedSwapTransaction: {
          ...defaultQuote.unvalidatedSwapTransaction,
          buyTokenAddress: mockCeloAddress,
          sellTokenAddress: mockCusdAddress,
        },
      })
    )
    const { getByText, store, swapScreen, swapFromContainer } = renderScreen({})

    selectSwapTokens('cUSD', 'CELO', swapScreen)
    fireEvent.changeText(within(swapFromContainer).getByTestId('SwapAmountInput/Input'), '10')

    await act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(getByText('swapScreen.confirmSwap')).not.toBeDisabled()
    fireEvent.press(getByText('swapScreen.confirmSwap'))

    expect(store.getActions()).toEqual(
      expect.arrayContaining([
        swapStart({
          swapId: expect.any(String),
          quote: {
            preparedTransactions: [preparedTransactions[1]], // no approval transaction
            receivedAt: expect.any(Number),
            price: defaultQuote.unvalidatedSwapTransaction.price,
            provider: defaultQuote.details.swapProvider,
            estimatedPriceImpact: defaultQuote.unvalidatedSwapTransaction.estimatedPriceImpact,
            allowanceTarget: defaultQuote.unvalidatedSwapTransaction.allowanceTarget,
          },
          userInput: {
            toTokenId: mockCeloTokenId,
            fromTokenId: mockCusdTokenId,
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
    const { swapScreen, swapFromContainer, getByText, store } = renderScreen({})

    selectSwapTokens('CELO', 'cUSD', swapScreen)
    fireEvent.changeText(within(swapFromContainer).getByTestId('SwapAmountInput/Input'), '1.5')

    await act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(getByText('swapScreen.confirmSwap')).not.toBeDisabled()
    fireEvent.press(getByText('swapScreen.confirmSwap'))

    expect(store.getActions()).toEqual(
      expect.arrayContaining([
        swapStart({
          swapId: expect.any(String),
          quote: {
            preparedTransactions,
            receivedAt: quoteReceivedTimestamp,
            price: defaultQuote.unvalidatedSwapTransaction.price,
            provider: defaultQuote.details.swapProvider,
            estimatedPriceImpact: defaultQuote.unvalidatedSwapTransaction.estimatedPriceImpact,
            allowanceTarget: defaultQuote.unvalidatedSwapTransaction.allowanceTarget,
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
    const { getByText, getByTestId, swapScreen } = renderScreen({})

    selectSwapTokens('CELO', 'cUSD', swapScreen)
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
      toTokenId: mockCusdTokenId,
      toTokenNetworkId: NetworkId['celo-alfajores'],
      fromToken: mockCeloAddress,
      fromTokenId: mockCeloTokenId,
      fromTokenNetworkId: NetworkId['celo-alfajores'],
      amount: '10',
      amountType: 'sellAmount',
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

  it('should show swappable tokens and search box', async () => {
    const { swapToContainer, getByPlaceholderText, swapFromContainer, tokenBottomSheet } =
      renderScreen({})

    selectSingleSwapToken(swapFromContainer, 'CELO', tokenBottomSheet)
    fireEvent.press(within(swapToContainer).getByTestId('SwapAmountInput/TokenSelect'))

    expect(getByPlaceholderText('tokenBottomSheet.searchAssets')).toBeTruthy()

    expect(within(tokenBottomSheet).getByText('Celo Dollar')).toBeTruthy()
    expect(within(tokenBottomSheet).getByText('Celo Euro')).toBeTruthy()
    expect(within(tokenBottomSheet).getByText('Celo native asset')).toBeTruthy()
    expect(within(tokenBottomSheet).getByText('Poof Governance Token')).toBeTruthy()
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

  it('should display the correct transaction details', async () => {
    mockFetch.mockResponse(defaultQuoteResponse)
    const { getByTestId, getByText, swapFromContainer, swapScreen } = renderScreen({
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

    selectSwapTokens('CELO', 'cUSD', swapScreen)
    fireEvent.changeText(within(swapFromContainer).getByTestId('SwapAmountInput/Input'), '2')

    await act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(
      getByText('swapScreen.transactionDetails.networkFee, {"networkName":"Celo Alfajores"}')
    ).toBeTruthy()
    expect(getByTestId('SwapTransactionDetails/NetworkFee')).toHaveTextContent('₱0.38 (0.022 CELO)') // matches mocked value provided to estimateFeesPerGas, estimateGas, and gas in defaultQuoteResponse
  })

  it('should disable the confirm button after a swap has been submitted', async () => {
    mockFetch.mockResponse(defaultQuoteResponse)
    const { update, getByText, getByTestId, swapScreen, store } = renderScreen({})

    selectSwapTokens('CELO', 'cUSD', swapScreen)
    fireEvent.press(getByTestId('SwapAmountInput/MaxButton'))

    await act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(getByText('swapScreen.confirmSwap')).not.toBeDisabled()
    fireEvent.press(getByText('swapScreen.confirmSwap'))

    const swapAction = store.getActions().find((action) => action.type === swapStart.type)
    const swapId = swapAction.payload.swapId
    expect(swapId).toBeTruthy()

    // Simulate swap in progress
    const state = store.getState()
    const updatedStore = createMockStore({
      ...state,
      swap: {
        ...state.swap,
        currentSwap: {
          id: swapId,
          status: 'started',
        },
      },
    })

    update(
      <Provider store={updatedStore}>
        <MockedNavigator component={SwapScreen} />
      </Provider>
    )

    // Using testID because the button is in loading state, not showing the text
    expect(getByTestId('ConfirmSwapButton')).toBeDisabled()
  })

  it('should show and hide the error warning', async () => {
    mockFetch.mockResponse(defaultQuoteResponse)
    const { update, getByText, getByTestId, queryByText, swapFromContainer, swapScreen, store } =
      renderScreen({})

    selectSwapTokens('CELO', 'cUSD', swapScreen)
    fireEvent.press(getByTestId('SwapAmountInput/MaxButton'))

    await act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(getByText('swapScreen.confirmSwap')).not.toBeDisabled()
    fireEvent.press(getByText('swapScreen.confirmSwap'))

    const swapAction = store.getActions().find((action) => action.type === swapStart.type)
    const swapId = swapAction.payload.swapId
    expect(swapId).toBeTruthy()

    expect(queryByText('swapScreen.confirmSwapFailedWarning.title')).toBeFalsy()
    expect(queryByText('swapScreen.confirmSwapFailedWarning.body')).toBeFalsy()

    // Simulate swap error
    const state = store.getState()
    const updatedStore = createMockStore({
      ...state,
      swap: {
        ...state.swap,
        currentSwap: {
          id: swapId,
          status: 'error',
        },
      },
    })

    update(
      <Provider store={updatedStore}>
        <MockedNavigator component={SwapScreen} />
      </Provider>
    )

    expect(getByText('swapScreen.confirmSwapFailedWarning.title')).toBeTruthy()
    expect(getByText('swapScreen.confirmSwapFailedWarning.body')).toBeTruthy()
    // NOT disabled, so users can retry
    expect(getByText('swapScreen.confirmSwap')).not.toBeDisabled()

    // Now change some input, and the warning should disappear
    fireEvent.changeText(within(swapFromContainer).getByTestId('SwapAmountInput/Input'), '2')

    expect(queryByText('swapScreen.confirmSwapFailedWarning.title')).toBeFalsy()
    expect(queryByText('swapScreen.confirmSwapFailedWarning.body')).toBeFalsy()
  })

  it('should show and hide the switched network warning', async () => {
    mockFetch.mockResponse(defaultQuoteResponse)
    const {
      getByText,
      getByTestId,
      queryByTestId,
      swapToContainer,
      swapFromContainer,
      tokenBottomSheet,
      swapScreen,
    } = renderScreen({ cUSDBalance: '0' })

    // First get a quote for a network
    selectSwapTokens('CELO', 'cUSD', swapScreen)
    fireEvent.press(getByTestId('SwapAmountInput/MaxButton'))

    await act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(getByTestId('SwapTransactionDetails/ExchangeRate')).toHaveTextContent(
      '1 CELO ≈ 1.23456 cUSD'
    )
    expect(queryByTestId('SwitchedToNetworkWarning')).toBeFalsy()
    expect(getByTestId('MaxSwapAmountWarning')).toBeTruthy()

    // Now select a "to" token from a different network, the warning should appear
    selectSingleSwapToken(swapToContainer, 'USDC', tokenBottomSheet)

    expect(
      getByText('swapScreen.switchedToNetworkWarning.title, {"networkName":"Ethereum Sepolia"}')
    ).toBeTruthy()
    expect(
      getByText(
        'swapScreen.switchedToNetworkWarning.body, {"networkName":"Ethereum Sepolia","context":"swapFrom"}'
      )
    ).toBeTruthy()

    // Make sure the max warning is not shown
    expect(queryByTestId('MaxSwapAmountWarning')).toBeFalsy()

    // Check the quote is cleared
    expect(getByTestId('SwapTransactionDetails/ExchangeRate')).toHaveTextContent('-')

    // Disabled, until the user selects a token from the same network
    expect(getByText('swapScreen.confirmSwap')).toBeDisabled()

    // Now select a "from" token from the same network, the warning should disappear
    selectSingleSwapToken(swapFromContainer, 'ETH', tokenBottomSheet)

    expect(queryByTestId('SwitchedToNetworkWarning')).toBeFalsy()
    // Max warning is shown again, because both ETH and CELO have the same balance
    // and we previously selected the max value for CELO
    expect(queryByTestId('MaxSwapAmountWarning')).toBeTruthy()

    // Now select a "from" token from a different network again, the warning should reappear
    selectSingleSwapToken(swapFromContainer, 'cUSD', tokenBottomSheet)

    expect(
      getByText('swapScreen.switchedToNetworkWarning.title, {"networkName":"Celo Alfajores"}')
    ).toBeTruthy()
    expect(
      getByText(
        'swapScreen.switchedToNetworkWarning.body, {"networkName":"Celo Alfajores","context":"swapTo"}'
      )
    ).toBeTruthy()
  })

  it("should warn when the balances for feeCurrencies are 0 and can't cover the fee", async () => {
    // Swap from POOF to CELO, when no feeCurrency has any balance
    mockFetch.mockResponse(defaultQuoteResponse)
    const { getByText, getByTestId, swapScreen } = renderScreen({
      celoBalance: '0',
      cUSDBalance: '0',
    })

    selectSwapTokens('POOF', 'CELO', swapScreen)
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
    const { getByText, getByTestId, swapScreen } = renderScreen({
      celoBalance: '0.001',
      cUSDBalance: '0.001',
    })

    selectSwapTokens('POOF', 'CELO', swapScreen)
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
    const { getByText, getByTestId, queryByText, swapScreen, swapFromContainer } = renderScreen({
      celoBalance: '1.234',
      cUSDBalance: '0',
    })

    selectSwapTokens('CELO', 'cUSD', swapScreen)
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
    const { getByText, queryByText, swapScreen, swapFromContainer } = renderScreen({
      celoBalance: '1.234',
      cUSDBalance: '0',
    })

    selectSwapTokens('CELO', 'cUSD', swapScreen)
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
    const { getByText, queryByTestId, swapFromContainer, swapScreen } = renderScreen({
      celoBalance: '1.234',
      cUSDBalance: '0',
    })

    selectSwapTokens('CELO', 'cUSD', swapScreen)
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
    const { getByText, getByTestId, queryByTestId, swapScreen, swapFromContainer } = renderScreen({
      celoBalance: '1.234',
      cUSDBalance: '10',
    })

    selectSwapTokens('CELO', 'cUSD', swapScreen)
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

  it("should display 'Fund your wallet' bottom sheet with 'Add funds' button when user has zero balance", async () => {
    mockFetch.mockResponse(defaultQuoteResponse)

    const store = createMockStore({
      tokens: {
        tokenBalances: {
          [mockCusdTokenId]: {
            ...mockTokenBalances[mockCusdTokenId],
            isSwappable: true,
            balance: '0',
            priceUsd: '1',
          },
          [mockCeloTokenId]: {
            ...mockTokenBalances[mockCeloTokenId],
            isSwappable: true,
            balance: '0',
            priceUsd: '1',
          },
        },
      },
    })

    const { getByText, getByTestId, getAllByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={SwapScreen} />
      </Provider>
    )
    const swapScreen = getByTestId('SwapScreen')
    const [swapFromContainer] = getAllByTestId('SwapAmountInput')

    selectSwapTokens('CELO', 'cUSD', swapScreen)
    fireEvent.changeText(within(swapFromContainer).getByTestId('SwapAmountInput/Input'), '1')

    await act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(getByText('swapScreen.confirmSwap')).not.toBeDisabled()
    fireEvent.press(getByText('swapScreen.confirmSwap'))

    expect(store.getActions().map((action) => action.type)).not.toContain(swapStart.type)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(SwapEvents.swap_show_fund_your_wallet)

    fireEvent.press(getByText('swapScreen.fundYourWalletBottomSheet.addFundsButton'))
    expect(navigateToFiatCurrencySelection).toHaveBeenCalled()
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(SwapEvents.swap_add_funds)
  })
})
