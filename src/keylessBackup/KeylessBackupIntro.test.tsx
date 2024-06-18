import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { KeylessBackupEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import KeylessBackupIntro from 'src/keylessBackup/KeylessBackupIntro'
import { KeylessBackupFlow, KeylessBackupOrigin } from 'src/keylessBackup/types'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import MockedNavigator from 'test/MockedNavigator'

describe('KeylessBackupIntro', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Setup flow', () => {
    it('pressing continue button emits analytics event and navigates to next screen', () => {
      const { getByTestId } = render(
        <MockedNavigator
          component={KeylessBackupIntro}
          params={{
            keylessBackupFlow: KeylessBackupFlow.Setup,
          }}
        />
      )
      const continueButton = getByTestId('keylessBackupIntro/Continue')
      fireEvent.press(continueButton)
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(KeylessBackupEvents.cab_intro_continue, {
        keylessBackupFlow: KeylessBackupFlow.Setup,
      })
      expect(navigate).toHaveBeenCalledWith(Screens.SignInWithEmail, {
        keylessBackupFlow: KeylessBackupFlow.Setup,
        origin: KeylessBackupOrigin.Settings,
      })
    })

    it('pressing recovery phrase emits analytics event and navigates to recovery phrase screen', () => {
      const { getByTestId } = render(
        <MockedNavigator
          component={KeylessBackupIntro}
          params={{
            keylessBackupFlow: KeylessBackupFlow.Setup,
          }}
        />
      )
      const recoveryPhraseLink = getByTestId('keylessBackupIntro/RecoveryPhrase')
      fireEvent.press(recoveryPhraseLink)
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(
        KeylessBackupEvents.cab_setup_recovery_phrase
      )
      expect(navigate).toHaveBeenCalledWith(Screens.BackupIntroduction)
    })
  })

  describe('Restore flow', () => {
    it('pressing continue button emits analytics event and navigates to next screen', () => {
      const { getByTestId } = render(
        <MockedNavigator
          component={KeylessBackupIntro}
          params={{
            keylessBackupFlow: KeylessBackupFlow.Restore,
          }}
        />
      )
      const continueButton = getByTestId('keylessBackupIntro/Continue')
      fireEvent.press(continueButton)
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(KeylessBackupEvents.cab_intro_continue, {
        keylessBackupFlow: KeylessBackupFlow.Restore,
      })
      expect(navigate).toHaveBeenCalledWith(Screens.SignInWithEmail, {
        keylessBackupFlow: KeylessBackupFlow.Restore,
        origin: KeylessBackupOrigin.Settings,
      })
    })
  })
})
