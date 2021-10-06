import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import CashInBottomSheet from 'src/home/CashInBottomSheet'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { createMockStore } from 'test/utils'

describe('CashInBottomSheet', () => {
  it('renders correctly', () => {
    const tree = render(
      <Provider store={createMockStore({})}>
        <CashInBottomSheet />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('navigates to the add funds page when the add funds button is clicked', () => {
    const { getByTestId } = render(
      <Provider store={createMockStore({})}>
        <CashInBottomSheet />
      </Provider>
    )

    fireEvent.press(getByTestId('cashInBtn'))
    expect(navigate).toHaveBeenCalledWith(Screens.FiatExchangeOptions, {
      isCashIn: true,
    })
  })
})
