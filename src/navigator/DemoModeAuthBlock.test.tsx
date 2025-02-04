import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import DemoModeAuthBlock from 'src/navigator/DemoModeAuthBlock'
import { navigateBack, navigateClearingStack } from 'src/navigator/NavigationService'
import { demoModeToggled } from 'src/web3/actions'
import { createMockStore } from 'test/utils'
import { mockAccount } from 'test/values'

jest.mock('src/statsig')

describe('DemoModeAuthBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly and executes the expected actions on button press', () => {
    const store = createMockStore({
      web3: {
        account: mockAccount,
      },
    })
    const { getByText } = render(
      <Provider store={store}>
        <DemoModeAuthBlock />
      </Provider>
    )

    expect(getByText('demoMode.restrictedAccess.title')).toBeTruthy()
    expect(getByText('demoMode.restrictedAccess.info')).toBeTruthy()

    fireEvent.press(getByText('demoMode.restrictedAccess.cta'))

    expect(store.getActions()).toEqual([demoModeToggled(false)])
    expect(navigateBack).toHaveBeenCalledTimes(1)
    expect(navigateClearingStack).not.toHaveBeenCalled()

    fireEvent.press(getByText('dismiss'))
    expect(navigateBack).toHaveBeenCalledTimes(2)
  })

  it('navigates to onboarding when exiting demo mode', () => {
    const store = createMockStore({
      web3: {
        account: null, // no wallet set up
      },
    })
    const { getByText } = render(
      <Provider store={store}>
        <DemoModeAuthBlock />
      </Provider>
    )

    fireEvent.press(getByText('demoMode.restrictedAccess.cta'))

    expect(store.getActions()).toEqual([demoModeToggled(false)])
    expect(navigateBack).toHaveBeenCalled()
    expect(navigateClearingStack).toHaveBeenCalled()
  })
})
