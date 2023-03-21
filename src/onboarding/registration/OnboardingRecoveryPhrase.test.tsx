import * as React from 'react'
import 'react-native'
import OnboardingRecoveryPhrase from 'src/onboarding/registration/OnboardingRecoveryPhrase'
import { fireEvent, render, waitFor } from '@testing-library/react-native'
import { Provider } from 'react-redux'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { Screens } from 'src/navigator/Screens'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { OnboardingEvents } from 'src/analytics/Events'
import { mockOnboardingProps, mockTwelveWordMnemonic } from 'test/values'
import { goToNextOnboardingScreen } from 'src/onboarding/steps'
import Clipboard from '@react-native-clipboard/clipboard'

jest.mock('src/analytics/ValoraAnalytics')
jest.mock('src/backup/utils', () => ({
  useAccountKey: () => mockTwelveWordMnemonic,
}))
jest.mock('src/onboarding/steps', () => ({
  goToNextOnboardingScreen: jest.fn(),
  getOnboardingStepValues: () => ({ step: 3, totalSteps: 3 }),
  onboardingPropsSelector: () => mockOnboardingProps,
}))
jest.mock('@react-native-clipboard/clipboard', () => ({
  setString: jest.fn(),
}))

const mockScreenProps = getMockStackScreenProps(Screens.OnboardingRecoveryPhrase)

describe('OnboardingRecoveryPhraseScreen', () => {
  const store = createMockStore({
    web3: {
      twelveWordMnemonicEnabled: true,
      account: '0xaccount',
    },
  })
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
