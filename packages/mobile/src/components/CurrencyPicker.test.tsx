import * as React from 'react'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import CurrencyPicker, { CurrencyPickerOrigin } from 'src/components/CurrencyPicker'
import { Currency } from 'src/utils/currencies'
import { createMockStore } from 'test/utils'

const mockStore = createMockStore({
  stableToken: {
    balance: '10',
    cEurBalance: '20',
  },
})

const onCurrencySelectedMock = jest.fn()

describe('CurrencyPicker', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  function renderPicker(visible: boolean) {
    return render(
      <Provider store={mockStore}>
        <CurrencyPicker
          isVisible={visible}
          origin={CurrencyPickerOrigin.Send}
          onCurrencySelected={onCurrencySelectedMock}
        />
      </Provider>
    )
  }

  it('renders correctly', () => {
    const tree = renderPicker(true)

    expect(tree.queryByTestId('CurrencyPickerContainer')).toBeTruthy()
    expect(tree.queryByTestId('LocalcUSDBalance')).toBeTruthy()
    expect(tree.queryByTestId('cUSDBalance')).toBeTruthy()
    expect(tree.queryByTestId('LocalcEURBalance')).toBeTruthy()
    expect(tree.queryByTestId('cEURBalance')).toBeTruthy()
    expect(tree).toMatchSnapshot()
  })

  it('handles the choosing of a currency correctly', () => {
    const { getByTestId } = renderPicker(true)

    fireEvent.press(getByTestId('cUSDTouchable'))
    expect(onCurrencySelectedMock).toHaveBeenLastCalledWith(Currency.Dollar)

    fireEvent.press(getByTestId('cEURTouchable'))
    expect(onCurrencySelectedMock).toHaveBeenLastCalledWith(Currency.Euro)
  })

  it('renders nothing if not visible', () => {
    const { queryByTestId } = renderPicker(false)
    expect(queryByTestId('CurrencyPickerContainer')).toBeFalsy()
  })
})
