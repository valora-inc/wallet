import { fireEvent, render, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import { recoveryPhraseInOnboardingStarted } from 'src/account/actions'
import { RecoveryPhraseInOnboardingStatus } from 'src/account/reducer'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import ProtectWallet from 'src/onboarding/registration/ProtectWallet'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockOnboardingProps } from 'test/values'

jest.mock('src/analytics/ValoraAnalytics')
jest.mock('src/pincode/authentication', () => ({
  getPassword: jest.fn(),
}))
jest.mock('src/web3/contracts', () => ({
  getWalletAsync: jest.fn().mockResolvedValue({
    unlockAccount: jest.fn(),
  }),
}))
const mockOnboardingPropsSelector = jest.fn(() => mockOnboardingProps)
jest.mock('src/onboarding/steps', () => ({
  getOnboardingStepValues: () => ({ step: 3, totalSteps: 3 }),
  onboardingPropsSelector: () => mockOnboardingPropsSelector(),
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

describe('ProtectWalletScreen', () => {
  const store = createMockStore({
    web3: {
      account: '0xaccount',
    },
  })
  store.dispatch = jest.fn()
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('Shows recovery phrase option', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <ProtectWallet {...mockScreenProps} />
      </Provider>
    )
    expect(store.dispatch).toHaveBeenCalledWith(recoveryPhraseInOnboardingStarted())
    await waitFor(() => {
      expect(getByTestId('recoveryPhraseCard')).toBeTruthy()
    })
  })
  it('does not dispatch event if recoveryPhraseInOnboardingStatus is not NotStarted', async () => {
    const mockStore = createMockStore({
      web3: {
        account: '0xaccount',
      },
      account: {
        recoveryPhraseInOnboardingStatus: RecoveryPhraseInOnboardingStatus.InProgress,
      },
    })
    const { getByTestId } = render(
      <Provider store={mockStore}>
        <ProtectWallet {...mockScreenProps} />
      </Provider>
    )
    expect(store.dispatch).not.toHaveBeenCalled()
    await waitFor(() => {
      expect(getByTestId('recoveryPhraseCard')).toBeTruthy()
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
        OnboardingEvents.protect_wallet_use_recovery
      )
      expect(navigate).toHaveBeenCalledWith(Screens.OnboardingRecoveryPhrase)
    })
  })
})
