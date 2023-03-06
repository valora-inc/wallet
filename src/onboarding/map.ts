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
import { store } from 'src/redux/store'

interface GetOnboardingMapProps {
  navigate: typeof NavigationService.navigate | ((screen: Screens) => void)
  popToScreen: typeof NavigationService.popToScreen | ((screen: Screens) => void)
  navigateHome: typeof NavigationService.navigateHome | (() => void)
  navigateClearingStack:
    | typeof NavigationService.navigateClearingStack
    | ((screen: Screens) => void)
  dispatch: (action: any) => void
}

/**
 * Traverses through the directed graph of onboarding navigate, navigateClearingStack, and navigateHome calls
 * and count the number of screens until the given screen and the total number
 */
export function getStepValues(screen: Screens) {
  let stepCounter = 0
  let totalCounter = 0
  let reachedScreeen = false
  let currentScreen: Screens = Screens.NameAndPicture

  const navigate = (s: Screens) => {
    totalCounter++
    currentScreen = s
    if (!reachedScreeen) {
      stepCounter++
    }
    if (currentScreen === screen) {
      reachedScreeen = true
    }
  }

  const navigateHome = () => {
    currentScreen = Screens.WalletHome
  }

  const onBoardingMap = _getOnboardingMap({
    navigate,
    popToScreen: () => {
      // no-op
    },
    navigateHome,
    navigateClearingStack: navigate,
    dispatch: () => {
      // no-op
    },
  })

  while (currentScreen !== Screens.WalletHome) {
    onBoardingMap[currentScreen]?.next()
  }
  return {
    totalCounter,
    stepCounter,
  }
}

export function navigateNextOnboarding(screen: Screens) {
  const onBoardingMap = _getOnboardingMap({
    navigate: NavigationService.navigate,
    popToScreen: NavigationService.popToScreen,
    navigateHome: NavigationService.navigateHome,
    navigateClearingStack: NavigationService.navigateClearingStack,
    dispatch: store.dispatch,
  })
  onBoardingMap[screen]?.next()
}

function _getOnboardingMap({
  navigate,
  popToScreen,
  navigateClearingStack,
  navigateHome,
  dispatch,
}: GetOnboardingMapProps) {
  const state = store.getState()
  const recoveringFromStoreWipe = recoveringFromStoreWipeSelector(state)
  const choseToRestoreAccount = choseToRestoreAccountSelector(state)
  const supportedBiometryType = supportedBiometryTypeSelector(state)
  const skipVerification = skipVerificationSelector(state)
  const numberAlreadyVerifiedCentrally = numberVerifiedCentrallySelector(state)

  const onBoardingMap: Partial<{
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
        navigateHome()
      },
    },
  }

  return onBoardingMap
}
