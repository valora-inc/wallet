import { PincodeType, RecoveryPhraseInOnboardingStatus } from 'src/account/reducer'
import { MultichainBetaStatus } from 'src/app/actions'
import { getInitialRoute } from 'src/navigator/initialRoute'
import { Screens } from 'src/navigator/Screens'
import { getFeatureGate } from 'src/statsig'
import { ONBOARDING_FEATURES_ENABLED } from 'src/config'
import { ToggleableOnboardingFeatures } from 'src/onboarding/types'

jest.mock('src/statsig/index')
jest.mock('src/config', () => ({
  ...jest.requireActual('src/config'),
  ONBOARDING_FEATURES_ENABLED: { PhoneVerification: false, CloudBackup: false },
}))

describe('initialRoute', () => {
  const defaultArgs: Parameters<typeof getInitialRoute>[0] = {
    choseToRestoreAccount: false,
    language: 'en',
    acceptedTerms: true,
    pincodeType: PincodeType.CustomPin,
    account: '0x1234',
    hasSeenVerificationNux: true,
    recoveryPhraseInOnboardingStatus: RecoveryPhraseInOnboardingStatus.NotStarted,
    multichainBetaStatus: MultichainBetaStatus.OptedOut,
  }

  beforeEach(() => {
    jest.replaceProperty(
      ONBOARDING_FEATURES_ENABLED,
      ToggleableOnboardingFeatures.CloudBackup,
      false
    )
    jest.replaceProperty(
      ONBOARDING_FEATURES_ENABLED,
      ToggleableOnboardingFeatures.PhoneVerification,
      false
    )
    jest.mocked(getFeatureGate).mockReturnValue(false)
  })
})
