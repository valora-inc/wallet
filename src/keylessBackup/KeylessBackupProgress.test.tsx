import { fireEvent, render, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { KeylessBackupEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import KeylessBackupProgress from 'src/keylessBackup/KeylessBackupProgress'
import { KeylessBackupFlow, KeylessBackupStatus } from 'src/keylessBackup/types'
import { ensurePincode, navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

jest.mock('src/navigator/NavigationService')
jest.mock('src/analytics/ValoraAnalytics')

function createStore(keylessBackupStatus: KeylessBackupStatus) {
  return createMockStore({
    keylessBackup: {
      backupStatus: keylessBackupStatus,
    },
  })
}

function getProps(flow: KeylessBackupFlow = KeylessBackupFlow.Setup) {
  return getMockStackScreenProps(Screens.KeylessBackupProgress, {
    keylessBackupFlow: flow,
  })
}

describe('KeylessBackupProgress', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  describe('setup', () => {
    it('shows spinner when not started', async () => {
      const { getByTestId } = render(
        <Provider store={createStore(KeylessBackupStatus.NotStarted)}>
          <KeylessBackupProgress {...getProps()} />
        </Provider>
      )
      expect(getByTestId('GreenLoadingSpinner')).toBeTruthy()
    })
    it('shows spinner when in progress', async () => {
      const { getByTestId } = render(
        <Provider store={createStore(KeylessBackupStatus.InProgress)}>
          <KeylessBackupProgress {...getProps()} />
        </Provider>
      )
      expect(getByTestId('GreenLoadingSpinner')).toBeTruthy()
    })
    it('navigates to home on success', async () => {
      const { getByTestId } = render(
        <Provider store={createStore(KeylessBackupStatus.Completed)}>
          <KeylessBackupProgress {...getProps()} />
        </Provider>
      )
      expect(getByTestId('GreenLoadingSpinnerToCheck')).toBeTruthy()
      expect(getByTestId('KeylessBackupProgress/Continue')).toBeTruthy()
      fireEvent.press(getByTestId('KeylessBackupProgress/Continue'))

      expect(navigateHome).toHaveBeenCalledTimes(1)
      expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(
        KeylessBackupEvents.cab_progress_completed_continue
      )
    })
    it('navigates to settings on failure', async () => {
      const { getByTestId } = render(
        <Provider store={createStore(KeylessBackupStatus.Failed)}>
          <KeylessBackupProgress {...getProps()} />
        </Provider>
      )
      expect(getByTestId('RedLoadingSpinnerToInfo')).toBeTruthy()
      expect(getByTestId('KeylessBackupProgress/Later')).toBeTruthy()
      fireEvent.press(getByTestId('KeylessBackupProgress/Later'))

      expect(navigate).toHaveBeenCalledTimes(1)
      expect(navigate).toHaveBeenCalledWith(Screens.Settings)
      expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(
        KeylessBackupEvents.cab_progress_failed_later
      )
    })
    it('navigates to manual backup on failure', async () => {
      jest.mocked(ensurePincode).mockResolvedValueOnce(true)
      const { getByTestId } = render(
        <Provider store={createStore(KeylessBackupStatus.Failed)}>
          <KeylessBackupProgress {...getProps()} />
        </Provider>
      )
      expect(getByTestId('KeylessBackupProgress/Manual')).toBeTruthy()
      fireEvent.press(getByTestId('KeylessBackupProgress/Manual'))

      await waitFor(() => expect(navigate).toHaveBeenCalledTimes(1))
      expect(navigate).toHaveBeenCalledWith(Screens.BackupIntroduction)

      expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(
        KeylessBackupEvents.cab_progress_failed_manual
      )
    })
  })
  describe('Restore', () => {
    it('shows spinner when in progress', async () => {
      const { getByTestId } = render(
        <Provider store={createStore(KeylessBackupStatus.InProgress)}>
          <KeylessBackupProgress {...getProps(KeylessBackupFlow.Restore)} />
        </Provider>
      )
      expect(getByTestId('GreenLoadingSpinner')).toBeTruthy()
    })
    it('shows the confirm dialog when the user is restoring with zero balance', () => {
      const { getByTestId } = render(
        <Provider store={createStore(KeylessBackupStatus.RestoreZeroBalance)}>
          <KeylessBackupProgress {...getProps(KeylessBackupFlow.Restore)} />
        </Provider>
      )
      expect(getByTestId('ConfirmUseAccountDialog')).toBeTruthy()
    })
  })
})
