import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import SetUpKeylessBackup from 'src/keylessBackup/SetUpKeylessBackup'
import { KeylessBackupFlow } from 'src/keylessBackup/types'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'

describe('SetUpKeylessBackup', () => {
  it('pressing continue button emits analytics event and navigates to next screen', () => {
    const { getByTestId } = render(<SetUpKeylessBackup />)
    const continueButton = getByTestId('SetUpKeylessBackup/Continue')
    fireEvent.press(continueButton)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith('set_up_keyless_backup_screen_continue')
    expect(navigate).toHaveBeenCalledWith(Screens.SignInWithEmail, {
      keylessBackupFlow: KeylessBackupFlow.Setup,
    })
  })
})
