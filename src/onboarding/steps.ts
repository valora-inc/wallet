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

interface GetScreenInfoProps {
  screen: Screens
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
  let stepCounter = 1
  let totalCounter = 1
  let reachedScreeen = false
  let currentScreen: Screens = FIRST_ONBOARDING_SCREEN

  const navigate = (s: Screens) => {
    totalCounter++
    if (currentScreen === screen) {
      reachedScreeen = true
    }
    if (!reachedScreeen) {
      stepCounter++
    }
    currentScreen = s
  }

  const navigateHome = () => {
    currentScreen = END_OF_ONBOARDING_SCREEN
  }

  // @ts-ignore: Compiler doesn't understand that navigate() can update currentScreen
  while (currentScreen !== END_OF_ONBOARDING_SCREEN) {
    const screenInfo = _getScreenInfo({
      screen: currentScreen,
      navigator: {
        navigate,
        popToScreen: () => {
          // no-op
        },
        navigateHome,
        navigateClearingStack: navigate,
      },
      dispatch: () => {
        // no-op
      },
      props: onboardingProps,
    })
    if (!screenInfo) {
      throw new Error(`No screen info found for ${currentScreen}.`)
    }
    screenInfo?.next()
  }

  return {
    totalSteps: totalCounter,
    step: stepCounter,
  }
}

export function goToNextOnboardingScreen(screen: Screens, onboardingProps: OnboardingProps) {
  const screenInfo = _getScreenInfo({
    screen,
    navigator: {
      navigate: NavigationService.navigate,
      popToScreen: NavigationService.popToScreen,
      navigateHome: NavigationService.navigateHome,
      navigateClearingStack: NavigationService.navigateClearingStack,
    },
    dispatch: store.dispatch,
    props: onboardingProps,
  })
  screenInfo?.next()
}

export function _getScreenInfo({ screen, navigator, dispatch, props }: GetScreenInfoProps) {
  const { navigate, popToScreen, navigateHome, navigateClearingStack } = navigator
  const {
    recoveringFromStoreWipe,
    choseToRestoreAccount,
    supportedBiometryType,
    skipVerification,
    numberAlreadyVerifiedCentrally,
  } = props

  const onboardingScreens: Partial<{
    [key in Screens]: {
      next: () => void
    }
  }> = {
    [Screens.NameAndPicture]: {
      next: () => {
        if (recoveringFromStoreWipe) {
          navigate(Screens.ImportWallet)
        } else {
          navigate(Screens.PincodeSet)
        }
      },
    },
    [Screens.PincodeSet]: {
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
    },
    [Screens.EnableBiometry]: {
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
    },
    [Screens.ImportWallet]: {
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
    },
    [Screens.VerificationStartScreen]: {
      next: () => {
        // initializeAccount & setHasSeenVerificationNux are called in the middle of
        // the verification flow, so we don't need to call them here.
        navigateHome()
      },
    },
  }

  return onboardingScreens[screen]
}
