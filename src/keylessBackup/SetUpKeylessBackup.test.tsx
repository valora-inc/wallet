import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { KeylessBackupEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import SetUpKeylessBackup from 'src/keylessBackup/SetUpKeylessBackup'
import { KeylessBackupFlow } from 'src/keylessBackup/types'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'

describe('SetUpKeylessBackup', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('pressing continue button emits analytics event and navigates to next screen', () => {
    const { getByTestId } = render(<SetUpKeylessBackup />)
    const continueButton = getByTestId('SetUpKeylessBackup/Continue')
    fireEvent.press(continueButton)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(KeylessBackupEvents.cab_setup_continue)
    expect(navigate).toHaveBeenCalledWith(Screens.SignInWithEmail, {
      keylessBackupFlow: KeylessBackupFlow.Setup,
    })
  })

  it('pressing recovery phrase emits analytics event and navigates to recovery phrase screen', () => {
    const { getByTestId } = render(<SetUpKeylessBackup />)
    const recoveryPhraseLink = getByTestId('SetUpKeylessBackup/RecoveryPhrase')
    fireEvent.press(recoveryPhraseLink)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      KeylessBackupEvents.cab_setup_recovery_phrase
    )
    expect(navigate).toHaveBeenCalledWith(Screens.BackupIntroduction)
  })
})
