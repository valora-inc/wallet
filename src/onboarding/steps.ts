import { BIOMETRY_TYPE } from 'react-native-keychain'
import { initializeAccount } from 'src/account/actions'
import {
  choseToRestoreAccountSelector,
  recoveringFromStoreWipeSelector,
} from 'src/account/selectors'
import {
  numberVerifiedCentrallySelector,
  skipVerificationSelector,
  supportedBiometryTypeSelector,
} from 'src/app/selectors'
import { setHasSeenVerificationNux } from 'src/identity/actions'
import * as NavigationService from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { store } from 'src/redux/store'

export const FIRST_ONBOARDING_SCREEN = Screens.NameAndPicture
export const END_OF_ONBOARDING_SCREEN = Screens.WalletHome

interface NavigatorFunctions {
  navigate: typeof NavigationService.navigate | ((screen: Screens) => void)
  popToScreen: typeof NavigationService.popToScreen | ((screen: Screens) => void)
  navigateHome: typeof NavigationService.navigateHome | (() => void)
  navigateClearingStack:
    | typeof NavigationService.navigateClearingStack
    | ((screen: Screens) => void)
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
}

/**
 * This function should return all the information needed to determine what the next step in onboarding is
 * for any given step in onboarding.
 *
 * @param state
 * @returns OnboardingProps
 */
export function onboardingPropsSelector(state: RootState): OnboardingProps {
  const recoveringFromStoreWipe = recoveringFromStoreWipeSelector(state)
  const choseToRestoreAccount = choseToRestoreAccountSelector(state)
  const supportedBiometryType = supportedBiometryTypeSelector(state)
  const skipVerification = skipVerificationSelector(state)
  const numberAlreadyVerifiedCentrally = numberVerifiedCentrallySelector(state)

  return {
    recoveringFromStoreWipe,
    choseToRestoreAccount,
    supportedBiometryType,
    skipVerification,
    numberAlreadyVerifiedCentrally,
  }
}

/**
 * Traverses through the directed graph of onboarding navigate, navigateClearingStack, and navigateHome calls
 * and count the number of screens until the given screen and the total number
 */
export function getOnboardingStepValues(screen: Screens, onboardingProps: OnboardingProps) {
  let stepCounter = 1 // will increment this up to the onboarding step the user is on
  let totalCounter = 1
  let reachedStep = false // tracks whether we have reached the step the user is on in onboarding, and we can stop incrementing stepCounter
  let currentScreen: Screens = FIRST_ONBOARDING_SCREEN // pointer that we will update when simulating navigation through the onboarding screens to calculate "step" and "totalSteps"

  const nextStepAndCount = (s: Screens) => {
    // dummy navigation function to help determine what onboarding step the user is on, without triggering side effects like actually cycling them back through the first few onboarding screens
    totalCounter++
    if (currentScreen === screen) {
      reachedStep = true
    }
    if (!reachedStep) {
      stepCounter++
    }
    currentScreen = s
  }

  const toHomeStep = () => {
    currentScreen = Screens.WalletHome
  }

  // @ts-ignore: Compiler doesn't understand that navigate() can update currentScreen
  while (currentScreen !== END_OF_ONBOARDING_SCREEN) {
    const stepInfo = _getStepInfo({
      firstScreenInStep: currentScreen,
      navigator: {
        navigate: nextStepAndCount,
        popToScreen: () => {
          // no-op
        },
        navigateHome: toHomeStep,
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
      navigateHome: NavigationService.navigateHome,
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
export function _getStepInfo({ firstScreenInStep, navigator, dispatch, props }: GetStepInfoProps) {
  const { navigate, popToScreen, navigateHome, navigateClearingStack } = navigator
  const {
    recoveringFromStoreWipe,
    choseToRestoreAccount,
    supportedBiometryType,
    skipVerification,
    numberAlreadyVerifiedCentrally,
  } = props

  switch (firstScreenInStep) {
    case Screens.NameAndPicture:
      return {
        next: () => {
          if (recoveringFromStoreWipe) {
            navigate(Screens.ImportWallet)
          } else {
            navigate(Screens.PincodeSet)
          }
        },
      }
    case Screens.PincodeSet:
      return {
        next: () => {
          if (supportedBiometryType !== null) {
            navigate(Screens.EnableBiometry)
          } else if (choseToRestoreAccount) {
            popToScreen(Screens.Welcome)
            navigate(Screens.ImportWallet)
          } else if (skipVerification) {
            dispatch(initializeAccount())
            // Tell the app that the user has already seen verification so that it
            // doesn't prompt for verification after the app is killed. This same function
            // is called when the user manually skips verification on the verification screen.
            dispatch(setHasSeenVerificationNux(true))
            navigateHome()
          } else {
            navigateClearingStack(Screens.VerificationStartScreen)
          }
        },
      }
    case Screens.EnableBiometry:
      return {
        next: () => {
          if (choseToRestoreAccount) {
            navigate(Screens.ImportWallet)
          } else if (skipVerification) {
            dispatch(initializeAccount())
            dispatch(setHasSeenVerificationNux(true))
            navigateHome()
          } else {
            navigate(Screens.VerificationStartScreen)
          }
        },
      }
    case Screens.ImportWallet:
      return {
        next: () => {
          if (skipVerification || numberAlreadyVerifiedCentrally) {
            dispatch(setHasSeenVerificationNux(true))
            // navigateHome will clear onboarding Stack
            navigateHome()
          } else {
            // DO NOT CLEAR NAVIGATION STACK HERE - breaks restore flow on initial app open in native-stack v6
            navigate(Screens.VerificationStartScreen)
          }
        },
      }
    case Screens.VerificationStartScreen:
      return {
        next: () => {
          // initializeAccount & setHasSeenVerificationNux are called in the middle of
          // the verification flow, so we don't need to call them here.
          navigateHome()
        },
      }
    default:
      throw new Error(
        `No step info found for ${firstScreenInStep}. this step needs to be handled in _getStepInfo`
      )
  }
}
