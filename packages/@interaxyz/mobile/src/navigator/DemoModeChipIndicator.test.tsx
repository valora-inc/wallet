import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import DemoModeChipIndicator from 'src/navigator/DemoModeChipIndicator'
import { navigateClearingStack } from 'src/navigator/NavigationService'
import { getDynamicConfigParams } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import { demoModeToggled } from 'src/web3/actions'
import { createMockStore } from 'test/utils'
import { mockAccount } from 'test/values'

jest.mock('src/statsig')
jest.mocked(getDynamicConfigParams).mockImplementation((configName) => {
  if (configName === DynamicConfigs[StatsigDynamicConfigs.DEMO_MODE_CONFIG]) {
    return { enabledInOnboarding: true }
  }
  throw new Error('Unexpected config name')
})

describe('DemoModeChipIndicator', () => {
  const defaultStore = createMockStore({
    web3: {
      demoModeEnabled: true,
      account: mockAccount,
    },
  })

  beforeEach(() => {
    jest.clearAllMocks()
    defaultStore.clearActions()
  })

  it('does not render when demo mode is not enabled', () => {
    const { toJSON } = render(
      <Provider
        store={createMockStore({
          web3: {
            demoModeEnabled: false,
          },
        })}
      >
        <DemoModeChipIndicator />
      </Provider>
    )

    expect(toJSON()).toBeNull()
  })

  it('renders when demoModeEnabled is true', () => {
    const { getByText } = render(
      <Provider store={defaultStore}>
        <DemoModeChipIndicator />
      </Provider>
    )

    expect(getByText('demoMode.inAppIndicatorLabel')).toBeTruthy()
  })

  it('opens bottom sheet when the chip is pressed', () => {
    const { getByText } = render(
      <Provider store={defaultStore}>
        <DemoModeChipIndicator />
      </Provider>
    )

    fireEvent.press(getByText('demoMode.inAppIndicatorLabel'))

    expect(getByText('demoMode.confirmExit.title')).toBeTruthy()
    expect(getByText('demoMode.confirmExit.info')).toBeTruthy()
    expect(getByText('demoMode.confirmExit.cta')).toBeTruthy()
  })

  it('dispatches the correct action when exiting demo mode', () => {
    const { getByText } = render(
      <Provider store={defaultStore}>
        <DemoModeChipIndicator />
      </Provider>
    )

    expect(defaultStore.getActions()).toEqual([])

    fireEvent.press(getByText('demoMode.confirmExit.cta'))

    expect(defaultStore.getActions()).toEqual([demoModeToggled(false)])
    expect(navigateClearingStack).not.toHaveBeenCalled()
  })

  it('dispatches the correct action and navigates to onboarding when exiting demo mode', () => {
    const store = createMockStore({
      web3: {
        demoModeEnabled: true,
        account: null, // no wallet set up
      },
    })
    const { getByText } = render(
      <Provider store={store}>
        <DemoModeChipIndicator />
      </Provider>
    )

    expect(store.getActions()).toEqual([])

    fireEvent.press(getByText('demoMode.confirmExit.cta'))

    expect(store.getActions()).toEqual([demoModeToggled(false)])
    expect(navigateClearingStack).toHaveBeenCalledWith('Welcome')
  })
})
