import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import CashInSuccessScreen from 'src/fiatExchanges/CashInSuccess'
import { navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

const store = createMockStore()

describe('CashinInSuccess', () => {
  it('renders correctly with a provider', () => {
    const mockScreenProps = getMockStackScreenProps(Screens.CashInSuccess, {
      provider: 'Moonpay',
    })

    const tree = render(
      <Provider store={store}>
        <CashInSuccessScreen {...mockScreenProps} />
      </Provider>
    )

    expect(tree).toMatchSnapshot()
  })

  it('renders correctly without a provider', () => {
    const mockScreenProps = getMockStackScreenProps(Screens.CashInSuccess, {
      provider: undefined,
    })

    const tree = render(
      <Provider store={store}>
        <CashInSuccessScreen {...mockScreenProps} />
      </Provider>
    )

    expect(tree).toMatchSnapshot()
  })

  it('goes home when the continue button is pressed', () => {
    const mockScreenProps = getMockStackScreenProps(Screens.CashInSuccess, {
      provider: 'Moonpay',
    })

    const tree = render(
      <Provider store={store}>
        <CashInSuccessScreen {...mockScreenProps} />
      </Provider>
    )

    fireEvent.press(tree.getByTestId('SuccessContinue'))
    expect(navigateHome).toHaveBeenCalled()
  })
})
