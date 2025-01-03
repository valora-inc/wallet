import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import RNExitApp from 'react-native-exit-app'
import AccounSetupFailureScreen from 'src/account/AccountSetupFailureScreen'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'

describe('AccountSetupFailureScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the correct elements', () => {
    const { getByText } = render(<AccounSetupFailureScreen />)

    expect(getByText('accountSetupFailed')).toBeTruthy()
    expect(getByText('accountSetupFailedDescription')).toBeTruthy()
    expect(getByText('closeApp')).toBeTruthy()
    expect(getByText('contactSupport')).toBeTruthy()
  })

  it('should handle closing the app', () => {
    const { getByText } = render(<AccounSetupFailureScreen />)

    fireEvent.press(getByText('closeApp'))

    expect(RNExitApp.exitApp).toHaveBeenCalledTimes(1)
  })

  it('should handle contact support', () => {
    const { getByText } = render(<AccounSetupFailureScreen />)

    fireEvent.press(getByText('contactSupport'))

    expect(navigate).toHaveBeenCalledWith(Screens.SupportContact)
  })
})
