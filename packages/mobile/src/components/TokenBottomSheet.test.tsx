import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import TokenBottomSheet, { TokenPickerOrigin } from 'src/components/TokenBottomSheet'
import { Currency } from 'src/utils/currencies'
import { createMockStore, getElementText } from 'test/utils'
import { mockCeurAddress, mockCusdAddress, mockTestTokenAddress } from 'test/values'

jest.mock('src/components/useShowOrHideAnimation')

const mockStore = createMockStore({
  stableToken: {
    balances: { [Currency.Dollar]: '100', [Currency.Euro]: '200' },
  },
  tokens: {
    tokenBalances: {
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
      [mockTestTokenAddress]: {
        balance: '10',
        symbol: 'TT',
        address: mockTestTokenAddress,
        priceFetchedAt: Date.now(),
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

  beforeEach(() => {
    jest.clearAllMocks()
  })

  function renderPicker(visible: boolean, isInvite: boolean = false) {
    return render(
      <Provider store={mockStore}>
        <TokenBottomSheet
          isVisible={visible}
          isInvite={isInvite}
          origin={TokenPickerOrigin.Send}
          onTokenSelected={onTokenSelectedMock}
          onClose={onCloseMock}
        />
      </Provider>
    )
  }

  it('renders correctly', () => {
    const tree = renderPicker(true)
    const { getByTestId } = tree

    expect(tree.getByTestId('BottomSheetContainer')).toBeTruthy()

    expect(getElementText(getByTestId('cUSDBalance'))).toBe('10.00 cUSD')
    expect(getElementText(getByTestId('LocalcUSDBalance'))).toBe('₱13.30')
    expect(getElementText(getByTestId('cEURBalance'))).toBe('20.00 cEUR')
    expect(getElementText(getByTestId('LocalcEURBalance'))).toBe('₱31.92') // 20 * 1.2 (cEUR price) * 1.33 (PHP price)
    expect(getElementText(getByTestId('TTBalance'))).toBe('10.00 TT')

    expect(tree).toMatchSnapshot()
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

  it("shows only invite tokens if it's an invite", () => {
    const { queryByTestId, getByTestId } = renderPicker(true, true)

    expect(getByTestId('BottomSheetContainer')).toBeTruthy()
    expect(getElementText(getByTestId('cUSDBalance'))).toBe('10.00 cUSD')
    expect(queryByTestId('TTBalance')).toBeFalsy()
  })
})
