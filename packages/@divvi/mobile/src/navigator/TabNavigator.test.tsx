import { CommonActions } from '@react-navigation/native'
import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Text } from 'react-native'
import { Provider } from 'react-redux'
import { getAppConfig } from 'src/appConfig'
import { Screens } from 'src/navigator/Screens'
import TabNavigator from 'src/navigator/TabNavigator'
import { PublicAppConfig } from 'src/public/types'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'

jest.mock('src/appConfig')

const mockGetAppConfig = jest.mocked(getAppConfig)

const defaultConfig: PublicAppConfig = {
  registryName: 'test',
  displayName: 'test',
  deepLinkUrlScheme: 'test',
}

describe('TabNavigator', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockGetAppConfig.mockReturnValue(defaultConfig)
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
      expect(CommonActions.navigate).toHaveBeenCalledWith({
        name: expectedScreen,
        key: expect.stringMatching(new RegExp(`${expectedScreen}-\\S+`)),
      })
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

  describe('with custom screen configuration', () => {
    it('shows configured tabs in specified order', () => {
      mockGetAppConfig.mockReturnValue({
        ...defaultConfig,
        screens: {
          tabs: ({ defaultTabs }) => ({
            screens: [defaultTabs.activity, defaultTabs.wallet], // Only showing 2 tabs in custom order
          }),
        },
      })

      const store = createMockStore({})
      const { queryByText } = render(
        <Provider store={store}>
          <MockedNavigator component={TabNavigator} />
        </Provider>
      )

      // Should show configured tabs
      expect(queryByText('bottomTabsNavigator.home.tabName')).toBeTruthy()
      expect(queryByText('bottomTabsNavigator.wallet.tabName')).toBeTruthy()
      // Should not show unconfigured tab
      expect(queryByText('bottomTabsNavigator.discover.tabName')).toBeFalsy()
    })

    it('uses custom initial screen when configured', () => {
      mockGetAppConfig.mockReturnValue({
        ...defaultConfig,
        screens: {
          tabs: ({ defaultTabs }) => ({
            screens: [defaultTabs.wallet, defaultTabs.activity, defaultTabs.discover],
            initialScreen: 'discover',
          }),
        },
      })

      const store = createMockStore({})
      const { getByTestId } = render(
        <Provider store={store}>
          <MockedNavigator component={TabNavigator} />
        </Provider>
      )

      // Press discover tab - should not trigger navigation since it's the initial screen
      fireEvent.press(getByTestId('Tab/Discover'))
      expect(CommonActions.navigate).not.toHaveBeenCalled()

      // Press home tab - should trigger navigation since it's not the initial screen
      fireEvent.press(getByTestId('Tab/Home'))
      expect(CommonActions.navigate).toHaveBeenCalled()
    })

    it('supports custom screen configuration objects', () => {
      mockGetAppConfig.mockReturnValue({
        ...defaultConfig,
        screens: {
          tabs: ({ defaultTabs }) => ({
            screens: [
              defaultTabs.wallet,
              {
                name: 'custom-tab',
                component: () => <Text>Custom screen content</Text>,
                icon: jest.fn(),
                label: (t: any) => 'Custom tab',
                testID: 'Tab/CustomTab',
              },
            ],
            initialScreen: 'custom-tab',
          }),
        },
      })

      const store = createMockStore({})
      const { getByTestId, getByText } = render(
        <Provider store={store}>
          <MockedNavigator component={TabNavigator} />
        </Provider>
      )

      // Check that the initial screen is the custom discover screen and displayed
      expect(getByText('Custom screen content')).toBeTruthy()
      expect(getByText('Custom tab')).toBeTruthy()
      expect(getByTestId('Tab/CustomTab')).toBeTruthy()
    })
  })
})
