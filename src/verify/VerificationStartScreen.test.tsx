import { act, fireEvent, render, waitFor, within } from '@testing-library/react-native'
import React from 'react'
import * as Keychain from 'react-native-keychain'
import { Provider } from 'react-redux'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { goToNextOnboardingScreen } from 'src/onboarding/steps'
import VerificationStartScreen from 'src/verify/VerificationStartScreen'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'
import { mockOnboardingProps } from 'test/values'
import { mocked } from 'ts-jest/utils'

const mockedKeychain = mocked(Keychain)

jest.mock('src/onboarding/steps', () => ({
  goToNextOnboardingScreen: jest.fn(),
  getOnboardingStepValues: () => ({ step: 3, totalSteps: 3 }),
  onboardingPropsSelector: () => mockOnboardingProps,
}))

const renderComponent = (navParams?: StackParamList[Screens.VerificationStartScreen]) =>
  render(
    <Provider
      store={createMockStore({
        app: {
          activeScreen: Screens.VerificationStartScreen,
        },
      })}
    >
      <MockedNavigator
        component={VerificationStartScreen}
        params={{
          selectedCountryCodeAlpha2: 'NL',
          hideOnboardingStep: true,
          ...navParams,
        }}
      />
    </Provider>
  )

describe('VerificationStartScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('displays the correct components on mount', async () => {
    mockedKeychain.getGenericPassword.mockResolvedValue({
      password: 'some signed message',
      username: 'username',
      service: 'service',
      storage: 'storage',
    })
    const { getByText, getByTestId } = renderComponent()

    act(() => {
      jest.advanceTimersByTime(5000)
    })

    await waitFor(() => expect(getByText('phoneVerificationScreen.startButtonLabel')).toBeTruthy())
    expect(getByText('phoneVerificationScreen.title')).toBeTruthy()
    expect(getByText('phoneVerificationScreen.description')).toBeTruthy()
    expect(getByTestId('CountrySelectionButton')).toBeTruthy()
    expect(getByTestId('PhoneNumberField')).toBeTruthy()
    expect(getByText('phoneVerificationScreen.learnMore.buttonLabel')).toBeTruthy()
  })

  it('does not allow starting CPV when signed message is not yet available', () => {
    mockedKeychain.getGenericPassword.mockResolvedValue(false)
    const { queryByText, getByTestId } = renderComponent()

    act(() => {
      jest.advanceTimersByTime(5000)
      // enter a valid phone number
      fireEvent.changeText(getByTestId('PhoneNumberField'), '619123456')
    })

    expect(getByTestId('PhoneVerificationContinue')).toBeDisabled()
    expect(getByTestId('Button/Loading')).toBeTruthy()
    expect(queryByText('phoneVerificationScreen.startButtonLabel')).toBeFalsy()
  })

  it('shows the learn more dialog', async () => {
    const { getByTestId, getByText } = renderComponent()

    act(() => {
      fireEvent.press(getByText('phoneVerificationScreen.learnMore.buttonLabel'))
    })
    await waitFor(() => expect(getByTestId('PhoneVerificationLearnMoreDialog')).toBeTruthy())
    const LearnMoreDialog = getByTestId('PhoneVerificationLearnMoreDialog')
    expect(
      within(LearnMoreDialog).getByText('phoneVerificationScreen.learnMore.title')
    ).toBeTruthy()
    expect(within(LearnMoreDialog).getByText('phoneVerificationScreen.learnMore.body')).toBeTruthy()
  })

  it('skip button works', () => {
    const { getByText } = renderComponent({ hideOnboardingStep: false })

    act(() => {
      fireEvent.press(getByText('skip'))
    })

    expect(goToNextOnboardingScreen).toHaveBeenCalledWith({
      firstScreenInCurrentStep: Screens.VerificationStartScreen,
      onboardingProps: mockOnboardingProps,
    })
  })

  it('proceeds to the next verification step', async () => {
    mockedKeychain.getGenericPassword.mockResolvedValue({
      password: 'some signed message',
      username: 'username',
      service: 'service',
      storage: 'storage',
    })
    const { getByText, getByTestId } = renderComponent({ hideOnboardingStep: false })

    act(() => {
      jest.advanceTimersByTime(5000)
      fireEvent.changeText(getByTestId('PhoneNumberField'), '619123456')
    })

    await waitFor(() => expect(getByText('phoneVerificationScreen.startButtonLabel')).toBeTruthy())
    fireEvent.press(getByText('phoneVerificationScreen.startButtonLabel'))

    expect(navigate).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith(Screens.VerificationCodeInputScreen, {
      countryCallingCode: '+31',
      e164Number: '+31619123456',
      registrationStep: { step: 3, totalSteps: 3 },
    })
  })
})
