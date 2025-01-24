import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { KeylessBackupEvents } from 'src/analytics/Events'
import AppAnalytics from 'src/analytics/AppAnalytics'
import KeylessBackupCancelButton from 'src/keylessBackup/KeylessBackupCancelButton'
import { KeylessBackupFlow, KeylessBackupOrigin } from 'src/keylessBackup/types'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'

describe('KeylessBackupCancelButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('navigates correctly for setup', () => {
    const { getByTestId } = render(
      <KeylessBackupCancelButton
        eventName={KeylessBackupEvents.cab_enter_phone_number_cancel}
        origin={KeylessBackupOrigin.Settings}
        flow={KeylessBackupFlow.Setup}
      />
    )
    expect(getByTestId('CancelButton')).toBeTruthy()

    fireEvent.press(getByTestId('CancelButton'))

    expect(navigateHome).toHaveBeenCalledTimes(1)
    expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
    expect(AppAnalytics.track).toHaveBeenCalledWith(
      KeylessBackupEvents.cab_enter_phone_number_cancel,
      { keylessBackupFlow: KeylessBackupFlow.Setup, origin: KeylessBackupOrigin.Settings }
    )
  })

  it('navigates correctly for restore', () => {
    const { getByTestId } = render(
      <KeylessBackupCancelButton
        eventName={KeylessBackupEvents.cab_sign_in_with_email_screen_cancel}
        origin={KeylessBackupOrigin.Settings}
        flow={KeylessBackupFlow.Restore}
      />
    )
    expect(getByTestId('CancelButton')).toBeTruthy()

    fireEvent.press(getByTestId('CancelButton'))

    expect(navigate).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith(Screens.ImportSelect)
    expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
    expect(AppAnalytics.track).toHaveBeenCalledWith(
      KeylessBackupEvents.cab_sign_in_with_email_screen_cancel,
      { keylessBackupFlow: KeylessBackupFlow.Restore, origin: KeylessBackupOrigin.Settings }
    )
  })
})
