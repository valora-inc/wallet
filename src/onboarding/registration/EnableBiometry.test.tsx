import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { BIOMETRY_TYPE } from 'react-native-keychain'
import { Provider } from 'react-redux'
import { initializeAccount, setPincodeSuccess } from 'src/account/actions'
import { PincodeType } from 'src/account/reducer'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { setHasSeenVerificationNux } from 'src/identity/actions'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import EnableBiometry from 'src/onboarding/registration/EnableBiometry'
import { setPincodeWithBiometry } from 'src/pincode/authentication'
import Logger from 'src/utils/Logger'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore, flushMicrotasksQueue } from 'test/utils'
import { mocked } from 'ts-jest/utils'

const mockedSetPincodeWithBiometry = mocked(setPincodeWithBiometry)
const loggerErrorSpy = jest.spyOn(Logger, 'error')
const analyticsSpy = jest.spyOn(ValoraAnalytics, 'track')

const store = createMockStore({
  app: {
    supportedBiometryType: BIOMETRY_TYPE.FACE_ID,
    biometryEnabled: true,
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
      getByText('enableBiometry.description, {"biometryType":"biometryType.FaceID"}')
    ).toBeTruthy()
    expect(getByText('enableBiometry.cta, {"biometryType":"biometryType.FaceID"}')).toBeTruthy()
    expect(getByTestId('FaceIDBiometryIcon')).toBeTruthy()
  })

  it('should enable biometry', async () => {
    const { getByText } = renderComponent()

    fireEvent.press(getByText('enableBiometry.cta, {"biometryType":"biometryType.FaceID"}'))
    await flushMicrotasksQueue()

    expect(setPincodeWithBiometry).toHaveBeenCalled()
    expect(store.getActions()).toEqual([setPincodeSuccess(PincodeType.PhoneAuth)])
    expect(navigate).toHaveBeenCalledWith(Screens.VerificationEducationScreen)

    expect(analyticsSpy).toHaveBeenNthCalledWith(1, OnboardingEvents.biometry_opt_in_start)
    expect(analyticsSpy).toHaveBeenNthCalledWith(2, OnboardingEvents.biometry_opt_in_approve)
    expect(analyticsSpy).toHaveBeenNthCalledWith(3, OnboardingEvents.biometry_opt_in_complete)
  })
  it('should navigate to the home screen if skipVerification is true', async () => {
    const store = createMockStore({
      app: {
        supportedBiometryType: BIOMETRY_TYPE.FACE_ID,
        biometryEnabled: true,
        activeScreen: Screens.EnableBiometry,
        skipVerification: true,
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

    fireEvent.press(getByText('enableBiometry.cta, {"biometryType":"biometryType.FaceID"}'))
    await flushMicrotasksQueue()

    expect(setPincodeWithBiometry).toHaveBeenCalled()
    expect(store.getActions()).toEqual([
      setPincodeSuccess(PincodeType.PhoneAuth),
      initializeAccount(),
      setHasSeenVerificationNux(true),
    ])
    expect(navigate).not.toHaveBeenCalled()
    expect(navigateHome).toHaveBeenCalled()
  })

  it('should log error and not navigate if biometry enable fails', async () => {
    mockedSetPincodeWithBiometry.mockRejectedValue('some error')
    const { getByText } = renderComponent()

    fireEvent.press(getByText('enableBiometry.cta, {"biometryType":"biometryType.FaceID"}'))
    await flushMicrotasksQueue()

    expect(setPincodeWithBiometry).toHaveBeenCalled()
    expect(store.getActions()).toEqual([])
    expect(navigate).not.toHaveBeenCalled()
    expect(loggerErrorSpy).toHaveBeenCalled()
    expect(analyticsSpy).toHaveBeenCalledWith(OnboardingEvents.biometry_opt_in_error)
  })

  it('should not log error if user cancels biometry validation, and not navigate', async () => {
    mockedSetPincodeWithBiometry.mockRejectedValue('user canceled the operation')
    const { getByText } = renderComponent()

    fireEvent.press(getByText('enableBiometry.cta, {"biometryType":"biometryType.FaceID"}'))
    await flushMicrotasksQueue()

    expect(setPincodeWithBiometry).toHaveBeenCalled()
    expect(store.getActions()).toEqual([])
    expect(navigate).not.toHaveBeenCalled()
    expect(loggerErrorSpy).not.toHaveBeenCalled()
  })

  it('should allow skip and navigate to next screen', () => {
    const { getByText } = renderComponent()

    fireEvent.press(getByText('skip'))

    expect(navigate).toHaveBeenCalledWith(Screens.VerificationEducationScreen)
  })
})
