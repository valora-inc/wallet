import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { navigate } from 'src/navigator/NavigationService'
import RewardsPill from 'src/navigator/RewardsPill'
import { Screens } from 'src/navigator/Screens'
import { getFeatureGate } from 'src/statsig'
import { createMockStore } from 'test/utils'
import { mockAccount, mockCusdAddress, mockCusdTokenId, mockTokenBalances } from 'test/values'

jest.mock('src/statsig')

const stateWithInsufficientBalanceForSupercharge = {
  app: {
    phoneNumberVerified: true,
    superchargeTokenConfigByToken: {
      [mockCusdAddress]: {
        minBalance: 10,
        maxBalance: 1000,
      },
    },
  },
  tokens: {
    tokenBalances: {
      [mockCusdTokenId]: mockTokenBalances[mockCusdTokenId],
    },
  },
}

const stateWithSuperchargeEnabled = {
  ...stateWithInsufficientBalanceForSupercharge,
  tokens: {
    tokenBalances: {
      [mockCusdTokenId]: { ...mockTokenBalances[mockCusdTokenId], balance: '50' },
    },
  },
}

describe('RewardsPill', () => {
  it('renders correctly', () => {
    const tree = render(
      <Provider
        store={createMockStore({
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
          web3: { mtwAddress: mockAccount },
        })}
      >
        <RewardsPill />)
      </Provider>
    )
    fireEvent.press(getByTestId('EarnRewards'))
    expect(navigate).toBeCalledWith(Screens.ConsumerIncentivesHomeScreen)
  })

  it('renders if the user is eligible for rewards in a restricted environment', () => {
    jest.mocked(getFeatureGate).mockReturnValue(true)

    const { getByTestId } = render(
      <Provider store={createMockStore(stateWithSuperchargeEnabled)}>
        <RewardsPill />
      </Provider>
    )

    expect(getByTestId('EarnRewards')).toBeTruthy()
  })

  it('does not render if the user is not eligible for rewards in a restricted environment', () => {
    jest.mocked(getFeatureGate).mockReturnValue(true)

    const { queryByTestId } = render(
      <Provider store={createMockStore(stateWithInsufficientBalanceForSupercharge)}>
        <RewardsPill />
      </Provider>
    )

    expect(queryByTestId('EarnRewards')).toBeFalsy()
  })

  it('renders if the user is not eligible for rewards in a non-restricted environment', () => {
    jest.mocked(getFeatureGate).mockReturnValue(false)

    const { getByTestId } = render(
      <Provider store={createMockStore(stateWithInsufficientBalanceForSupercharge)}>
        <RewardsPill />
      </Provider>
    )

    expect(getByTestId('EarnRewards')).toBeTruthy()
  })
})
