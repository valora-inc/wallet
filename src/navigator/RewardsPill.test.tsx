import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { navigate } from 'src/navigator/NavigationService'
import RewardsPill from 'src/navigator/RewardsPill'
import { Screens } from 'src/navigator/Screens'
import { createMockStore } from 'test/utils'
import { mockAccount } from 'test/values'

const mockCusdAddress = '0xcusd'
const mockCeurAddress = '0xceur'

const superchargeState = {
  app: {
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
  tokens: {
    tokenBalances: {
      [mockCusdAddress]: {
        address: mockCusdAddress,
        symbol: 'cUSD',
        decimals: 18,
        balance: '1',
        isCoreToken: true,
        usdPrice: '1',
        priceFetchedAt: Date.now(),
      },
      [mockCeurAddress]: {
        address: mockCeurAddress,
        symbol: 'cEUR',
        decimals: 18,
        balance: '0',
        usdPrice: '1',
        isCoreToken: true,
        priceFetchedAt: Date.now(),
      },
    },
  },
}

describe('RewardsPill', () => {
  it('renders correctly', () => {
    const tree = render(
      <Provider
        store={createMockStore({
          ...superchargeState,
          web3: { mtwAddress: mockAccount },
        })}
      >
        <RewardsPill />)
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('opens the consumer incentives screen when pressed', () => {
    const { getByTestId } = render(
      <Provider
        store={createMockStore({
          ...superchargeState,
          web3: { mtwAddress: mockAccount },
        })}
      >
        <RewardsPill />)
      </Provider>
    )
    fireEvent.press(getByTestId('EarnRewards'))
    expect(navigate).toBeCalledWith(Screens.ConsumerIncentivesHomeScreen)
  })
})
