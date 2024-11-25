import { PincodeType } from 'src/account/reducer'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'

export function getInitialRoute({
  language,
  acceptedTerms,
  pincodeType,
  onboardingCompleted,
  lastOnboardingStepScreen,
}: {
  language: string | null
  acceptedTerms: boolean
  pincodeType: PincodeType
  onboardingCompleted: boolean
  lastOnboardingStepScreen: keyof StackParamList
}) {
  // We maintain a few fail-safes here, but these ought to be handled correctly
  // by the onboarding steps logic.
  if (!language) {
    return Screens.Language
  } else if (!acceptedTerms || pincodeType === PincodeType.Unset) {
    return Screens.Welcome
  }
  if (onboardingCompleted) {
    return Screens.TabNavigator
  }
  return lastOnboardingStepScreen
}
