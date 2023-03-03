import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import { ReactTestInstance } from 'react-test-renderer'
import { MockStoreEnhanced } from 'redux-mock-store'
import { SUPERCHARGE_LEARN_MORE } from 'src/config'
import ConsumerIncentivesHomeScreen from 'src/consumerIncentives/ConsumerIncentivesHomeScreen'
import { initialState, State } from 'src/consumerIncentives/slice'
import {
  ONE_CUSD_REWARD_RESPONSE,
  ONE_CUSD_REWARD_RESPONSE_V2,
} from 'src/consumerIncentives/testValues'
import { FiatExchangeFlow } from 'src/fiatExchanges/utils'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { StoredTokenBalance } from 'src/tokens/slice'
import { createMockStore } from 'test/utils'
import { mockCeurAddress, mockCusdAddress } from 'test/values'
interface TokenBalances {
  [address: string]: StoredTokenBalance
}

const CUSD_TOKEN_BALANCE = {
  address: mockCusdAddress,
  balance: '50',
  usdPrice: '1',
  symbol: 'cUSD',
  decimals: 18,
  imageUrl: '',
  isCoreToken: true,
  name: 'cUSD',
  priceFetchedAt: Date.now(),
}

const ONLY_CUSD_BALANCE: TokenBalances = {
  [mockCusdAddress]: CUSD_TOKEN_BALANCE,
}
const NO_BALANCES: TokenBalances = {
  [mockCusdAddress]: {
    ...CUSD_TOKEN_BALANCE,
    balance: '5',
  },
}

function expectVisibleMainComponents(
  queryByTestId: (testId: string) => ReactTestInstance | null,
  mainComponentTestId: string
) {
  expect(queryByTestId('ConsumerIncentives/CTA')).toBeTruthy()
  expect(queryByTestId('LearnMore')).toBeTruthy()
  const componentTestIds = [
    'SuperchargeLoading',
    'ClaimSuperchargeDescription',
    'SuperchargingInfo',
    'SuperchargeInstructions',
  ]
  for (const testId of componentTestIds) {
    if (testId === mainComponentTestId) {
      expect(queryByTestId(testId)).not.toBeNull()
    } else {
      expect(queryByTestId(testId)).toBeNull()
    }
  }
}

describe('ConsumerIncentivesHomeScreen', () => {
  let store: MockStoreEnhanced<RootState, {}>

  function createStore({
    numberVerified,
    tokenBalances,
    supercharge = initialState,
    numberVerifiedCentrally = false,
  }: {
    numberVerified: boolean
    tokenBalances: TokenBalances
    supercharge?: State
    numberVerifiedCentrally?: boolean
  }) {
    store = createMockStore({
      app: {
        numberVerified,
        phoneNumberVerified: numberVerifiedCentrally,
        superchargeTokenConfigByToken: {
          [mockCusdAddress]: {
            minBalance: 10,
            maxBalance: 1000,
          },
          [mockCeurAddress]: {
            minBalance: 10,
            maxBalance: 1000,
          },
        },
      },
      tokens: { tokenBalances },
      supercharge,
    })
    return store
  }

  it('renders Supercharge instructions when there is no balance', () => {
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

    expectVisibleMainComponents(queryByTestId, 'SuperchargeInstructions')
  })

  it('renders instructions when user is not verified for supercharge v2', () => {
    const { queryByTestId } = render(
      <Provider
        store={createStore({
          numberVerified: true,
          tokenBalances: ONLY_CUSD_BALANCE,
          numberVerifiedCentrally: false,
          supercharge: {
            ...initialState,
            superchargeV2Enabled: true,
          },
        })}
      >
        <ConsumerIncentivesHomeScreen />
      </Provider>
    )

    expectVisibleMainComponents(queryByTestId, 'SuperchargeInstructions')
  })

  it('renders Supercharge Info when there is balance', () => {
    const { queryByTestId } = render(
      <Provider
        store={createStore({
          numberVerified: true,
          tokenBalances: ONLY_CUSD_BALANCE,
        })}
      >
        <ConsumerIncentivesHomeScreen />
      </Provider>
    )

    expectVisibleMainComponents(queryByTestId, 'SuperchargingInfo')
  })

  it('renders available v1 rewards to claim when they are available', () => {
    const { queryByTestId, getByText } = render(
      <Provider
        store={createStore({
          numberVerified: true,
          tokenBalances: ONLY_CUSD_BALANCE,
          supercharge: {
            ...initialState,
            availableRewards: ONE_CUSD_REWARD_RESPONSE,
          },
        })}
      >
        <ConsumerIncentivesHomeScreen />
      </Provider>
    )

    expectVisibleMainComponents(queryByTestId, 'ClaimSuperchargeDescription')
    expect(getByText('superchargeRewardsAvailable, {"token":"cUSD","amount":"1.00"}')).toBeTruthy()
  })

  it('renders available v2 rewards to claim when they are available', () => {
    const { queryByTestId, getByText } = render(
      <Provider
        store={createStore({
          numberVerified: true,
          tokenBalances: ONLY_CUSD_BALANCE,
          supercharge: {
            ...initialState,
            superchargeV2Enabled: true,
            availableRewards: [ONE_CUSD_REWARD_RESPONSE_V2],
          },
        })}
      >
        <ConsumerIncentivesHomeScreen />
      </Provider>
    )

    expectVisibleMainComponents(queryByTestId, 'ClaimSuperchargeDescription')
    expect(getByText('superchargeRewardsAvailable, {"token":"cUSD","amount":"1.00"}')).toBeTruthy()
  })

  it('navigates to cash in screen if user is verified and CTA is tapped', () => {
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
    expect(navigate).toHaveBeenCalledWith(Screens.FiatExchangeCurrency, {
      flow: FiatExchangeFlow.CashIn,
    })
  })

  it('navigates to Phone Confirmation screen if user is not verified and CTA is tapped', () => {
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

    expect(navigate).toHaveBeenCalledWith(Screens.VerificationStartScreen, {
      hideOnboardingStep: true,
    })
  })

  it('opens a WebView when Learn More is tapped', () => {
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

    expect(navigate).toHaveBeenCalledWith(Screens.WebViewScreen, { uri: SUPERCHARGE_LEARN_MORE })
  })

  it('dispatches a claim rewards action when CTA is tapped', () => {
    const { getByTestId } = render(
      <Provider
        store={createStore({
          numberVerified: true,
          tokenBalances: ONLY_CUSD_BALANCE,
          supercharge: {
            ...initialState,
            availableRewards: ONE_CUSD_REWARD_RESPONSE,
          },
        })}
      >
        <ConsumerIncentivesHomeScreen />
      </Provider>
    )

    fireEvent.press(getByTestId('ConsumerIncentives/CTA'))

    // One action to fetch rewards and other one to claim them
    expect(store.getActions().length).toBe(2)
    expect(store.getActions()[0]).toMatchInlineSnapshot(`
      Object {
        "payload": undefined,
        "type": "supercharge/fetchAvailableRewards",
      }
    `)
    expect(store.getActions()[1]).toMatchInlineSnapshot(`
      Object {
        "payload": Array [
          Object {
            "amount": "de0b6b3a7640000",
            "contractAddress": "0xdistributorContract",
            "createdAt": 1645591363099,
            "index": 0,
            "proof": Array [],
            "tokenAddress": "0x874069fa1eb16d44d622f2e0ca25eea172369bc1",
          },
        ],
        "type": "supercharge/claimRewards",
      }
    `)
  })

  it('dispatches a fetch rewards action when opened', () => {
    render(
      <Provider
        store={createStore({
          numberVerified: true,
          tokenBalances: ONLY_CUSD_BALANCE,
        })}
      >
        <ConsumerIncentivesHomeScreen />
      </Provider>
    )

    expect(store.getActions().length).toBe(1)
    expect(store.getActions()[0]).toMatchInlineSnapshot(`
      Object {
        "payload": undefined,
        "type": "supercharge/fetchAvailableRewards",
      }
    `)
  })
})
