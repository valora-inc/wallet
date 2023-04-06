import { fireEvent, render, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import { recoveryPhraseInOnboardingSeen } from 'src/account/actions'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import ProtectWallet from 'src/onboarding/registration/ProtectWallet'
import { getExperimentParams } from 'src/statsig'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockOnboardingProps } from 'test/values'
import { mocked } from 'ts-jest/utils'

jest.mock('src/statsig')
jest.mock('src/analytics/ValoraAnalytics')
jest.mock('src/pincode/authentication', () => ({
  getPassword: jest.fn(),
}))
jest.mock('src/web3/contracts', () => ({
  getWalletAsync: jest.fn().mockResolvedValue({
    unlockAccount: jest.fn(),
  }),
}))
jest.mock('src/onboarding/steps', () => ({
  getOnboardingStepValues: () => ({ step: 3, totalSteps: 3 }),
  onboardingPropsSelector: () => mockOnboardingProps,
}))
jest.mock('src/navigator/NavigationService', () => {
  const originalModule = jest.requireActual('src/navigator/NavigationService')
  return {
    ...originalModule,
    navigate: jest.fn(),
    ensurePincode: jest.fn().mockResolvedValue(true),
  }
})

const mockScreenProps = getMockStackScreenProps(Screens.ProtectWallet)

const mockExperimentParams = {
  enableForcedBackup: true,
  showRecoveryPhraseInOnboarding: true,
  showCloudBackupFakeDoor: true,
  useNewBackupFlowCopy: false,
  showBackupAlert: false,
  useNewBackupHomeCard: false,
  chooseAdventureEnabled: false,
  onboardingNameScreenEnabled: true,
  cashInBottomSheetEnabled: false,
}

describe('ProtectWalletScreen', () => {
  const store = createMockStore({
    web3: {
      twelveWordMnemonicEnabled: true,
      account: '0xaccount',
    },
  })
  store.dispatch = jest.fn()
  beforeEach(() => {
    jest.clearAllMocks()
    mocked(getExperimentParams).mockReturnValue(mockExperimentParams)
  })
  it('Shows only recovery phrase option', async () => {
    const mockParams = { ...mockExperimentParams, showCloudBackupFakeDoor: false }
    mocked(getExperimentParams).mockReturnValue(mockParams)
    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <ProtectWallet {...mockScreenProps} />
      </Provider>
    )
    expect(store.dispatch).toHaveBeenCalledWith(recoveryPhraseInOnboardingSeen())
    await waitFor(() => {
      expect(getByTestId('recoveryPhraseCard')).toBeTruthy()
      expect(queryByTestId('cloudBackupCard')).toBeNull()
    })
  })
  it('Shows cloud backup and recovery phrase', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <ProtectWallet {...mockScreenProps} />
      </Provider>
    )
    expect(store.dispatch).toHaveBeenCalledWith(recoveryPhraseInOnboardingSeen())
    await waitFor(() => {
      expect(getByTestId('recoveryPhraseCard')).toBeTruthy()
      expect(getByTestId('cloudBackupCard')).toBeTruthy()
    })
  })
  it('navigates when recovery phrase is selected', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <ProtectWallet {...mockScreenProps} />
      </Provider>
    )
    await waitFor(() => {
      expect(getByTestId('recoveryPhraseCard')).toBeTruthy()
    })
    fireEvent.press(getByTestId('recoveryPhraseCard'))
    await waitFor(() => {
      expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(
        OnboardingEvents.protect_wallet_use_recovery,
        {
          position: 1,
        }
      )
      expect(navigate).toHaveBeenCalledWith(Screens.OnboardingRecoveryPhrase)
    })
  })
  it('opens bottom sheet when cloud backup is selected', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <ProtectWallet {...mockScreenProps} />
      </Provider>
    )
    await waitFor(() => {
      expect(getByTestId('cloudBackupCard')).toBeTruthy()
    })

    fireEvent.press(getByTestId('cloudBackupCard'))
    await waitFor(() => {
      expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(
        OnboardingEvents.protect_wallet_use_cloud,
        {
          position: 0,
        }
      )
      expect(getByTestId('protectWalletBottomSheet')).toBeTruthy()
    })
  })
  it('navigates when bottom sheet button pressed', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <ProtectWallet {...mockScreenProps} />
      </Provider>
    )
    await waitFor(() => {
      expect(getByTestId('cloudBackupCard')).toBeTruthy()
    })
    fireEvent.press(getByTestId('cloudBackupCard'))
    await waitFor(() => {
      expect(getByTestId('protectWalletBottomSheetContinue')).toBeTruthy()
    })
    fireEvent.press(getByTestId('protectWalletBottomSheetContinue'))
    await waitFor(() => {
      expect(ValoraAnalytics.track).toHaveBeenCalledTimes(2)
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(
        OnboardingEvents.protect_wallet_use_cloud_bottom_sheet
      )
      expect(navigate).toHaveBeenCalledWith(Screens.OnboardingRecoveryPhrase)
    })
  })
})
