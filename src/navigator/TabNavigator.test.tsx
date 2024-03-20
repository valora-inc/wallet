import { CommonActions } from '@react-navigation/native'
import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { Screens } from 'src/navigator/Screens'
import TabNavigator from 'src/navigator/TabNavigator'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'

jest.mock('src/statsig')

describe('TabNavigator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest
      .mocked(getFeatureGate)
      .mockImplementation((featureGate) => featureGate !== StatsigFeatureGates.USE_TAB_NAVIGATOR)
  })

  it('shows the expected tabs', () => {
    const store = createMockStore({})
    const { queryByText, getByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={TabNavigator} />
      </Provider>
    )

    // By Text
    expect(queryByText('bottomTabsNavigator.wallet.tabName')).toBeTruthy()
    expect(queryByText('bottomTabsNavigator.home.tabName')).toBeTruthy()
    expect(queryByText('bottomTabsNavigator.discover.tabName')).toBeTruthy()

    // By testId - useful for e2e tests
    expect(getByTestId('Tab/Wallet')).toBeTruthy()
    expect(getByTestId('Tab/Home')).toBeTruthy()
    expect(getByTestId('Tab/Discover')).toBeTruthy()
  })

  it.each([
    {
      testId: 'Tab/Wallet',
      tabName: 'bottomTabsNavigator.wallet.tabName',
      expectedScreen: Screens.TabWallet,
    },
    {
      testId: 'Tab/Discover',
      tabName: 'bottomTabsNavigator.discover.tabName',
      expectedScreen: Screens.TabDiscover,
    },
  ])(
    `navigates to non initial screens $expectedScreen`,
    async ({ testId, tabName, expectedScreen }) => {
      const store = createMockStore({})
      const { getByText, getByTestId } = render(
        <Provider store={store}>
          <MockedNavigator component={TabNavigator} />
        </Provider>
      )

      // Check that the tab contains the correct text
      expect(getByTestId(testId)).toContainElement(getByText(tabName))

      // Check tab navigation
      await fireEvent.press(getByTestId(testId))
      expect(CommonActions.navigate).toHaveBeenCalledWith({ merge: true, name: expectedScreen })
    }
  )

  it('does not attempt navigate to current screen', async () => {
    const store = createMockStore({})
    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <MockedNavigator component={TabNavigator} />
      </Provider>
    )

    expect(getByTestId('Tab/Home')).toContainElement(getByText('bottomTabsNavigator.home.tabName'))
    await fireEvent.press(getByTestId('Tab/Home'))
    expect(CommonActions.navigate).not.toHaveBeenCalled()
  })
})
