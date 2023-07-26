import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import KeylessBackupPhoneCodeInput from 'src/keylessBackup/KeylessBackupPhoneCodeInput'
import { KeylessBackupFlow } from 'src/keylessBackup/types'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import MockedNavigator from 'test/MockedNavigator'

describe('KeylessBackupPhoneCodeInput', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('displays the correct components', () => {
    const { getByTestId, getByText } = render(
      <MockedNavigator
        component={KeylessBackupPhoneCodeInput}
        params={{
          keylessBackupFlow: KeylessBackupFlow.Setup,
          e164Number: '+15555555555',
        }}
      />
    )

    expect(getByText('phoneVerificationInput.title')).toBeTruthy()
    expect(
      getByText('phoneVerificationInput.description, {"phoneNumber":"+15555555555"}')
    ).toBeTruthy()
    expect(getByText('phoneVerificationInput.help')).toBeTruthy()
    expect(getByTestId('PhoneVerificationCode')).toBeTruthy()
    expect(getByTestId('KeylessBackupPhoneCodeInputClose')).toBeTruthy()
  })

  it.each([
    [KeylessBackupFlow.Setup, Screens.SetUpKeylessBackup],
    [KeylessBackupFlow.Restore, Screens.ImportWallet],
  ])('close navigates to correct screen for %s', (flow, screen) => {
    const { getByTestId } = render(
      <MockedNavigator
        component={KeylessBackupPhoneCodeInput}
        params={{
          keylessBackupFlow: flow,
          e164Number: '+15555555555',
        }}
      />
    )

    fireEvent.press(getByTestId('KeylessBackupPhoneCodeInputClose'))

    expect(navigate).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith(screen)
  })
})
