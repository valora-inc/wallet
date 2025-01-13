import { BIOMETRY_TYPE } from 'react-native-keychain'
import { createSelector } from 'reselect'
import { initializeAccount } from 'src/account/actions'
import {
  choseToRestoreAccountSelector,
  recoveringFromStoreWipeSelector,
} from 'src/account/selectors'
import { phoneNumberVerifiedSelector, supportedBiometryTypeSelector } from 'src/app/selectors'
import { ONBOARDING_FEATURES_ENABLED } from 'src/config'
import { KeylessBackupFlow, KeylessBackupOrigin } from 'src/keylessBackup/types'
import * as NavigationService from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import {
  onboardingCompleted,
  updateLastOnboardingScreen,
  updateStatsigAndNavigate,
} from 'src/onboarding/actions'
import { ToggleableOnboardingFeatures } from 'src/onboarding/types'
import { store } from 'src/redux/store'

const END_OF_ONBOARDING_SCREEN: keyof StackParamList = Screens.OnboardingSuccessScreen

interface NavigatorFunctions {
  navigate: typeof NavigationService.navigate
  popToScreen: typeof NavigationService.popToScreen
  finishOnboarding: () => void
  navigateClearingStack: typeof NavigationService.navigateClearingStack
}

interface GetStepInfoProps {
  firstScreenInStep: Screens
  navigator: NavigatorFunctions
  dispatch: (action: any) => void
  props: OnboardingProps
}

export interface OnboardingProps {
  recoveringFromStoreWipe: boolean
  choseToRestoreAccount: boolean | undefined
  supportedBiometryType: BIOMETRY_TYPE | null
  skipVerification: boolean
  numberAlreadyVerifiedCentrally: boolean
  showCloudAccountBackupRestore: boolean
  showCloudAccountBackupSetup: boolean
  skipProtectWallet: boolean
}

/**
 * Helper function to determine where onboarding starts.
 */
export function firstOnboardingScreen({
  recoveringFromStoreWipe,
}: {
  recoveringFromStoreWipe: boolean
}): Screens.ImportSelect | Screens.ImportWallet | Screens.PincodeSet {
  if (recoveringFromStoreWipe) {
    return ONBOARDING_FEATURES_ENABLED[ToggleableOnboardingFeatures.CloudBackup]
      ? Screens.ImportSelect
      : Screens.ImportWallet
  } else {
    return Screens.PincodeSet
  }
}

/**
 * This function should return all the information needed to determine what the next step in onboarding is
 * for any given step in onboarding.
 *
 * @param state
 * @returns OnboardingProps
 */
export const onboardingPropsSelector = createSelector(
  [
    recoveringFromStoreWipeSelector,
    choseToRestoreAccountSelector,
    supportedBiometryTypeSelector,
    phoneNumberVerifiedSelector,
  ],
  (
    recoveringFromStoreWipe,
    choseToRestoreAccount,
    supportedBiometryType,
    numberAlreadyVerifiedCentrally
  ) => {
    const showCloudAccountBackupRestore =
      ONBOARDING_FEATURES_ENABLED[ToggleableOnboardingFeatures.CloudBackup]

    const skipVerification =
      !ONBOARDING_FEATURES_ENABLED[ToggleableOnboardingFeatures.PhoneVerification]

    const showCloudAccountBackupSetup =
      ONBOARDING_FEATURES_ENABLED[ToggleableOnboardingFeatures.CloudBackup] &&
      ONBOARDING_FEATURES_ENABLED[ToggleableOnboardingFeatures.CloudBackupSetupInOnboarding]

    const skipProtectWallet =
      !ONBOARDING_FEATURES_ENABLED[ToggleableOnboardingFeatures.ProtectWallet]

    return {
      recoveringFromStoreWipe,
      choseToRestoreAccount,
      supportedBiometryType: ONBOARDING_FEATURES_ENABLED[
        ToggleableOnboardingFeatures.EnableBiometry
      ]
        ? supportedBiometryType
        : null,
      skipVerification,
      numberAlreadyVerifiedCentrally,
      showCloudAccountBackupRestore,
      showCloudAccountBackupSetup,
      skipProtectWallet,
    }
  }
)

/**
 * Traverses through the directed graph of onboarding navigate, navigateClearingStack, and navigateHome calls
 * and count the number of screens until the given screen and the total number
 */
export function getOnboardingStepValues(screen: Screens, onboardingProps: OnboardingProps) {
  const firstScreen = firstOnboardingScreen({
    recoveringFromStoreWipe: onboardingProps.recoveringFromStoreWipe,
  })

  let stepCounter = 1 // will increment this up to the onboarding step the user is on
  let totalCounter = 1
  let reachedStep = false // tracks whether we have reached the step the user is on in onboarding, and we can stop incrementing stepCounter
  let currentScreen: Screens = firstScreen // pointer that we will update when simulating navigation through the onboarding screens to calculate "step" and "totalSteps"

  const nextStepAndCount: typeof NavigationService.navigate = (...args) => {
    // dummy navigation function to help determine what onboarding step the user is on, without triggering side effects like actually cycling them back through the first few onboarding screens
    const [nextScreen] = args
    if (nextScreen !== END_OF_ONBOARDING_SCREEN) {
      totalCounter++
      if (currentScreen === screen) {
        reachedStep = true
      }
      if (!reachedStep) {
        stepCounter++
      }
    }
    currentScreen = nextScreen
  }

  const finishOnboarding = () => {
    currentScreen = END_OF_ONBOARDING_SCREEN
  }

  while (currentScreen !== END_OF_ONBOARDING_SCREEN) {
    const stepInfo = _getStepInfo({
      firstScreenInStep: currentScreen,
      navigator: {
        navigate: nextStepAndCount,
        popToScreen: () => {
          // no-op
        },
        finishOnboarding,
        navigateClearingStack: nextStepAndCount,
      },
      dispatch: () => {
        // no-op
      },
      props: onboardingProps,
    })
    if (!stepInfo) {
      throw new Error(`No step info found for ${currentScreen}.`)
    }
    stepInfo?.next()
  }

  return {
    totalSteps: totalCounter,
    step: stepCounter,
  }
}

export function goToNextOnboardingScreen({
  firstScreenInCurrentStep,
  onboardingProps,
}: {
  firstScreenInCurrentStep: Screens
  onboardingProps: OnboardingProps
}) {
  const stepInfo = _getStepInfo({
    firstScreenInStep: firstScreenInCurrentStep,
    navigator: {
      navigate: NavigationService.navigate,
      popToScreen: NavigationService.popToScreen,
      finishOnboarding: () => {
        store.dispatch(onboardingCompleted())
        store.dispatch(updateLastOnboardingScreen(END_OF_ONBOARDING_SCREEN))
        store.dispatch(updateStatsigAndNavigate(END_OF_ONBOARDING_SCREEN))
      },
      navigateClearingStack: NavigationService.navigateClearingStack,
    },
    dispatch: store.dispatch,
    props: onboardingProps,
  })
  stepInfo?.next()
}

/**
 * This function is used to determine what the next step is for each step in the onboarding flow and is the
 * source of truth for such info. New onboarding screens need to be handled by it.
 *
 * @param firstScreenInStep The first screen in the step that we are trying to get info for
 * @param navigator The navigator functions to use (from NavigationService for actually navigating, or custom functions for calculating onboarding step)
 * @param dispatch The dispatch function
 * @param props The onboarding props aka all of the customer state that we need to determine what the next step is
 * @returns
 */
function _getStepInfo({ firstScreenInStep, navigator, dispatch, props }: GetStepInfoProps) {
  const { navigate, popToScreen, finishOnboarding } = navigator
  const {
    choseToRestoreAccount,
    supportedBiometryType,
    skipVerification,
    numberAlreadyVerifiedCentrally,
    showCloudAccountBackupSetup,
    skipProtectWallet,
  } = props

  function wrapNavigate<RouteName extends keyof StackParamList>(
    ...args: NavigationService.NavigateParams<RouteName>
  ) {
    const [screen] = args
    navigate(...args)
    dispatch(updateLastOnboardingScreen(screen))
  }

  const navigateToPhoneVerificationOrFinish = (
    screen:
      | Screens.LinkPhoneNumber
      | Screens.VerificationStartScreen = Screens.VerificationStartScreen
  ) => {
    if (skipVerification || numberAlreadyVerifiedCentrally) {
      finishOnboarding()
    } else {
      // DO NOT CLEAR NAVIGATION STACK HERE - breaks restore flow on initial app open in native-stack v6
      wrapNavigate(screen)
    }
  }

  const biometryNext = () => {
    if (choseToRestoreAccount) {
      popToScreen(Screens.Welcome)
      if (props.showCloudAccountBackupRestore) {
        wrapNavigate(Screens.ImportSelect)
      } else {
        wrapNavigate(Screens.ImportWallet)
      }
    } else if (showCloudAccountBackupSetup) {
      dispatch(initializeAccount())
      wrapNavigate(Screens.SignInWithEmail, {
        keylessBackupFlow: KeylessBackupFlow.Setup,
        origin: KeylessBackupOrigin.Onboarding,
      })
    } else {
      dispatch(initializeAccount())
      if (skipProtectWallet) {
        navigateToPhoneVerificationOrFinish()
      } else {
        wrapNavigate(Screens.ProtectWallet)
      }
    }
  }

  switch (firstScreenInStep) {
    case Screens.PincodeSet:
      return {
        next: () => {
          if (supportedBiometryType !== null) {
            wrapNavigate(Screens.EnableBiometry)
          } else {
            biometryNext()
          }
        },
      }
    case Screens.EnableBiometry:
      return {
        next: () => biometryNext(),
      }
    case Screens.ImportSelect:
    case Screens.SignInWithEmail:
      return {
        next: () => navigateToPhoneVerificationOrFinish(Screens.LinkPhoneNumber),
      }
    case Screens.ImportWallet:
    case Screens.ProtectWallet:
      return {
        next: () => navigateToPhoneVerificationOrFinish(),
      }
    case Screens.LinkPhoneNumber:
    case Screens.VerificationStartScreen:
      return {
        next: () => finishOnboarding(),
      }
    default:
      throw new Error(
        `No step info found for ${firstScreenInStep}. this step needs to be handled in _getStepInfo`
      )
  }
}
