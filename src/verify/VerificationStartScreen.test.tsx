import { act, fireEvent, render, waitFor, within } from '@testing-library/react-native'
import React from 'react'
import * as Keychain from 'react-native-keychain'
import { Provider } from 'react-redux'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import VerificationEducationScreen from 'src/verify/VerificationEducationScreen'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'
import { mocked } from 'ts-jest/utils'

const mockedKeychain = mocked(Keychain)

const renderComponent = (navParams?: StackParamList[Screens.VerificationEducationScreen]) =>
  render(
    <Provider
      store={createMockStore({
        app: {
          centralPhoneVerificationEnabled: true,
          activeScreen: Screens.VerificationEducationScreen,
        },
      })}
    >
      <MockedNavigator
        component={VerificationEducationScreen}
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
    expect(getByTestId('PhoneVerificationLearnMoreDialog').props.visible).toBe(false)
    expect(getByTestId('PhoneVerificationSkipDialog').props.visible).toBe(false)
  })

  it('does not allow starting CPV when signed message is not yet available', () => {
    mockedKeychain.getGenericPassword.mockResolvedValue(false)
    const { queryByText, getByTestId } = renderComponent()

    jest.advanceTimersByTime(500)

    expect(getByTestId('PhoneVerificationContinue')).toBeDisabled()
    expect(getByTestId('Button/Loading')).toBeTruthy()
    expect(queryByText('phoneVerificationScreen.startButtonLabel')).toBeFalsy()
  })

  it('shows the learn more dialog', () => {
    const { getByTestId, getByText } = renderComponent()

    act(() => {
      fireEvent.press(getByText('phoneVerificationScreen.learnMore.buttonLabel'))
    })

    const LearnMoreDialog = getByTestId('PhoneVerificationLearnMoreDialog')
    expect(LearnMoreDialog.props.visible).toBe(true)
    expect(
      within(LearnMoreDialog).getByText('phoneVerificationScreen.learnMore.title')
    ).toBeTruthy()
    expect(within(LearnMoreDialog).getByText('phoneVerificationScreen.learnMore.body')).toBeTruthy()
  })

  it('shows the skip dialog', () => {
    const { getByText, getByTestId } = renderComponent({ hideOnboardingStep: false })

    act(() => {
      fireEvent.press(getByText('skip'))
    })

    const SkipDialog = getByTestId('PhoneVerificationSkipDialog')
    expect(SkipDialog.props.visible).toBe(true)
    expect(within(SkipDialog).getByText('phoneVerificationScreen.skip.title')).toBeTruthy()
    expect(within(SkipDialog).getByText('phoneVerificationScreen.skip.body')).toBeTruthy()

    act(() => {
      fireEvent.press(getByText('phoneVerificationScreen.skip.confirm'))
    })

    expect(navigateHome).toHaveBeenCalledTimes(1)
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
