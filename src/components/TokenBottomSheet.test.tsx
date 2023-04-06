import { act, fireEvent, render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Provider } from 'react-redux'
import { TokenBottomSheetEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import TokenBottomSheet, {
  DEBOUCE_WAIT_TIME,
  TokenPickerOrigin,
} from 'src/components/TokenBottomSheet'
import { TokenBalance } from 'src/tokens/slice'
import { createMockStore, getElementText } from 'test/utils'
import { mockCeurAddress, mockCusdAddress, mockTestTokenAddress } from 'test/values'

jest.mock('src/components/useShowOrHideAnimation')

const tokens: TokenBalance[] = [
  {
    balance: new BigNumber('10'),
    usdPrice: new BigNumber('1'),
    lastKnownUsdPrice: new BigNumber('1'),
    symbol: 'cUSD',
    address: mockCusdAddress,
    isCoreToken: true,
    priceFetchedAt: Date.now(),
    decimals: 18,
    name: 'Celo Dollar',
    imageUrl: '',
  },
  {
    balance: new BigNumber('20'),
    usdPrice: new BigNumber('1.2'),
    lastKnownUsdPrice: new BigNumber('1.2'),
    symbol: 'cEUR',
    address: mockCeurAddress,
    isCoreToken: true,
    priceFetchedAt: Date.now(),
    decimals: 18,
    name: 'Celo Euro',
    imageUrl: '',
  },
  {
    balance: new BigNumber('10'),
    symbol: 'TT',
    usdPrice: null,
    lastKnownUsdPrice: new BigNumber('1'),
    address: mockTestTokenAddress,
    priceFetchedAt: Date.now(),
    decimals: 18,
    name: 'Test Token',
    imageUrl: '',
  },
]

const mockStore = createMockStore({
  tokens: {
    tokenBalances: {
      [mockCusdAddress]: {
        balance: '10',
        usdPrice: '1',
        symbol: 'cUSD',
        address: mockCusdAddress,
        isCoreToken: true,
        priceFetchedAt: Date.now(),
        name: 'Celo Dollar',
      },
      [mockCeurAddress]: {
        balance: '20',
        usdPrice: '1.2',
        symbol: 'cEUR',
        address: mockCeurAddress,
        isCoreToken: true,
        priceFetchedAt: Date.now(),
        name: 'Celo Euro',
      },
      [mockTestTokenAddress]: {
        balance: '10',
        symbol: 'TT',
        address: mockTestTokenAddress,
        priceFetchedAt: Date.now(),
        name: 'Test Token',
      },
    },
  },
})

const onTokenSelectedMock = jest.fn()
const onCloseMock = jest.fn()

describe('TokenBottomSheet', () => {
  beforeAll(() => {
    // @ts-ignore This avoids an error, see: https://github.com/software-mansion/react-native-reanimated/issues/1380
    global.__reanimatedWorkletInit = jest.fn()
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  beforeEach(() => {
    // see: https://stackoverflow.com/questions/52695553/testing-debounced-function-in-react-component-with-jest-and-enzyme/64336022#64336022
    jest.useFakeTimers('modern')
    jest.clearAllMocks()
  })

  function renderPicker(visible: boolean, searchEnabled: boolean = false) {
    return render(
      <Provider store={mockStore}>
        <TokenBottomSheet
          title="testTitle"
          isVisible={visible}
          origin={TokenPickerOrigin.Send}
          onTokenSelected={onTokenSelectedMock}
          onClose={onCloseMock}
          tokens={tokens}
          searchEnabled={searchEnabled}
        />
      </Provider>
    )
  }

  it('renders correctly', () => {
    const { getByTestId } = renderPicker(true)

    expect(getByTestId('BottomSheetContainer')).toBeTruthy()

    expect(getElementText(getByTestId('cUSDBalance'))).toBe('10.00 cUSD')
    expect(getElementText(getByTestId('LocalcUSDBalance'))).toBe('₱13.30')
    expect(getElementText(getByTestId('cEURBalance'))).toBe('20.00 cEUR')
    expect(getElementText(getByTestId('LocalcEURBalance'))).toBe('₱31.92') // 20 * 1.2 (cEUR price) * 1.33 (PHP price)
    expect(getElementText(getByTestId('TTBalance'))).toBe('10.00 TT')
  })

  it('handles the choosing of a token correctly', () => {
    const { getByTestId } = renderPicker(true)

    fireEvent.press(getByTestId('cUSDTouchable'))
    expect(onTokenSelectedMock).toHaveBeenLastCalledWith(mockCusdAddress)

    fireEvent.press(getByTestId('cEURTouchable'))
    expect(onTokenSelectedMock).toHaveBeenLastCalledWith(mockCeurAddress)

    fireEvent.press(getByTestId('TTTouchable'))
    expect(onTokenSelectedMock).toHaveBeenLastCalledWith(mockTestTokenAddress)
  })

  it('handles taps on the background correctly', () => {
    const { getByTestId } = renderPicker(true)

    fireEvent.press(getByTestId('BackgroundTouchable'))
    expect(onCloseMock).toHaveBeenCalled()
  })

  it('renders nothing if not visible', () => {
    const { queryByTestId } = renderPicker(false)
    expect(queryByTestId('BottomSheetContainer')).toBeFalsy()
  })

  it('renders and behaves correctly when the search is enabled', () => {
    const { getByPlaceholderText, queryByTestId } = renderPicker(true, true)
    const searchInput = getByPlaceholderText('tokenBottomSheet.searchAssets')
    expect(searchInput).toBeTruthy()

    expect(queryByTestId('cUSDTouchable')).toBeTruthy()
    expect(queryByTestId('cEURTouchable')).toBeTruthy()
    expect(queryByTestId('TTTouchable')).toBeTruthy()

    act(() => {
      fireEvent.changeText(searchInput, 'Celo')
      // Wait for the analytics debounce
      jest.advanceTimersByTime(DEBOUCE_WAIT_TIME)
    })

    expect(ValoraAnalytics.track).toHaveBeenCalledWith(TokenBottomSheetEvents.search_token, {
      origin: TokenPickerOrigin.Send,
      searchInput: 'Celo',
    })

    expect(queryByTestId('cUSDTouchable')).toBeTruthy()
    expect(queryByTestId('cEURTouchable')).toBeTruthy()
    expect(queryByTestId('TTTouchable')).toBeNull()

    act(() => {
      fireEvent.changeText(searchInput, 'Test')
      // Wait for the analytics debounce
      jest.advanceTimersByTime(DEBOUCE_WAIT_TIME)
    })

    expect(ValoraAnalytics.track).toHaveBeenCalledWith(TokenBottomSheetEvents.search_token, {
      origin: TokenPickerOrigin.Send,
      searchInput: 'Test',
    })

    expect(queryByTestId('cUSDTouchable')).toBeNull()
    expect(queryByTestId('cEURTouchable')).toBeNull()
    expect(queryByTestId('TTTouchable')).toBeTruthy()

    act(() => {
      fireEvent.changeText(searchInput, 'Usd')
      // Wait for the analytics debounce
      jest.advanceTimersByTime(DEBOUCE_WAIT_TIME)
    })

    expect(ValoraAnalytics.track).toHaveBeenCalledWith(TokenBottomSheetEvents.search_token, {
      origin: TokenPickerOrigin.Send,
      searchInput: 'Usd',
    })

    expect(queryByTestId('cUSDTouchable')).toBeTruthy()
    expect(queryByTestId('cEURTouchable')).toBeNull()
    expect(queryByTestId('TTTouchable')).toBeNull()
  })

  it('does not send events for temporary search inputs', () => {
    const { getByPlaceholderText } = renderPicker(true, true)
    const searchInput = getByPlaceholderText('tokenBottomSheet.searchAssets')

    act(() => {
      fireEvent.changeText(searchInput, 'TemporaryInput')
      fireEvent.changeText(searchInput, 'FinalInput')
      // Wait for the analytics debounce
      jest.advanceTimersByTime(DEBOUCE_WAIT_TIME)
    })

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
