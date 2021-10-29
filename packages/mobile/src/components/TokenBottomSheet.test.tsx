import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import TokenBottomSheet, { TokenPickerOrigin } from 'src/components/TokenBottomSheet'
import { Currency } from 'src/utils/currencies'
import { amountFromComponent, createMockStore } from 'test/utils'
import { mockCeurAddress, mockCusdAddress } from 'test/values'

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
      },
      [mockCeurAddress]: {
        balance: '20',
        usdPrice: '1.2',
        symbol: 'cEUR',
        address: mockCeurAddress,
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

  function renderPicker(visible: boolean) {
    return render(
      <Provider store={mockStore}>
        <TokenBottomSheet
          isVisible={visible}
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

    expect(tree.getByTestId('TokenBottomSheetContainer')).toBeTruthy()

    expect(amountFromComponent(getByTestId('cUSDBalance'))).toBe('10.00 cUSD')
    expect(amountFromComponent(getByTestId('LocalcUSDBalance'))).toBe('$13.30')
    expect(amountFromComponent(getByTestId('cEURBalance'))).toBe('20.00 cEUR')
    expect(amountFromComponent(getByTestId('LocalcEURBalance'))).toBe('$31.92') // 20 * 1.2 (cEUR price) * 1.33 (MXN price)

    expect(tree).toMatchSnapshot()
  })

  it('handles the choosing of a token correctly', () => {
    const { getByTestId } = renderPicker(true)

    fireEvent.press(getByTestId('cUSDTouchable'))
    expect(onTokenSelectedMock).toHaveBeenLastCalledWith(mockCusdAddress)

    fireEvent.press(getByTestId('cEURTouchable'))
    expect(onTokenSelectedMock).toHaveBeenLastCalledWith(mockCeurAddress)
  })

  it('handles taps on the background correctly', () => {
    const { getByTestId } = renderPicker(true)

    fireEvent.press(getByTestId('BackgroundTouchable'))
    expect(onCloseMock).toHaveBeenCalled()
  })

  it('renders nothing if not visible', () => {
    const { queryByTestId } = renderPicker(false)
    expect(queryByTestId('TokenBottomSheetContainer')).toBeFalsy()
  })
})
