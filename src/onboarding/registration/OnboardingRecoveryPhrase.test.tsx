import Clipboard from '@react-native-clipboard/clipboard'
import { fireEvent, render, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import { recoveryPhraseInOnboardingCompleted } from 'src/account/actions'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { Screens } from 'src/navigator/Screens'
import OnboardingRecoveryPhrase from 'src/onboarding/registration/OnboardingRecoveryPhrase'
import { goToNextOnboardingScreen } from 'src/onboarding/steps'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockOnboardingProps, mockTwelveWordMnemonic } from 'test/values'

const mockUseAccountKey = jest.fn(() => mockTwelveWordMnemonic)
const mockOnboardingPropsSelector = jest.fn(() => mockOnboardingProps)

jest.mock('src/analytics/ValoraAnalytics')
jest.mock('src/backup/utils', () => ({
  useAccountKey: () => mockUseAccountKey(),
}))
jest.mock('src/onboarding/steps', () => ({
  goToNextOnboardingScreen: jest.fn(),
  getOnboardingStepValues: () => ({ step: 3, totalSteps: 3 }),
  onboardingPropsSelector: () => mockOnboardingPropsSelector(),
}))

const mockScreenProps = getMockStackScreenProps(Screens.OnboardingRecoveryPhrase)

describe('OnboardingRecoveryPhraseScreen', () => {
  const store = createMockStore({
    web3: {
      account: '0xaccount',
    },
  })
  store.dispatch = jest.fn()
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('navigates when button pressed', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <OnboardingRecoveryPhrase {...mockScreenProps} />
      </Provider>
    )
    fireEvent.press(getByTestId('protectWalletBottomSheetContinue'))
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(OnboardingEvents.protect_wallet_complete)
    expect(store.dispatch).toHaveBeenCalledWith(recoveryPhraseInOnboardingCompleted())
    expect(goToNextOnboardingScreen).toBeCalledWith({
      firstScreenInCurrentStep: Screens.ProtectWallet,
      onboardingProps: mockOnboardingProps,
    })
  })
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip('opens bottom sheet when help pressed', async () => {
    // Un-skip when able to test behavior of useLayoutEffect hook
    const { getByTestId } = render(
      <Provider store={store}>
        <OnboardingRecoveryPhrase {...mockScreenProps} />
      </Provider>
    )
    await waitFor(() => {
      expect(getByTestId('helpButton')).toBeTruthy()
    })
    fireEvent.press(getByTestId('helpButton'))
    await waitFor(() => {
      expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(OnboardingEvents.protect_wallet_help)
    })
  })
  it('copies to clipboard', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <OnboardingRecoveryPhrase {...mockScreenProps} />
      </Provider>
    )
    fireEvent.press(getByTestId('protectWalletCopy'))
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(OnboardingEvents.protect_wallet_copy_phrase)
    expect(Clipboard.setString).toHaveBeenCalledWith(mockTwelveWordMnemonic)
  })
})
