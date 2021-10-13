import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import { CELO_REWARDS_T_AND_C } from 'src/config'
import ConsumerIncentivesHomeScreen from 'src/consumerIncentives/ConsumerIncentivesHomeScreen'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { Currency } from 'src/utils/currencies'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

const mockScreenProps = getMockStackScreenProps(Screens.ConsumerIncentivesHomeScreen)

const createStore = (numberVerified: boolean) =>
  createMockStore({
    app: { numberVerified },
    stableToken: { balances: { [Currency.Dollar]: '1000' } },
  })

describe('ConsumerIncentivesHomeScreen', () => {
  beforeEach(() => jest.useRealTimers())

  it('renders correctly', async () => {
    const tree = render(
      <Provider store={createStore(true)}>
        <ConsumerIncentivesHomeScreen {...mockScreenProps} />
      </Provider>
    )
    expect(tree.queryByTestId('ConsumerIncentives/CTA')).toBeTruthy()
    expect(tree.queryByTestId('ConsumerIncentives/learnMore')).toBeTruthy()
    expect(tree).toMatchSnapshot()
  })

  it('navigates to cash in screen if user is verified and CTA is tapped', async () => {
    const { getByTestId } = render(
      <Provider store={createStore(true)}>
        <ConsumerIncentivesHomeScreen {...mockScreenProps} />
      </Provider>
    )

    fireEvent.press(getByTestId('ConsumerIncentives/CTA'))
    expect(navigate).toHaveBeenCalledWith(Screens.FiatExchangeOptions, { isCashIn: true })
  })

  it('navigates to Phone Confirmation screen if user is not verified and CTA is tapped', async () => {
    const { getByTestId } = render(
      <Provider store={createStore(false)}>
        <ConsumerIncentivesHomeScreen {...mockScreenProps} />
      </Provider>
    )
    fireEvent.press(getByTestId('ConsumerIncentives/CTA'))

    expect(navigate).toHaveBeenCalledWith(Screens.VerificationEducationScreen, {
      hideOnboardingStep: true,
    })
  })

  it('opens a WebView when Learn More is tapped', async () => {
    const { getByTestId } = render(
      <Provider store={createStore(true)}>
        <ConsumerIncentivesHomeScreen {...mockScreenProps} />
      </Provider>
    )
    fireEvent.press(getByTestId('ConsumerIncentives/learnMore'))

    expect(navigate).toHaveBeenCalledWith(Screens.WebViewScreen, { uri: CELO_REWARDS_T_AND_C })
  })
})
