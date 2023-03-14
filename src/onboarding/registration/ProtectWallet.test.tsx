import * as React from 'react'
import 'react-native'
import ProtectWallet from 'src/onboarding/registration/ProtectWallet'
import { fireEvent, render, waitFor } from '@testing-library/react-native'
import { Provider } from 'react-redux'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import * as steps from 'src/onboarding/steps'
import { Screens } from 'src/navigator/Screens'
import { navigate } from 'src/navigator/NavigationService'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { OnboardingEvents } from 'src/analytics/Events'

jest.mock('src/analytics/ValoraAnalytics')
jest.mock('src/pincode/authentication', () => ({
  getPassword: jest.fn(),
}))
jest.mock('src/web3/contracts', () => ({
  getWalletAsync: jest.fn().mockResolvedValue({
    unlockAccount: jest.fn(),
  }),
}))

const mockScreenProps = getMockStackScreenProps(Screens.ProtectWallet)

const mockOnboardingProps = {
  recoveringFromStoreWipe: false,
  choseToRestoreAccount: false,
  skipVerification: false,
  supportedBiometryType: null,
  numberAlreadyVerifiedCentrally: false,
  showRecoveryPhrase: true,
  showCloudBackupFakeDoor: true,
}

describe('ProtectWalletScreen', () => {
  const store = createMockStore({
    web3: {
      twelveWordMnemonicEnabled: true,
      account: '0xaccount',
    },
  })
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(steps, 'onboardingPropsSelector').mockReturnValue(mockOnboardingProps)
  })
  it('Shows only recovery phrase option', async () => {
    const mockProps = { ...mockOnboardingProps, ...{ showCloudBackupFakeDoor: false } }
    jest.spyOn(steps, 'onboardingPropsSelector').mockReturnValue(mockProps)
    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <ProtectWallet {...mockScreenProps} />
      </Provider>
    )
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
