import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { KeylessBackupFlow, KeylessBackupStatus } from 'src/keylessBackup/types'
import { Screens } from 'src/navigator/Screens'
import { fireEvent, render, waitFor } from '@testing-library/react-native'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import * as React from 'react'
import KeylessBackupProgress from 'src/keylessBackup/KeylessBackupProgress'
import { navigate, navigateHome, ensurePincode } from 'src/navigator/NavigationService'
import { Provider } from 'react-redux'
import { mocked } from 'ts-jest/utils'
import { KeylessBackupEvents } from 'src/analytics/Events'

jest.mock('src/navigator/NavigationService')
jest.mock('src/analytics/ValoraAnalytics')

function createStore(keylessBackupStatus: KeylessBackupStatus) {
  return createMockStore({
    keylessBackup: {
      backupStatus: keylessBackupStatus,
    },
  })
}

function getProps() {
  return getMockStackScreenProps(Screens.KeylessBackupProgress, {
    keylessBackupFlow: KeylessBackupFlow.Setup,
  })
}

describe('KeylessBackupProgress', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('navigates to home on success', async () => {
    const { getByTestId } = render(
      <Provider store={createStore(KeylessBackupStatus.Completed)}>
        <KeylessBackupProgress {...getProps()} />
      </Provider>
    )
    expect(getByTestId('KeylessBackupProgress/Continue')).toBeTruthy()
    fireEvent.press(getByTestId('KeylessBackupProgress/Continue'))

    expect(navigateHome).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      KeylessBackupEvents.cab_progress_completed_continue
    )
  })
  it('navigates to home on failure', async () => {
    const { getByTestId } = render(
      <Provider store={createStore(KeylessBackupStatus.Failed)}>
        <KeylessBackupProgress {...getProps()} />
      </Provider>
    )
    expect(getByTestId('KeylessBackupProgress/Later')).toBeTruthy()
    fireEvent.press(getByTestId('KeylessBackupProgress/Later'))

    expect(navigateHome).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      KeylessBackupEvents.cab_progress_failed_later
    )
  })
  it('navigates to manual backup on failure', async () => {
    mocked(ensurePincode).mockResolvedValueOnce(true)
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
