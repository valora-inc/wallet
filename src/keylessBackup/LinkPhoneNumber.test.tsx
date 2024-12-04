import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { OnboardingEvents } from 'src/analytics/Events'
import AppAnalytics from 'src/analytics/AppAnalytics'
import LinkPhoneNumber from 'src/keylessBackup/LinkPhoneNumber'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { goToNextOnboardingScreen } from 'src/onboarding/steps'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockOnboardingProps } from 'test/values'

jest.mock('src/navigator/NavigationService')
jest.mock('src/analytics/AppAnalytics')

const mockOnboardingPropsSelector = jest.fn(() => mockOnboardingProps)
jest.mock('src/onboarding/steps', () => ({
  goToNextOnboardingScreen: jest.fn(),
  onboardingPropsSelector: () => mockOnboardingPropsSelector(),
}))

describe('LinkPhoneNumber', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('navigates to verification start screen', async () => {
    const { getByTestId } = render(
      <Provider store={createMockStore()}>
        <LinkPhoneNumber {...getMockStackScreenProps(Screens.LinkPhoneNumber)} />
      </Provider>
    )
    fireEvent.press(getByTestId('LinkPhoneNumberButton'))

    expect(navigate).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith(Screens.VerificationStartScreen, {
      hasOnboarded: false,
    })
    expect(AppAnalytics.track).toHaveBeenCalledWith(OnboardingEvents.link_phone_number)
  })

  it('navigates to home on later', async () => {
    const store = createMockStore()
    const { getByTestId } = render(
      <Provider store={store}>
        <LinkPhoneNumber {...getMockStackScreenProps(Screens.LinkPhoneNumber)} />
      </Provider>
    )
    fireEvent.press(getByTestId('LinkPhoneNumberLater'))

    expect(goToNextOnboardingScreen).toHaveBeenCalledWith({
      firstScreenInCurrentStep: Screens.VerificationStartScreen,
      onboardingProps: mockOnboardingProps,
    })
    expect(AppAnalytics.track).toHaveBeenCalledWith(OnboardingEvents.link_phone_number_later)
  })
})
