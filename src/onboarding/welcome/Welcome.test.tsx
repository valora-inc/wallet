import { fireEvent, render, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { chooseCreateAccount, chooseRestoreAccount } from 'src/account/actions'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { OnboardingEvents } from 'src/analytics/Events'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { firstOnboardingScreen } from 'src/onboarding/steps'
import Welcome from 'src/onboarding/welcome/Welcome'
import { patchUpdateStatsigUser } from 'src/statsig'
import { createMockStore } from 'test/utils'

jest.mock('src/onboarding/steps')
jest.mock('src/statsig', () => ({
  patchUpdateStatsigUser: jest.fn(),
}))

describe('Welcome', () => {
  beforeAll(() => {
    jest.spyOn(Date, 'now').mockImplementation(() => 123)
    jest.mocked(firstOnboardingScreen).mockReturnValue(Screens.PincodeSet)
  })

  beforeEach(() => {
    jest.clearAllMocks()
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
  })
})
