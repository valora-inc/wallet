import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import TokenBottomSheetLegacy, { TokenPickerOrigin } from 'src/components/TokenBottomSheetLegacy'
import { Currency } from 'src/utils/currencies'
import { createMockStore } from 'test/utils'

jest.mock('src/components/useShowOrHideAnimation')

const mockStore = createMockStore({
  stableToken: {
    balances: { [Currency.Dollar]: '10', [Currency.Euro]: '20' },
  },
})

const onCurrencySelectedMock = jest.fn()
const onCloseMock = jest.fn()

describe('TokenBottomSheetLegacy', () => {
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
        <TokenBottomSheetLegacy
          isVisible={visible}
          origin={TokenPickerOrigin.Send}
          onCurrencySelected={onCurrencySelectedMock}
          onClose={onCloseMock}
        />
      </Provider>
    )
  }

  it('renders correctly', () => {
    const tree = renderPicker(true)

    expect(tree.getByTestId('TokenBottomSheetContainer')).toBeTruthy()
    expect(tree.getByTestId('LocalcUSDBalance/value')).toBeTruthy()
    expect(tree.getByTestId('cUSDBalance/value')).toBeTruthy()
    expect(tree.getByTestId('LocalcEURBalance/value')).toBeTruthy()
    expect(tree.getByTestId('cEURBalance/value')).toBeTruthy()
    expect(tree).toMatchSnapshot()
  })

  it('handles the choosing of a currency correctly', () => {
    const { getByTestId } = renderPicker(true)

    fireEvent.press(getByTestId('cUSDTouchable'))
    expect(onCurrencySelectedMock).toHaveBeenLastCalledWith(Currency.Dollar)

    fireEvent.press(getByTestId('cEURTouchable'))
    expect(onCurrencySelectedMock).toHaveBeenLastCalledWith(Currency.Euro)
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
