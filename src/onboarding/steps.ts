import { BIOMETRY_TYPE } from 'react-native-keychain'
import { initializeAccount } from 'src/account/actions'
import {
  choseToRestoreAccountSelector,
  recoveringFromStoreWipeSelector,
} from 'src/account/selectors'
import {
  phoneNumberVerifiedSelector,
  skipVerificationSelector,
  supportedBiometryTypeSelector,
} from 'src/app/selectors'
import { setHasSeenVerificationNux } from 'src/identity/actions'
import * as NavigationService from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { updateStatsigAndNavigate } from 'src/onboarding/actions'
import { RootState } from 'src/redux/reducers'
import { store } from 'src/redux/store'
import { getExperimentParams, getFeatureGate } from 'src/statsig'
import { ExperimentConfigs } from 'src/statsig/constants'
import { StatsigExperiments, StatsigFeatureGates } from 'src/statsig/types'

export const END_OF_ONBOARDING_SCREENS = [Screens.WalletHome, Screens.ChooseYourAdventure]

interface NavigatorFunctions {
  navigate: typeof NavigationService.navigate
  popToScreen: typeof NavigationService.popToScreen
  finishOnboarding: (screen: keyof StackParamList) => void
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
  chooseAdventureEnabled: boolean
  onboardingNameScreenEnabled: boolean
  showCloudAccountBackupRestore: boolean
}

/**
 * Helper function to determine where onboarding starts.
 */
export function firstOnboardingScreen({
  onboardingNameScreenEnabled,
  recoveringFromStoreWipe,
}: {
  onboardingNameScreenEnabled: boolean
  recoveringFromStoreWipe: boolean
}): Screens.NameAndPicture | Screens.ImportSelect | Screens.ImportWallet | Screens.PincodeSet {
  if (onboardingNameScreenEnabled) {
    return Screens.NameAndPicture
  } else if (recoveringFromStoreWipe) {
    return getFeatureGate(StatsigFeatureGates.SHOW_CLOUD_ACCOUNT_BACKUP_RESTORE)
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
export function onboardingPropsSelector(state: RootState): OnboardingProps {
  const recoveringFromStoreWipe = recoveringFromStoreWipeSelector(state)
  const choseToRestoreAccount = choseToRestoreAccountSelector(state)
  const supportedBiometryType = supportedBiometryTypeSelector(state)
  const skipVerification = skipVerificationSelector(state)
  const numberAlreadyVerifiedCentrally = phoneNumberVerifiedSelector(state)
  const { chooseAdventureEnabled, onboardingNameScreenEnabled } = getExperimentParams(
    ExperimentConfigs[StatsigExperiments.CHOOSE_YOUR_ADVENTURE]
  )
  const showCloudAccountBackupRestore = getFeatureGate(
    StatsigFeatureGates.SHOW_CLOUD_ACCOUNT_BACKUP_RESTORE
  )

  return {
    recoveringFromStoreWipe,
    choseToRestoreAccount,
    supportedBiometryType,
    skipVerification,
    numberAlreadyVerifiedCentrally,
    chooseAdventureEnabled,
    onboardingNameScreenEnabled,
    showCloudAccountBackupRestore,
  }
}

/**
 * Traverses through the directed graph of onboarding navigate, navigateClearingStack, and navigateHome calls
 * and count the number of screens until the given screen and the total number
 */
export function getOnboardingStepValues(screen: Screens, onboardingProps: OnboardingProps) {
  const firstScreen = firstOnboardingScreen({
    onboardingNameScreenEnabled: onboardingProps.onboardingNameScreenEnabled,
    recoveringFromStoreWipe: onboardingProps.recoveringFromStoreWipe,
  })

  let stepCounter = 1 // will increment this up to the onboarding step the user is on
  let totalCounter = 1
  let reachedStep = false // tracks whether we have reached the step the user is on in onboarding, and we can stop incrementing stepCounter
  let currentScreen: Screens = firstScreen // pointer that we will update when simulating navigation through the onboarding screens to calculate "step" and "totalSteps"

  const nextStepAndCount: typeof NavigationService.navigate = (...args) => {
    // dummy navigation function to help determine what onboarding step the user is on, without triggering side effects like actually cycling them back through the first few onboarding screens
    const [nextScreen] = args
    if (!END_OF_ONBOARDING_SCREENS.includes(nextScreen)) {
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

  const finishOnboarding = (nextScreen: Screens) => {
    currentScreen = nextScreen
  }

  while (!END_OF_ONBOARDING_SCREENS.includes(currentScreen)) {
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
      finishOnboarding: (screen: keyof StackParamList) => {
        store.dispatch(updateStatsigAndNavigate(screen))
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
export function _getStepInfo({ firstScreenInStep, navigator, dispatch, props }: GetStepInfoProps) {
  const { navigate, popToScreen, finishOnboarding } = navigator
  const {
    recoveringFromStoreWipe,
    choseToRestoreAccount,
    supportedBiometryType,
    skipVerification,
    numberAlreadyVerifiedCentrally,
  } = props

  const navigateHomeOrChooseAdventure = () => {
    if (props.chooseAdventureEnabled) {
      finishOnboarding(Screens.ChooseYourAdventure)
    } else {
      finishOnboarding(Screens.WalletHome)
    }
  }

  const navigateImportOrImportSelect = () => {
    if (props.showCloudAccountBackupRestore) {
      navigate(Screens.ImportSelect)
    } else {
      navigate(Screens.ImportWallet)
    }
  }

  switch (firstScreenInStep) {
    case Screens.NameAndPicture:
      return {
        next: () => {
          if (recoveringFromStoreWipe) {
            navigateImportOrImportSelect()
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
            navigateImportOrImportSelect()
          } else {
            dispatch(initializeAccount())
            navigate(Screens.ProtectWallet)
          }
        },
      }
    case Screens.EnableBiometry:
      return {
        next: () => {
          if (choseToRestoreAccount) {
            navigateImportOrImportSelect()
          } else {
            dispatch(initializeAccount())
            navigate(Screens.ProtectWallet)
          }
        },
      }
    case Screens.ImportSelect:
      return {
        next: () => {
          if (skipVerification || numberAlreadyVerifiedCentrally) {
            dispatch(setHasSeenVerificationNux(true))
            // navigateHome will clear onboarding Stack
            navigateHomeOrChooseAdventure()
          } else {
            // DO NOT CLEAR NAVIGATION STACK HERE - breaks restore flow on initial app open in native-stack v6
            navigate(Screens.LinkPhoneNumber)
          }
        },
      }
    case Screens.ImportWallet:
      return {
        next: () => {
          if (skipVerification || numberAlreadyVerifiedCentrally) {
            dispatch(setHasSeenVerificationNux(true))
            // navigateHome will clear onboarding Stack
            navigateHomeOrChooseAdventure()
          } else {
            // DO NOT CLEAR NAVIGATION STACK HERE - breaks restore flow on initial app open in native-stack v6
            navigate(Screens.VerificationStartScreen)
          }
        },
      }
    case Screens.LinkPhoneNumber:
    case Screens.VerificationStartScreen:
      return {
        next: () => {
          // initializeAccount & setHasSeenVerificationNux are called in the middle of
          // the verification flow, so we don't need to call them here.
          navigateHomeOrChooseAdventure()
        },
      }
    case Screens.ProtectWallet:
      return {
        next: () => {
          if (skipVerification) {
            dispatch(setHasSeenVerificationNux(true))
            finishOnboarding(Screens.WalletHome)
          } else {
            navigate(Screens.VerificationStartScreen)
          }
        },
      }
    default:
      throw new Error(
        `No step info found for ${firstScreenInStep}. this step needs to be handled in _getStepInfo`
      )
  }
}
