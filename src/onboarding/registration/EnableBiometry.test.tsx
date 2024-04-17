import { act, fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { BIOMETRY_TYPE } from 'react-native-keychain'
import { Provider } from 'react-redux'
import { setPincodeSuccess } from 'src/account/actions'
import { PincodeType } from 'src/account/reducer'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { Screens } from 'src/navigator/Screens'
import EnableBiometry from 'src/onboarding/registration/EnableBiometry'
import { goToNextOnboardingScreen } from 'src/onboarding/steps'
import { setPincodeWithBiometry } from 'src/pincode/authentication'
import Logger from 'src/utils/Logger'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'
import { mockOnboardingProps } from 'test/values'

const mockOnboardingPropsSelector = jest.fn(() => mockOnboardingProps)
jest.mock('src/onboarding/steps', () => ({
  goToNextOnboardingScreen: jest.fn(),
  getOnboardingStepValues: () => ({ step: 1, totalSteps: 2 }),
  onboardingPropsSelector: () => mockOnboardingPropsSelector(),
}))

const mockedSetPincodeWithBiometry = jest.mocked(setPincodeWithBiometry)
const loggerErrorSpy = jest.spyOn(Logger, 'error')
const analyticsSpy = jest.spyOn(ValoraAnalytics, 'track')

const store = createMockStore({
  app: {
    supportedBiometryType: BIOMETRY_TYPE.FACE_ID,
    activeScreen: Screens.EnableBiometry,
  },
  account: {
    choseToRestoreAccount: false,
  },
})

const renderComponent = () => {
  return render(
    <Provider store={store}>
      <MockedNavigator component={EnableBiometry} />
    </Provider>
  )
}

describe('EnableBiometry', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    store.clearActions()
  })

  it('should render the correct elements', () => {
    const { getByText, getByTestId } = renderComponent()
    expect(
      getByText('enableBiometry.guideTitle, {"biometryType":"biometryType.FaceID"}')
    ).toBeTruthy()
    expect(
      getByText('enableBiometry.guideDescription, {"biometryType":"biometryType.FaceID"}')
    ).toBeTruthy()
    expect(getByText('enableBiometry.cta, {"biometryType":"biometryType.FaceID"}')).toBeTruthy()
    expect(getByTestId('FaceIDBiometryIcon')).toBeTruthy()
  })

  it('should enable biometry', async () => {
    const { getByText } = renderComponent()

    await act(() => {
      fireEvent.press(getByText('enableBiometry.cta, {"biometryType":"biometryType.FaceID"}'))
    })

    expect(setPincodeWithBiometry).toHaveBeenCalled()
    expect(store.getActions()).toEqual([setPincodeSuccess(PincodeType.PhoneAuth)])
    expect(goToNextOnboardingScreen).toHaveBeenCalledWith({
      firstScreenInCurrentStep: Screens.EnableBiometry,
      onboardingProps: mockOnboardingProps,
    })

    expect(analyticsSpy).toHaveBeenNthCalledWith(1, OnboardingEvents.biometry_opt_in_start)
    expect(analyticsSpy).toHaveBeenNthCalledWith(2, OnboardingEvents.biometry_opt_in_approve)
    expect(analyticsSpy).toHaveBeenNthCalledWith(3, OnboardingEvents.biometry_opt_in_complete)
  })
  it('should call goToNextOnboardingScreen', async () => {
    const store = createMockStore({
      app: {
        supportedBiometryType: BIOMETRY_TYPE.FACE_ID,
        activeScreen: Screens.EnableBiometry,
      },
      account: {
        choseToRestoreAccount: false,
      },
    })

    const { getByText } = render(
      <Provider store={store}>
        <MockedNavigator component={EnableBiometry} />
      </Provider>
    )

    await act(() => {
      fireEvent.press(getByText('enableBiometry.cta, {"biometryType":"biometryType.FaceID"}'))
    })

    expect(setPincodeWithBiometry).toHaveBeenCalled()
    expect(goToNextOnboardingScreen).toHaveBeenCalledWith({
      firstScreenInCurrentStep: Screens.EnableBiometry,
      onboardingProps: mockOnboardingProps,
    })
  })

  it('should log error and not navigate if biometry enable fails', async () => {
    mockedSetPincodeWithBiometry.mockRejectedValue('some error')
    const { getByText } = renderComponent()

    await act(() => {
      fireEvent.press(getByText('enableBiometry.cta, {"biometryType":"biometryType.FaceID"}'))
    })

    expect(setPincodeWithBiometry).toHaveBeenCalled()
    expect(store.getActions()).toEqual([])
    expect(goToNextOnboardingScreen).not.toHaveBeenCalled()
    expect(loggerErrorSpy).toHaveBeenCalled()
    expect(analyticsSpy).toHaveBeenCalledWith(OnboardingEvents.biometry_opt_in_error)
  })

  it('should not log error if user cancels biometry validation, and not navigate', async () => {
    mockedSetPincodeWithBiometry.mockRejectedValue('user canceled the operation')
    const { getByText } = renderComponent()

    await act(() => {
      fireEvent.press(getByText('enableBiometry.cta, {"biometryType":"biometryType.FaceID"}'))
    })

    expect(setPincodeWithBiometry).toHaveBeenCalled()
    expect(store.getActions()).toEqual([])
    expect(goToNextOnboardingScreen).not.toHaveBeenCalled()
    expect(loggerErrorSpy).not.toHaveBeenCalled()
  })

  it('should allow skip and navigate to next screen', () => {
    const { getByText } = renderComponent()

    fireEvent.press(getByText('skip'))

    expect(goToNextOnboardingScreen).toHaveBeenCalledWith({
      firstScreenInCurrentStep: Screens.EnableBiometry,
      onboardingProps: mockOnboardingProps,
    })
  })

  it('should show guided onboarding explaining faceid when enabled to do so', () => {
    const store = createMockStore({
      app: {
        supportedBiometryType: BIOMETRY_TYPE.FACE_ID,
        activeScreen: Screens.EnableBiometry,
      },
    })
    const { getByText } = render(
      <Provider store={store}>
        <MockedNavigator component={EnableBiometry} />
      </Provider>
    )
    expect(
      getByText('enableBiometry.guideTitle, {"biometryType":"biometryType.FaceID"}')
    ).toBeTruthy()
    expect(
      getByText('enableBiometry.guideDescription, {"biometryType":"biometryType.FaceID"}')
    ).toBeTruthy()
  })
})
