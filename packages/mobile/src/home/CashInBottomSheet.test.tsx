import * as React from 'react'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import CashInBottomSheet from 'src/home/CashInBottomSheet'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { createMockStore } from 'test/utils'

describe('CashInBottomSheet', () => {
  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={createMockStore({})}>
        <CashInBottomSheet />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('navigates to the add funds page when the add funds button is clicked', () => {
    const tree = render(
      <Provider store={createMockStore({})}>
        <CashInBottomSheet />
      </Provider>
    )

    fireEvent.press(tree.getByTestId('cashInBtn'))
    expect(navigate).toHaveBeenCalledWith(Screens.FiatExchangeOptions, {
      isCashIn: true,
    })
  })
})
