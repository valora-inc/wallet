import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { KeylessBackupEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import KeylessBackupCancelButton from 'src/keylessBackup/KeylessBackupCancelButton'
import { KeylessBackupFlow } from 'src/keylessBackup/types'
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
        flow={KeylessBackupFlow.Setup}
      />
    )
    expect(getByTestId('CancelButton')).toBeTruthy()

    fireEvent.press(getByTestId('CancelButton'))

    expect(navigateHome).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      KeylessBackupEvents.cab_enter_phone_number_cancel,
      { keylessBackupFlow: KeylessBackupFlow.Setup }
    )
  })

  it('navigates correctly for restore', () => {
    const { getByTestId } = render(
      <KeylessBackupCancelButton
        eventName={KeylessBackupEvents.cab_sign_in_with_email_screen_cancel}
        flow={KeylessBackupFlow.Restore}
      />
    )
    expect(getByTestId('CancelButton')).toBeTruthy()

    fireEvent.press(getByTestId('CancelButton'))

    expect(navigate).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith(Screens.ImportSelect)
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      KeylessBackupEvents.cab_sign_in_with_email_screen_cancel,
      { keylessBackupFlow: KeylessBackupFlow.Restore }
    )
  })
})
