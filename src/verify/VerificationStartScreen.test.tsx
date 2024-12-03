import { fireEvent, render, waitFor, within } from '@testing-library/react-native'
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

const mockedKeychain = jest.mocked(Keychain)

const mockOnboardingPropsSelector = jest.fn(() => mockOnboardingProps)
jest.mock('src/onboarding/steps', () => ({
  goToNextOnboardingScreen: jest.fn(),
  getOnboardingStepValues: () => ({ step: 3, totalSteps: 3 }),
  onboardingPropsSelector: () => mockOnboardingPropsSelector(),
}))

const renderComponent = (
  navParams?: StackParamList[Screens.VerificationStartScreen],
  restoreAccount = false
) =>
  render(
    <Provider
      store={createMockStore({
        app: {
          activeScreen: Screens.VerificationStartScreen,
        },
        account: {
          choseToRestoreAccount: restoreAccount,
        },
      })}
    >
      <MockedNavigator
        component={VerificationStartScreen}
        params={{
          selectedCountryCodeAlpha2: 'NL',
          hasOnboarded: true,
          ...navParams,
        }}
      />
    </Provider>
  )

describe('VerificationStartScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('displays the correct components on mount when not onboarding', async () => {
    mockedKeychain.getGenericPassword.mockResolvedValue({
      password: 'some signed message',
      username: 'username',
      service: 'service',
      storage: 'storage',
    })
    const { getByText, getByTestId, queryByTestId, queryByText } = renderComponent()

    await waitFor(() => expect(getByText('phoneVerificationScreen.startButtonLabel')).toBeTruthy())
    expect(getByText('phoneVerificationScreen.title')).toBeTruthy()
    expect(getByText('phoneVerificationScreen.description')).toBeTruthy()
    expect(getByTestId('CountrySelectionButton')).toBeTruthy()
    expect(getByTestId('PhoneNumberField')).toBeTruthy()
    expect(getByText('phoneVerificationScreen.learnMore.buttonLabel')).toBeTruthy()
    expect(queryByText('skip')).toBeFalsy()
    expect(queryByTestId('HeaderSubTitle')).toBeFalsy()
  })

  it('displays the correct components on mount when onboarding and creating new wallet', async () => {
    mockedKeychain.getGenericPassword.mockResolvedValue({
      password: 'some signed message',
      username: 'username',
      service: 'service',
      storage: 'storage',
    })
    const { getByText, getByTestId } = renderComponent({ hasOnboarded: false })

    await waitFor(() => expect(getByText('phoneVerificationScreen.startButtonLabel')).toBeTruthy())
    expect(getByText('phoneVerificationScreen.title')).toBeTruthy()
    expect(getByText('phoneVerificationScreen.description')).toBeTruthy()
    expect(getByTestId('CountrySelectionButton')).toBeTruthy()
    expect(getByTestId('PhoneNumberField')).toBeTruthy()
    expect(getByText('phoneVerificationScreen.learnMore.buttonLabel')).toBeTruthy()
    expect(getByText('skip')).toBeTruthy()
    expect(getByTestId('HeaderSubTitle')).toHaveTextContent(
      'registrationSteps, {"step":3,"totalSteps":3}'
    )
  })

  it('displays the correct components on mount when onboarding and restoring wallet', async () => {
    mockedKeychain.getGenericPassword.mockResolvedValue({
      password: 'some signed message',
      username: 'username',
      service: 'service',
      storage: 'storage',
    })
    const { getByText, getByTestId, queryByTestId } = renderComponent({ hasOnboarded: false }, true)

    await waitFor(() => expect(getByText('phoneVerificationScreen.startButtonLabel')).toBeTruthy())
    expect(getByText('phoneVerificationScreen.title')).toBeTruthy()
    expect(getByText('phoneVerificationScreen.description')).toBeTruthy()
    expect(getByTestId('CountrySelectionButton')).toBeTruthy()
    expect(getByTestId('PhoneNumberField')).toBeTruthy()
    expect(getByText('phoneVerificationScreen.learnMore.buttonLabel')).toBeTruthy()
    expect(getByText('skip')).toBeTruthy()
    expect(queryByTestId('HeaderSubTitle')).toBeFalsy()
  })

  it('does not allow starting CPV when signed message is not yet available', async () => {
    mockedKeychain.getGenericPassword.mockResolvedValue(false)
    const { queryByText, getByTestId } = renderComponent()

    fireEvent.changeText(getByTestId('PhoneNumberField'), '619123456')

    await waitFor(() => expect(getByTestId('PhoneVerificationContinue')).toBeDisabled())
    expect(getByTestId('Button/Loading')).toBeTruthy()
    expect(queryByText('phoneVerificationScreen.startButtonLabel')).toBeFalsy()
  })

  it('shows the learn more dialog', async () => {
    const { getByTestId, getByText } = renderComponent()

    fireEvent.press(getByText('phoneVerificationScreen.learnMore.buttonLabel'))

    await waitFor(() => expect(getByTestId('PhoneVerificationLearnMoreDialog')).toBeTruthy())
    const LearnMoreDialog = getByTestId('PhoneVerificationLearnMoreDialog')
    expect(
      within(LearnMoreDialog).getByText('phoneVerificationScreen.learnMore.title')
    ).toBeTruthy()
    expect(within(LearnMoreDialog).getByText('phoneVerificationScreen.learnMore.body')).toBeTruthy()
  })

  it('skip button works', async () => {
    const { getByText } = renderComponent({ hasOnboarded: false })

    fireEvent.press(getByText('skip'))

    await waitFor(() =>
      expect(goToNextOnboardingScreen).toHaveBeenCalledWith({
        firstScreenInCurrentStep: Screens.VerificationStartScreen,
        onboardingProps: mockOnboardingProps,
      })
    )
  })

  it('proceeds to the next verification step during onboarding', async () => {
    mockedKeychain.getGenericPassword.mockResolvedValue({
      password: 'some signed message',
      username: 'username',
      service: 'service',
      storage: 'storage',
    })
    const { getByText, getByTestId } = renderComponent({ hasOnboarded: false })

    fireEvent.changeText(getByTestId('PhoneNumberField'), '619123456')

    await waitFor(() => expect(getByText('phoneVerificationScreen.startButtonLabel')).toBeTruthy())
    fireEvent.press(getByText('phoneVerificationScreen.startButtonLabel'))

    expect(navigate).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith(Screens.VerificationCodeInputScreen, {
      countryCallingCode: '+31',
      e164Number: '+31619123456',
      registrationStep: { step: 3, totalSteps: 3 },
      verificationCompletionScreen: 'OnboardingSuccessScreen',
    })
  })

  it('proceeds to the next verification step without steps if restoring', async () => {
    mockedKeychain.getGenericPassword.mockResolvedValue({
      password: 'some signed message',
      username: 'username',
      service: 'service',
      storage: 'storage',
    })
    const { getByText, getByTestId } = renderComponent({ hasOnboarded: false }, true)

    fireEvent.changeText(getByTestId('PhoneNumberField'), '619123456')

    await waitFor(() => expect(getByText('phoneVerificationScreen.startButtonLabel')).toBeTruthy())
    fireEvent.press(getByText('phoneVerificationScreen.startButtonLabel'))

    expect(navigate).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith(Screens.VerificationCodeInputScreen, {
      countryCallingCode: '+31',
      e164Number: '+31619123456',
      registrationStep: undefined,
      verificationCompletionScreen: 'OnboardingSuccessScreen',
    })
  })

  it('proceeds to the next verification step with the correct navigation props after onboarding', async () => {
    mockedKeychain.getGenericPassword.mockResolvedValue({
      password: 'some signed message',
      username: 'username',
      service: 'service',
      storage: 'storage',
    })
    const { getByText, getByTestId } = renderComponent({ hasOnboarded: true }, false)

    fireEvent.changeText(getByTestId('PhoneNumberField'), '619123456')

    await waitFor(() => expect(getByText('phoneVerificationScreen.startButtonLabel')).toBeTruthy())
    fireEvent.press(getByText('phoneVerificationScreen.startButtonLabel'))

    expect(navigate).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith(Screens.VerificationCodeInputScreen, {
      countryCallingCode: '+31',
      e164Number: '+31619123456',
      registrationStep: undefined,
      verificationCompletionScreen: 'TabHome',
    })
  })
})
