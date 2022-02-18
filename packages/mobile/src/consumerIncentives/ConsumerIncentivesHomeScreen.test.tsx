import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import { SUPERCHARGE_T_AND_C } from 'src/config'
import ConsumerIncentivesHomeScreen from 'src/consumerIncentives/ConsumerIncentivesHomeScreen'
import { SuperchargeToken } from 'src/consumerIncentives/types'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StoredTokenBalance } from 'src/tokens/reducer'
import { createMockStore } from 'test/utils'
import { mockCusdAddress } from 'test/values'

interface TokenBalances {
  [address: string]: Partial<StoredTokenBalance> | undefined
}

const CUSD_BALANCE: TokenBalances = {
  [mockCusdAddress]: {
    balance: '50',
    symbol: SuperchargeToken.cUSD,
    isCoreToken: true,
  },
}
const NO_BALANCES: TokenBalances = {
  [mockCusdAddress]: {
    balance: '5',
    symbol: SuperchargeToken.cUSD,
    isCoreToken: true,
  },
}

const createStore = ({
  numberVerified,
  tokenBalances,
}: {
  numberVerified: boolean
  tokenBalances: TokenBalances
}) =>
  createMockStore({
    app: {
      numberVerified,
      superchargeTokens: [
        {
          token: SuperchargeToken.cUSD,
          minBalance: 10,
          maxBalance: 1000,
        },
        {
          token: SuperchargeToken.cREAL,
          minBalance: 50,
          maxBalance: 6000,
        },
      ],
    },
    tokens: { tokenBalances },
  })

describe('ConsumerIncentivesHomeScreen', () => {
  beforeEach(() => jest.useRealTimers())

  it('renders Supercharge instructions when not Supercharging', async () => {
    const { queryByTestId } = render(
      <Provider
        store={createStore({
          numberVerified: false,
          tokenBalances: NO_BALANCES,
        })}
      >
        <ConsumerIncentivesHomeScreen />
      </Provider>
    )
    expect(queryByTestId('ConsumerIncentives/CTA')).toBeTruthy()
    expect(queryByTestId('LearnMore')).toBeTruthy()
    expect(queryByTestId('SuperchargeInstructions')).toBeTruthy()
    expect(queryByTestId('SuperchargingInfo')).toBeFalsy()
  })

  it('renders Supercharge Info when Supercharging', async () => {
    const { queryByTestId } = render(
      <Provider
        store={createStore({
          numberVerified: true,
          tokenBalances: CUSD_BALANCE,
        })}
      >
        <ConsumerIncentivesHomeScreen />
      </Provider>
    )
    expect(queryByTestId('ConsumerIncentives/CTA')).toBeTruthy()
    expect(queryByTestId('LearnMore')).toBeTruthy()
    expect(queryByTestId('SuperchargeInstructions')).toBeFalsy()
    expect(queryByTestId('SuperchargingInfo')).toBeTruthy()
  })

  it('navigates to cash in screen if user is verified and CTA is tapped', async () => {
    const { getByTestId } = render(
      <Provider
        store={createStore({
          numberVerified: true,
          tokenBalances: NO_BALANCES,
        })}
      >
        <ConsumerIncentivesHomeScreen />
      </Provider>
    )

    fireEvent.press(getByTestId('ConsumerIncentives/CTA'))
    expect(navigate).toHaveBeenCalledWith(Screens.FiatExchangeOptions, { isCashIn: true })
  })

  it('navigates to Phone Confirmation screen if user is not verified and CTA is tapped', async () => {
    const { getByTestId } = render(
      <Provider
        store={createStore({
          numberVerified: false,
          tokenBalances: NO_BALANCES,
        })}
      >
        <ConsumerIncentivesHomeScreen />
      </Provider>
    )
    fireEvent.press(getByTestId('ConsumerIncentives/CTA'))

    expect(navigate).toHaveBeenCalledWith(Screens.VerificationEducationScreen, {
      hideOnboardingStep: true,
    })
  })

  it('opens a WebView when Learn More is tapped', async () => {
    const { getByTestId } = render(
      <Provider
        store={createStore({
          numberVerified: true,
          tokenBalances: NO_BALANCES,
        })}
      >
        <ConsumerIncentivesHomeScreen />
      </Provider>
    )
    fireEvent.press(getByTestId('LearnMore'))

    expect(navigate).toHaveBeenCalledWith(Screens.WebViewScreen, { uri: SUPERCHARGE_T_AND_C })
  })
})
