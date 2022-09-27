import { act, fireEvent, render, within } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import VerificationEducationScreen from 'src/verify/VerificationEducationScreen'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'

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

  it('displays the correct components on mount', () => {
    const { getByText, getByTestId } = renderComponent()

    expect(getByText('phoneVerificationScreen.title')).toBeTruthy()
    expect(getByText('phoneVerificationScreen.description')).toBeTruthy()
    expect(getByTestId('CountrySelectionButton')).toBeTruthy()
    expect(getByTestId('PhoneNumberField')).toBeTruthy()
    expect(getByText('phoneVerificationScreen.startButtonLabel')).toBeTruthy()
    expect(getByText('phoneVerificationScreen.learnMore.buttonLabel')).toBeTruthy()
    expect(getByTestId('PhoneVerificationLearnMoreDialog').props.visible).toBe(false)
    expect(getByTestId('PhoneVerificationSkipDialog').props.visible).toBe(false)
  })

  it('shows the learn more dialog', async () => {
    const { getByTestId, getByText } = renderComponent()

    await act(() => {
      fireEvent.press(getByText('phoneVerificationScreen.learnMore.buttonLabel'))
    })

    const LearnMoreDialog = getByTestId('PhoneVerificationLearnMoreDialog')
    expect(LearnMoreDialog.props.visible).toBe(true)
    expect(
      within(LearnMoreDialog).getByText('phoneVerificationScreen.learnMore.title')
    ).toBeTruthy()
    expect(within(LearnMoreDialog).getByText('phoneVerificationScreen.learnMore.body')).toBeTruthy()
  })

  it('shows the skip dialog', async () => {
    const { getByText, getByTestId } = renderComponent({ hideOnboardingStep: false })

    await act(() => {
      fireEvent.press(getByText('skip'))
    })

    const SkipDialog = getByTestId('PhoneVerificationSkipDialog')
    expect(SkipDialog.props.visible).toBe(true)
    expect(within(SkipDialog).getByText('phoneVerificationScreen.skip.title')).toBeTruthy()
    expect(within(SkipDialog).getByText('phoneVerificationScreen.skip.body')).toBeTruthy()

    await act(() => {
      fireEvent.press(getByText('phoneVerificationScreen.skip.confirm'))
    })

    expect(navigateHome).toHaveBeenCalledTimes(1)
  })

  it('proceeds to the next verification step', async () => {
    const { getByText, getByTestId } = renderComponent({ hideOnboardingStep: false })

    await act(() => {
      fireEvent.changeText(getByTestId('PhoneNumberField'), '619123456')
    })

    fireEvent.press(getByText('phoneVerificationScreen.startButtonLabel'))

    expect(navigate).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith(Screens.VerificationCodeInputScreen, {
      countryCode: '+31',
      e164Number: '+31619123456',
      registrationStep: { step: 3, totalSteps: 3 },
    })
  })
})
