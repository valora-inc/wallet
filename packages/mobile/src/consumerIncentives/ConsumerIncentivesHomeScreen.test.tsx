import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import { ReactTestInstance } from 'react-test-renderer'
import { MockStoreEnhanced } from 'redux-mock-store'
import { useFetchSuperchargeRewards } from 'src/api/slice'
import { SUPERCHARGE_T_AND_C } from 'src/config'
import ConsumerIncentivesHomeScreen from 'src/consumerIncentives/ConsumerIncentivesHomeScreen'
import { SuperchargePendingReward, SuperchargeToken } from 'src/consumerIncentives/types'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { StoredTokenBalance } from 'src/tokens/reducer'
import { createMockStore } from 'test/utils'
import { mockCusdAddress } from 'test/values'

jest.mock('src/api/slice', () => ({
  ...(jest.requireActual('src/api/slice') as any),
  useFetchSuperchargeRewards: jest.fn(),
}))

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

const EMPTY_REWARDS_RESPONSE: SuperchargePendingReward[] = []
export const ONE_CUSD_REWARD_RESPONSE: SuperchargePendingReward[] = [
  {
    contractAddress: '0xdistributorContract',
    tokenAddress: mockCusdAddress,
    amount: (1e18).toString(16),
    index: 0,
    proof: [],
    createdAt: 1645591363099,
  },
]

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
  beforeEach(() => mockQueryResponse(EMPTY_REWARDS_RESPONSE))

  function createStore({
    numberVerified,
    tokenBalances,
  }: {
    numberVerified: boolean
    tokenBalances: TokenBalances
  }) {
    store = createMockStore({
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
    return store
  }

  function mockQueryResponse(data: SuperchargePendingReward[]) {
    ;(useFetchSuperchargeRewards as jest.Mock).mockImplementation(() => ({
      superchargeRewards: data,
      isLoading: false,
      isError: false,
    }))
  }

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

    expectVisibleMainComponents(queryByTestId, 'SuperchargeInstructions')
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

    expectVisibleMainComponents(queryByTestId, 'SuperchargingInfo')
  })

  it('renders available rewards to claim when they are available', async () => {
    mockQueryResponse(ONE_CUSD_REWARD_RESPONSE)
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

    expectVisibleMainComponents(queryByTestId, 'ClaimSuperchargeDescription')
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

  it('dispatches a claim rewards action when CTA is tapped', async () => {
    mockQueryResponse(ONE_CUSD_REWARD_RESPONSE)
    const { getByTestId } = render(
      <Provider
        store={createStore({
          numberVerified: true,
          tokenBalances: CUSD_BALANCE,
        })}
      >
        <ConsumerIncentivesHomeScreen />
      </Provider>
    )

    fireEvent.press(getByTestId('ConsumerIncentives/CTA'))

    expect(store.getActions()).toMatchInlineSnapshot(`
      Array [
        Object {
          "payload": Array [
            Object {
              "amount": "de0b6b3a7640000",
              "contractAddress": "0xdistributorContract",
              "createdAt": 1645591363099,
              "index": 0,
              "proof": Array [],
              "tokenAddress": "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
            },
          ],
          "type": "supercharge/claimRewards",
        },
      ]
    `)
  })
})
