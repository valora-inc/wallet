import { fireEvent, render, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import { Text } from 'react-native'
import { Provider } from 'react-redux'
import { chooseCreateAccount, chooseRestoreAccount } from 'src/account/actions'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { OnboardingEvents } from 'src/analytics/Events'
import { getAppConfig } from 'src/appConfig'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { firstOnboardingScreen } from 'src/onboarding/steps'
import Welcome from 'src/onboarding/welcome/Welcome'
import { PublicAppConfig } from 'src/public/types'
import { getDynamicConfigParams, patchUpdateStatsigUser } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import { demoModeToggled } from 'src/web3/actions'
import { createMockStore } from 'test/utils'

jest.mock('src/appConfig')
jest.mock('src/onboarding/steps')
jest.mock('src/statsig', () => ({
  patchUpdateStatsigUser: jest.fn(),
  getDynamicConfigParams: jest.fn(),
}))

const mockGetAppConfig = jest.mocked(getAppConfig)

const defaultConfig: PublicAppConfig = {
  registryName: 'test',
  displayName: 'test',
  deepLinkUrlScheme: 'test',
}

describe('Welcome', () => {
  beforeAll(() => {
    jest.spyOn(Date, 'now').mockImplementation(() => 123)
    jest.mocked(firstOnboardingScreen).mockReturnValue(Screens.PincodeSet)
    jest.mocked(getDynamicConfigParams).mockReturnValue({})
  })

  beforeEach(() => {
    jest.clearAllMocks()

    mockGetAppConfig.mockReturnValue(defaultConfig)
  })

  describe('Welcome', () => {
    it('renders components', async () => {
      const store = createMockStore()
      const { getByTestId, queryByTestId } = render(
        <Provider store={store}>
          <Welcome />
        </Provider>
      )
      expect(getByTestId('CreateAccountButton')).toBeTruthy()
      expect(getByTestId('RestoreAccountButton')).toBeTruthy()
      expect(queryByTestId('TermsCheckbox/unchecked')).toBeFalsy()
      expect(queryByTestId('TermsCheckbox/checked')).toBeFalsy()
    })
    it('create updates statsig, fires action and navigates to terms screen for first time onboarding', async () => {
      const store = createMockStore()
      const { getByTestId } = render(
        <Provider store={store}>
          <Welcome />
        </Provider>
      )

      fireEvent.press(getByTestId('CreateAccountButton'))
      await waitFor(() =>
        expect(patchUpdateStatsigUser).toHaveBeenCalledWith({
          custom: { startOnboardingTime: 123 },
        })
      )
      expect(store.getActions()).toEqual([chooseCreateAccount(123)])
      expect(navigate).toHaveBeenCalledTimes(1)
      expect(navigate).toHaveBeenCalledWith(Screens.RegulatoryTerms)
      expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
      expect(AppAnalytics.track).toHaveBeenCalledWith(OnboardingEvents.create_account_start)
    })
    it('create skips statsig update if not onboarding the first time', () => {
      const store = createMockStore({
        account: {
          startOnboardingTime: 111,
        },
      })
      const { getByTestId } = render(
        <Provider store={store}>
          <Welcome />
        </Provider>
      )

      fireEvent.press(getByTestId('CreateAccountButton'))
      expect(store.getActions()).toEqual([chooseCreateAccount(123)])
      expect(navigate).toHaveBeenCalledTimes(1)
      expect(navigate).toHaveBeenCalledWith(Screens.RegulatoryTerms)
      expect(patchUpdateStatsigUser).not.toHaveBeenCalled()
      expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
      expect(AppAnalytics.track).toHaveBeenCalledWith(OnboardingEvents.create_account_start)
    })
    it('restore fires action and navigates to terms screen', () => {
      const store = createMockStore()
      const { getByTestId } = render(
        <Provider store={store}>
          <Welcome />
        </Provider>
      )

      fireEvent.press(getByTestId('RestoreAccountButton'))
      expect(navigate).toHaveBeenCalledTimes(1)
      expect(navigate).toHaveBeenCalledWith(Screens.RegulatoryTerms)
      expect(store.getActions()).toEqual([chooseRestoreAccount()])
      expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
      expect(AppAnalytics.track).toHaveBeenCalledWith(OnboardingEvents.restore_account_start)
    })
    it.each([
      {
        buttonId: 'CreateAccountButton',
        action: chooseCreateAccount(123),
        event: OnboardingEvents.create_account_start,
      },
      {
        buttonId: 'RestoreAccountButton',
        action: chooseRestoreAccount(),
        event: OnboardingEvents.restore_account_start,
      },
    ])(
      '$buttonId goes to the onboarding screen if terms already accepted',
      ({ buttonId, action, event }) => {
        const store = createMockStore({
          account: {
            acceptedTerms: true,
            startOnboardingTime: 111,
          },
        })
        const { getByTestId } = render(
          <Provider store={store}>
            <Welcome />
          </Provider>
        )

        fireEvent.press(getByTestId(buttonId))
        expect(firstOnboardingScreen).toHaveBeenCalled()
        expect(navigate).toHaveBeenCalledTimes(1)
        expect(navigate).toHaveBeenCalledWith(Screens.PincodeSet)
        expect(store.getActions()).toEqual([action])
        expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
        expect(AppAnalytics.track).toHaveBeenCalledWith(event)
      }
    )

    it('dispatches the correct actions to launch demo mode', async () => {
      jest.mocked(getDynamicConfigParams).mockImplementation((configName) => {
        if (configName === DynamicConfigs[StatsigDynamicConfigs.DEMO_MODE_CONFIG]) {
          return { enabledInOnboarding: true }
        }
        throw new Error('Unexpected config name')
      })

      const store = createMockStore()
      const { getByText, rerender } = render(
        <Provider store={store}>
          <Welcome />
        </Provider>
      )

      fireEvent.press(getByText('demoMode.confirmEnter.cta'))

      expect(store.getActions()).toEqual([demoModeToggled(true)])
      await waitFor(() => expect(navigateHome).not.toHaveBeenCalled())

      rerender(
        <Provider
          store={createMockStore({
            web3: {
              demoModeEnabled: true,
            },
          })}
        >
          <Welcome />
        </Provider>
      )
      await waitFor(() => expect(navigateHome).toHaveBeenCalled())
    })

    it('shows a custom logo when configured', () => {
      mockGetAppConfig.mockReturnValue({
        ...defaultConfig,
        themes: {
          default: {
            assets: {
              welcomeLogo: () => <Text>Custom Logo</Text>,
            },
          },
        },
      })

      const store = createMockStore()
      const { getByText } = render(
        <Provider store={store}>
          <Welcome />
        </Provider>
      )

      expect(getByText('Custom Logo')).toBeTruthy()
    })

    it('shows a custom background image when configured', () => {
      const customBackground = { uri: 'custom-background.png' } as any
      mockGetAppConfig.mockReturnValue({
        ...defaultConfig,
        themes: {
          default: {
            assets: {
              welcomeBackgroundImage: customBackground,
            },
          },
        },
      })

      const store = createMockStore()
      const { UNSAFE_getByProps } = render(
        <Provider store={store}>
          <Welcome />
        </Provider>
      )

      const backgroundImage = UNSAFE_getByProps({ source: customBackground })
      expect(backgroundImage).toBeTruthy()
    })
  })
})
