import { fireEvent, render, waitFor } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Provider } from 'react-redux'
import { TokenBottomSheetEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import TokenBottomSheet, {
  DEBOUCE_WAIT_TIME,
  TokenBalanceItemOption,
  TokenBottomSheetProps,
  TokenPickerOrigin,
} from 'src/components/TokenBottomSheet'
import { TokenBalance } from 'src/tokens/slice'
import { NetworkId } from 'src/transactions/types'
import { createMockStore } from 'test/utils'
import {
  mockCeurAddress,
  mockCeurTokenId,
  mockCusdAddress,
  mockCusdTokenId,
  mockTestTokenAddress,
  mockTestTokenTokenId,
} from 'test/values'

jest.mock('src/analytics/ValoraAnalytics')

const tokens: TokenBalance[] = [
  {
    balance: new BigNumber('10'),
    priceUsd: new BigNumber('1'),
    lastKnownPriceUsd: new BigNumber('1'),
    symbol: 'cUSD',
    address: mockCusdAddress,
    tokenId: mockCusdTokenId,
    networkId: NetworkId['celo-alfajores'],
    isFeeCurrency: true,
    canTransferWithComment: true,
    priceFetchedAt: Date.now(),
    decimals: 18,
    name: 'Celo Dollar',
    imageUrl: '',
  },
  {
    balance: new BigNumber('20'),
    priceUsd: new BigNumber('1.2'),
    lastKnownPriceUsd: new BigNumber('1.2'),
    symbol: 'cEUR',
    address: mockCeurAddress,
    tokenId: mockCeurTokenId,
    networkId: NetworkId['celo-alfajores'],
    isFeeCurrency: true,
    canTransferWithComment: true,
    priceFetchedAt: Date.now(),
    decimals: 18,
    name: 'Celo Euro',
    imageUrl: '',
  },
  {
    balance: new BigNumber('10'),
    symbol: 'TT',
    priceUsd: null,
    lastKnownPriceUsd: new BigNumber('1'),
    address: mockTestTokenAddress,
    tokenId: mockTestTokenTokenId,
    networkId: NetworkId['celo-alfajores'],
    priceFetchedAt: Date.now(),
    decimals: 18,
    name: 'Test Token',
    imageUrl: '',
  },
]

const mockStore = createMockStore({
  tokens: {
    tokenBalances: {
      [mockCusdTokenId]: {
        balance: '10',
        priceUsd: '1',
        symbol: 'cUSD',
        address: mockCusdAddress,
        tokenId: mockCusdTokenId,
        networkId: NetworkId['celo-alfajores'],
        isFeeCurrency: true,
        priceFetchedAt: Date.now(),
        name: 'Celo Dollar',
      },
      [mockCeurTokenId]: {
        balance: '20',
        priceUsd: '1.2',
        symbol: 'cEUR',
        address: mockCeurAddress,
        tokenId: mockCeurTokenId,
        networkId: NetworkId['celo-alfajores'],
        isFeeCurrency: true,
        priceFetchedAt: Date.now(),
        name: 'Celo Euro',
      },
      [mockTestTokenTokenId]: {
        balance: '10',
        symbol: 'TT',
        address: mockTestTokenAddress,
        tokenId: mockTestTokenTokenId,
        networkId: NetworkId['celo-alfajores'],
        priceFetchedAt: Date.now(),
        name: 'Test Token',
      },
    },
  },
})

const onTokenSelectedMock = jest.fn()

describe('TokenBottomSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  function renderBottomSheet(props: Partial<TokenBottomSheetProps<TokenBalance>> = {}) {
    return render(
      <Provider store={mockStore}>
        <TokenBottomSheet
          title="testTitle"
          forwardedRef={{ current: null }}
          origin={TokenPickerOrigin.Send}
          onTokenSelected={onTokenSelectedMock}
          tokens={tokens}
          searchEnabled={false}
          {...props}
        />
      </Provider>
    )
  }

  it('renders correctly', () => {
    const { getByTestId } = renderBottomSheet()

    expect(getByTestId('cUSDBalance')).toHaveTextContent('10.00 cUSD')
    expect(getByTestId('LocalcUSDBalance')).toHaveTextContent('₱13.30')
    expect(getByTestId('cEURBalance')).toHaveTextContent('20.00 cEUR')
    expect(getByTestId('LocalcEURBalance')).toHaveTextContent('₱31.92') // 20 * 1.2 (cEUR price) * 1.33 (PHP price)
    expect(getByTestId('TTBalance')).toHaveTextContent('10.00 TT')
  })

  it('renders correctly with TokenBalanceItem', () => {
    const { getAllByTestId } = renderBottomSheet({
      TokenOptionComponent: TokenBalanceItemOption,
    })

    expect(getAllByTestId('TokenBalanceItem')).toHaveLength(3)
    expect(getAllByTestId('TokenBalanceItem')[0]).toHaveTextContent('10.00 cUSD')
    expect(getAllByTestId('TokenBalanceItem')[0]).toHaveTextContent('₱13.30')
    expect(getAllByTestId('TokenBalanceItem')[1]).toHaveTextContent('20.00 cEUR')
    expect(getAllByTestId('TokenBalanceItem')[1]).toHaveTextContent('₱31.92') // 20 * 1.2 (cEUR price) * 1.33 (PHP price)
    expect(getAllByTestId('TokenBalanceItem')[2]).toHaveTextContent('10.00 TT')
  })

  it('handles the choosing of a token correctly', () => {
    const { getByTestId } = renderBottomSheet()

    fireEvent.press(getByTestId('cUSDTouchable'))
    expect(onTokenSelectedMock).toHaveBeenLastCalledWith(
      tokens.find((token) => token.tokenId === mockCusdTokenId)
    )

    fireEvent.press(getByTestId('cEURTouchable'))
    expect(onTokenSelectedMock).toHaveBeenLastCalledWith(
      tokens.find((token) => token.tokenId === mockCeurTokenId)
    )

    fireEvent.press(getByTestId('TTTouchable'))
    expect(onTokenSelectedMock).toHaveBeenLastCalledWith(
      tokens.find((token) => token.tokenId === mockTestTokenTokenId)
    )
  })

  it('handles the choosing of a token correctly with TokenBalanceItem', () => {
    const { getAllByTestId } = renderBottomSheet({
      TokenOptionComponent: TokenBalanceItemOption,
    })

    fireEvent.press(getAllByTestId('TokenBalanceItem')[0])
    expect(onTokenSelectedMock).toHaveBeenLastCalledWith(
      tokens.find((token) => token.tokenId === mockCusdTokenId)
    )

    fireEvent.press(getAllByTestId('TokenBalanceItem')[1])
    expect(onTokenSelectedMock).toHaveBeenLastCalledWith(
      tokens.find((token) => token.tokenId === mockCeurTokenId)
    )

    fireEvent.press(getAllByTestId('TokenBalanceItem')[2])
    expect(onTokenSelectedMock).toHaveBeenLastCalledWith(
      tokens.find((token) => token.tokenId === mockTestTokenTokenId)
    )
  })

  it('shows the price usd unavailable warning when the token price is not available', async () => {
    const { getAllByTestId, getByText, queryByText } = renderBottomSheet({
      TokenOptionComponent: TokenBalanceItemOption,
      showPriceUsdUnavailableWarning: true,
    })

    // ensure that the warning is not shown for a token with usd price
    fireEvent.press(getAllByTestId('TokenBalanceItem')[0])
    expect(onTokenSelectedMock).toHaveBeenLastCalledWith(
      tokens.find((token) => token.tokenId === mockCusdTokenId)
    )
    expect(queryByText('tokenBottomSheet.noUsdPriceWarning.title')).toBeFalsy()

    fireEvent.press(getAllByTestId('TokenBalanceItem')[2])
    // expect that onTokenSelectedMock was not called again
    expect(onTokenSelectedMock).toHaveBeenLastCalledWith(
      tokens.find((token) => token.tokenId === mockCusdTokenId)
    )
    expect(getByText('tokenBottomSheet.noUsdPriceWarning.title')).toBeTruthy()

    // expect that dismissing the warning does not select the token
    fireEvent.press(getByText('tokenBottomSheet.noUsdPriceWarning.ctaDismiss'))
    await waitFor(() => expect(queryByText('tokenBottomSheet.noUsdPriceWarning.title')).toBeFalsy())
    expect(onTokenSelectedMock).toHaveBeenLastCalledWith(
      tokens.find((token) => token.tokenId === mockCusdTokenId)
    )

    // expect that confirming the warning selects the token
    fireEvent.press(getAllByTestId('TokenBalanceItem')[2])
    fireEvent.press(getByText('tokenBottomSheet.noUsdPriceWarning.ctaConfirm'))
    expect(onTokenSelectedMock).toHaveBeenLastCalledWith(
      tokens.find((token) => token.tokenId === mockTestTokenTokenId)
    )
  })

  it('renders and behaves correctly when the search is enabled', () => {
    const { getByPlaceholderText, getByTestId, queryByTestId } = renderBottomSheet({
      searchEnabled: true,
    })
    const searchInput = getByPlaceholderText('tokenBottomSheet.searchAssets')
    expect(searchInput).toBeTruthy()

    expect(getByTestId('cUSDTouchable')).toBeTruthy()
    expect(getByTestId('cEURTouchable')).toBeTruthy()
    expect(getByTestId('TTTouchable')).toBeTruthy()

    fireEvent.changeText(searchInput, 'Celo')
    // Wait for the analytics debounce
    jest.advanceTimersByTime(DEBOUCE_WAIT_TIME)

    expect(ValoraAnalytics.track).toBeCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(TokenBottomSheetEvents.search_token, {
      origin: TokenPickerOrigin.Send,
      searchInput: 'Celo',
    })

    expect(getByTestId('cUSDTouchable')).toBeTruthy()
    expect(getByTestId('cEURTouchable')).toBeTruthy()
    expect(queryByTestId('TTTouchable')).toBeNull()

    fireEvent.changeText(searchInput, 'Test')
    // Wait for the analytics debounce
    jest.advanceTimersByTime(DEBOUCE_WAIT_TIME)

    expect(ValoraAnalytics.track).toBeCalledTimes(2)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(TokenBottomSheetEvents.search_token, {
      origin: TokenPickerOrigin.Send,
      searchInput: 'Test',
    })

    expect(queryByTestId('cUSDTouchable')).toBeNull()
    expect(queryByTestId('cEURTouchable')).toBeNull()
    expect(getByTestId('TTTouchable')).toBeTruthy()

    fireEvent.changeText(searchInput, 'Usd')
    // Wait for the analytics debounce
    jest.advanceTimersByTime(DEBOUCE_WAIT_TIME)

    expect(ValoraAnalytics.track).toBeCalledTimes(3)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(TokenBottomSheetEvents.search_token, {
      origin: TokenPickerOrigin.Send,
      searchInput: 'Usd',
    })

    expect(getByTestId('cUSDTouchable')).toBeTruthy()
    expect(queryByTestId('cEURTouchable')).toBeNull()
    expect(queryByTestId('TTTouchable')).toBeNull()
  })

  it('does not send events for temporary search inputs', () => {
    const { getByPlaceholderText } = renderBottomSheet({
      searchEnabled: true,
    })
    const searchInput = getByPlaceholderText('tokenBottomSheet.searchAssets')

    fireEvent.changeText(searchInput, 'TemporaryInput')
    fireEvent.changeText(searchInput, 'FinalInput')
    // Wait for the analytics debounce
    jest.advanceTimersByTime(DEBOUCE_WAIT_TIME)

    expect(ValoraAnalytics.track).toBeCalledTimes(1)
    // We don't send events for intermediate search inputs
    expect(ValoraAnalytics.track).not.toHaveBeenCalledWith(TokenBottomSheetEvents.search_token, {
      origin: TokenPickerOrigin.Send,
      searchInput: 'TemporaryInput',
    })

    expect(ValoraAnalytics.track).toHaveBeenCalledWith(TokenBottomSheetEvents.search_token, {
      origin: TokenPickerOrigin.Send,
      searchInput: 'FinalInput',
    })
  })
})
