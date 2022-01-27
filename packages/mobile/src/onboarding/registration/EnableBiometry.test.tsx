import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { BIOMETRY_TYPE } from 'react-native-keychain'
import { Provider } from 'react-redux'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import EnableBiometry from 'src/onboarding/registration/EnableBiometry'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'

const renderComponent = () => {
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

  return render(
    <Provider store={store}>
      <MockedNavigator component={EnableBiometry} />
    </Provider>
  )
}

describe('EnableBiometry', () => {
  it('should render the correct elements', () => {
    const { getByText, getByTestId } = renderComponent()

    expect(
      getByText('enableBiometry.description, {"biometryType":"biometryType.FaceID"}')
    ).toBeTruthy()
    expect(getByText('enableBiometry.cta, {"biometryType":"biometryType.FaceID"}')).toBeTruthy()
    expect(getByTestId('FaceIDBiometryIcon')).toBeTruthy()
  })

  it('should enable biometry', () => {
    const { getByText } = renderComponent()

    fireEvent.press(getByText('enableBiometry.cta, {"biometryType":"biometryType.FaceID"}'))

    // TODO assert some keychain stuff when it is added
    expect(navigate).toHaveBeenCalledWith(Screens.VerificationEducationScreen)
  })

  it('should allow skip and navigate to next screen', () => {
    const { getByText } = renderComponent()

    fireEvent.press(getByText('skip'))

    expect(navigate).toHaveBeenCalledWith(Screens.VerificationEducationScreen)
  })
})
