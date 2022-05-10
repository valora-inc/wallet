import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { navigate } from 'src/navigator/NavigationService'
import RewardsPill from 'src/navigator/RewardsPill'
import { Screens } from 'src/navigator/Screens'
import { createMockStore } from 'test/utils'
import { mockAccount } from 'test/values'

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
})
