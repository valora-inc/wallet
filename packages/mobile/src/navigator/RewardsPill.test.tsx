import * as React from 'react'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import { navigate } from 'src/navigator/NavigationService'
import RewardsPill from 'src/navigator/RewardsPill'
import { Screens } from 'src/navigator/Screens'
import { createMockStore } from 'test/utils'

describe('RewardsPill', () => {
  it('renders correctly', () => {
    const tree = render(
      <Provider
        store={createMockStore({
          account: { rewardsEnabled: true },
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
          account: { rewardsEnabled: true },
        })}
      >
        <RewardsPill />)
      </Provider>
    )
    fireEvent.press(getByTestId('EarnRewards'))
    expect(navigate).toBeCalledWith(Screens.ConsumerIncentivesHomeScreen)
  })
})
