import { fireEvent, render, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { KeylessBackupEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import KeylessBackupProgress from 'src/keylessBackup/KeylessBackupProgress'
import { keylessBackupAcceptZeroBalance, keylessBackupBail } from 'src/keylessBackup/slice'
import { KeylessBackupFlow, KeylessBackupStatus } from 'src/keylessBackup/types'
import { ensurePincode, navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { goToNextOnboardingScreen } from 'src/onboarding/steps'
import Logger from 'src/utils/Logger'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockOnboardingProps } from 'test/values'

const mockOnboardingPropsSelector = jest.fn(() => mockOnboardingProps)

jest.mock('src/navigator/NavigationService')
jest.mock('src/analytics/ValoraAnalytics')
jest.mock('src/utils/Logger')
jest.mock('src/onboarding/steps', () => ({
  goToNextOnboardingScreen: jest.fn(),
  onboardingPropsSelector: () => mockOnboardingPropsSelector(),
}))

function createStore(keylessBackupStatus: KeylessBackupStatus, zeroBalance = false) {
  return createMockStore({
    keylessBackup: {
      backupStatus: keylessBackupStatus,
    },
    ...(zeroBalance && {
      tokens: {
        tokenBalances: {},
      },
      positions: {
        positions: [],
      },
    }),
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
    it('Logs error when not started', async () => {
      render(
        <Provider store={createStore(KeylessBackupStatus.NotStarted)}>
          <KeylessBackupProgress {...getProps()} />
        </Provider>
      )
      expect(Logger.error).toHaveBeenCalledTimes(1)
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
    it('Logs error when not started', async () => {
      render(
        <Provider store={createStore(KeylessBackupStatus.NotStarted)}>
          <KeylessBackupProgress {...getProps(KeylessBackupFlow.Restore)} />
        </Provider>
      )
      expect(Logger.error).toHaveBeenCalledTimes(1)
    })
    it('shows spinner when in progress', async () => {
      const { getByTestId } = render(
        <Provider store={createStore(KeylessBackupStatus.InProgress)}>
          <KeylessBackupProgress {...getProps(KeylessBackupFlow.Restore)} />
        </Provider>
      )
      expect(getByTestId('GreenLoadingSpinner')).toBeTruthy()
    })
    it('shows the confirm dialog when the user is restoring with zero balance', () => {
      const store = createStore(KeylessBackupStatus.RestoreZeroBalance)
      const { getByTestId } = render(
        <Provider store={store}>
          <KeylessBackupProgress {...getProps(KeylessBackupFlow.Restore)} />
        </Provider>
      )
      expect(getByTestId('ConfirmUseAccountDialog')).toBeTruthy()

      fireEvent.press(getByTestId('ConfirmUseAccountDialog/PrimaryAction'))
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(
        KeylessBackupEvents.cab_restore_zero_balance_accept
      )
      expect(store.getActions()).toEqual([keylessBackupAcceptZeroBalance()])

      store.clearActions()
      fireEvent.press(getByTestId('ConfirmUseAccountDialog/SecondaryAction'))
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(
        KeylessBackupEvents.cab_restore_zero_balance_bail
      )
      expect(store.getActions()).toEqual([keylessBackupBail()])
    })
    it('shows the completed screen when cab is completed', () => {
      const { getByTestId, getByText } = render(
        <Provider store={createStore(KeylessBackupStatus.Completed)}>
          <KeylessBackupProgress {...getProps(KeylessBackupFlow.Restore)} />
        </Provider>
      )
      expect(getByTestId('GreenLoadingSpinnerToCheck')).toBeTruthy()
      expect(getByText(`₱`, { exact: false })).toBeTruthy()
      expect(getByText(`45.22`, { exact: false })).toBeTruthy()

      fireEvent.press(getByTestId('KeylessBackupProgress/Continue'))
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(
        KeylessBackupEvents.cab_restore_completed_continue
      )
      expect(goToNextOnboardingScreen).toHaveBeenCalledWith({
        onboardingProps: expect.any(Object),
        firstScreenInCurrentStep: Screens.ImportSelect,
      })
    })
    it('shows the zero balance text when completed and the user has no balance', () => {
      const { getByText, getByTestId } = render(
        <Provider store={createStore(KeylessBackupStatus.Completed, true)}>
          <KeylessBackupProgress {...getProps(KeylessBackupFlow.Restore)} />
        </Provider>
      )
      expect(getByTestId('GreenLoadingSpinnerToCheck')).toBeTruthy()
      expect(getByTestId('KeylessBackupProgress/Continue')).toBeTruthy()
      expect(getByText('keylessBackupStatus.restore.completed.bodyZeroBalance')).toBeTruthy()
    })
    it('navigates to ImportSelect on failure', async () => {
      const { getByTestId } = render(
        <Provider store={createStore(KeylessBackupStatus.Failed)}>
          <KeylessBackupProgress {...getProps(KeylessBackupFlow.Restore)} />
        </Provider>
      )
      expect(getByTestId('RedLoadingSpinnerToInfo')).toBeTruthy()
      expect(getByTestId('KeylessBackupProgress/RestoreTryAgain')).toBeTruthy()
      fireEvent.press(getByTestId('KeylessBackupProgress/RestoreTryAgain'))

      expect(navigate).toHaveBeenCalledTimes(1)
      expect(navigate).toHaveBeenCalledWith(Screens.ImportSelect)
      expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(
        KeylessBackupEvents.cab_restore_failed_try_again
      )
    })
    it('navigates to Welcome screen on failure', async () => {
      const { getByTestId } = render(
        <Provider store={createStore(KeylessBackupStatus.Failed)}>
          <KeylessBackupProgress {...getProps(KeylessBackupFlow.Restore)} />
        </Provider>
      )
      expect(getByTestId('RedLoadingSpinnerToInfo')).toBeTruthy()
      expect(getByTestId('KeylessBackupProgress/RestoreCreateNewWallet')).toBeTruthy()
      fireEvent.press(getByTestId('KeylessBackupProgress/RestoreCreateNewWallet'))

      expect(navigate).toHaveBeenCalledTimes(1)
      expect(navigate).toHaveBeenCalledWith(Screens.Welcome)
      expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(
        KeylessBackupEvents.cab_restore_failed_create_new_wallet
      )
    })
    it('navigates to SupportContact screen on failure', async () => {
      const { getByTestId } = render(
        <Provider store={createStore(KeylessBackupStatus.Failed)}>
          <KeylessBackupProgress {...getProps(KeylessBackupFlow.Restore)} />
          <MockedNavigator
            component={KeylessBackupProgress}
            params={{
              keylessBackupFlow: KeylessBackupFlow.Restore,
            }}
          />
        </Provider>
      )
      expect(getByTestId('KeylessBackupRestoreHelp')).toBeTruthy()
      fireEvent.press(getByTestId('KeylessBackupRestoreHelp'))

      expect(navigate).toHaveBeenCalledTimes(1)
      expect(navigate).toHaveBeenCalledWith(Screens.SupportContact)
      expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(
        KeylessBackupEvents.cab_restore_failed_help
      )
    })
  })
})
