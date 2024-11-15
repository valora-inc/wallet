// (https://github.com/react-navigation/react-navigation/issues/1439)
import {
  CommonActions,
  createNavigationContainerRef,
  NavigationState,
  StackActions,
} from '@react-navigation/native'
import { createRef, MutableRefObject } from 'react'
import { Platform } from 'react-native'
import { PincodeType } from 'src/account/reducer'
import { pincodeTypeSelector } from 'src/account/selectors'
import { AuthenticationEvents, NavigationEvents, OnboardingEvents } from 'src/analytics/Events'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import {
  CANCELLED_PIN_INPUT,
  getPincodeWithBiometry,
  requestPincodeInput,
} from 'src/pincode/authentication'
import { store } from 'src/redux/store'
import { isUserCancelledError } from 'src/storage/keychain'
import { ensureError } from 'src/utils/ensureError'
import Logger from 'src/utils/Logger'
import { sleep } from 'src/utils/sleep'

const TAG = 'NavigationService'

const NAVIGATOR_INIT_RETRIES = 10

type SafeNavigate = typeof navigate

export const navigationRef = createNavigationContainerRef()
export const navigatorIsReadyRef: MutableRefObject<boolean | null> = createRef()
navigatorIsReadyRef.current = false

async function ensureNavigator() {
  let retries = 0
  while (
    (!navigationRef.current || !navigatorIsReadyRef.current) &&
    retries < NAVIGATOR_INIT_RETRIES
  ) {
    await sleep(200)
    retries++
  }
  if (!navigationRef.current || !navigatorIsReadyRef.current) {
    AppAnalytics.track(NavigationEvents.navigator_not_ready)
    throw new Error('navigator is not initialized')
  }
}

export const popToScreen: SafeNavigate = (...args) => {
  const [routeName] = args
  ensureNavigator()
    .then(() => {
      Logger.debug(`${TAG}@popToScreen`, `Dispatch ${routeName}`)
      while (
        navigationRef.current?.canGoBack() &&
        navigationRef.current?.getCurrentRoute()?.name !== routeName
      ) {
        navigationRef.current?.dispatch(StackActions.pop())
      }
    })
    .catch((reason) => {
      Logger.error(`${TAG}@popToScreen`, 'Navigation failure', reason)
    })
}

export const replace: SafeNavigate = (...args) => {
  const [routeName, params] = args
  ensureNavigator()
    .then(() => {
      Logger.debug(`${TAG}@replace`, `Dispatch ${routeName}`)
      navigationRef.current?.dispatch(StackActions.replace(routeName, params))
    })
    .catch((reason) => {
      Logger.error(`${TAG}@replace`, 'Navigation failure', reason)
    })
}

// for when a screen should be pushed onto stack even if it already exists in it.
export const pushToStack: SafeNavigate = (...args) => {
  const [routeName, params] = args
  ensureNavigator()
    .then(() => {
      Logger.debug(`${TAG}@pushToStack`, `Dispatch ${routeName}`)
      navigationRef.current?.dispatch(StackActions.push(routeName, params))
    })
    .catch((reason) => {
      Logger.error(`${TAG}@pushToStack`, 'Navigation failure', reason)
    })
}

export type NavigateParams<RouteName extends keyof StackParamList> =
  undefined extends StackParamList[RouteName]
    ? [RouteName] | [RouteName, StackParamList[RouteName]]
    : [RouteName, StackParamList[RouteName]]

export function navigate<RouteName extends keyof StackParamList>(
  ...args: NavigateParams<RouteName>
) {
  const [routeName, params] = args
  ensureNavigator()
    .then(() => {
      Logger.debug(`${TAG}@navigate`, `Dispatch ${routeName}`)
      navigationRef.current?.dispatch(
        CommonActions.navigate({
          name: routeName,
          params,
        })
      )
    })
    .catch((reason) => {
      Logger.error(`${TAG}@navigate`, 'Navigation failure', reason)
    })
}

export const navigateClearingStack: SafeNavigate = (...args) => {
  const [routeName, params] = args
  ensureNavigator()
    .then(() => {
      Logger.debug(`${TAG}@navigateClearingStack`, `Dispatch ${routeName}`)

      navigationRef.current?.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: routeName, params }],
        })
      )
    })
    .catch((reason) => {
      Logger.error(`${TAG}@navigateClearingStack`, 'Navigation failure', reason)
    })
}

export async function ensurePincode(): Promise<boolean> {
  AppAnalytics.track(AuthenticationEvents.get_pincode_start)
  const pincodeType = pincodeTypeSelector(store.getState())

  if (pincodeType === PincodeType.Unset) {
    Logger.error(TAG + '@ensurePincode', 'Pin has never been set')
    AppAnalytics.track(OnboardingEvents.pin_never_set)
    return false
  }

  if (pincodeType !== PincodeType.CustomPin && pincodeType !== PincodeType.PhoneAuth) {
    Logger.error(TAG + '@ensurePincode', `Unsupported Pincode Type ${pincodeType}`)
    return false
  }

  if (pincodeType === PincodeType.PhoneAuth) {
    try {
      await getPincodeWithBiometry()
      AppAnalytics.track(AuthenticationEvents.get_pincode_complete)
      return true
    } catch (err) {
      const error = ensureError(err)
      if (!isUserCancelledError(error)) {
        Logger.warn(`${TAG}@ensurePincode`, `Retrieve PIN by biometry error`, error)
      }
      // do not return here, the pincode input is the user's fallback if
      // biometric auth fails
    }
  }

  try {
    await requestPincodeInput(true, false)
    AppAnalytics.track(AuthenticationEvents.get_pincode_complete)
    return true
  } catch (error) {
    if (error === CANCELLED_PIN_INPUT) {
      Logger.warn(`${TAG}@ensurePincode`, `PIN entering cancelled`, error)
    } else {
      Logger.error(`${TAG}@ensurePincode`, `PIN entering error`, error)
    }
    AppAnalytics.track(AuthenticationEvents.get_pincode_error)
    return false
  }
}

export function navigateBack() {
  ensureNavigator()
    .then(() => {
      Logger.debug(`${TAG}@navigateBack`, `Dispatch navigate back`)
      navigationRef.current?.dispatch(CommonActions.goBack())
    })
    .catch((reason) => {
      Logger.error(`${TAG}@navigateBack`, 'Navigation failure', reason)
    })
}

const getActiveRouteState = function (route: NavigationState): NavigationState {
  if (!route.routes || route.routes.length === 0 || route.index >= route.routes.length) {
    // TODO: React Navigation types are hard :(
    // @ts-ignore
    return route.state
  }

  const childActiveRoute = route.routes[route.index] as unknown as NavigationState
  return getActiveRouteState(childActiveRoute)
}

export async function isScreenOnForeground(screen: Screens) {
  await ensureNavigator()
  const state = navigationRef.current?.getRootState()
  if (!state) {
    return false
  }
  const activeRouteState = getActiveRouteState(state)
  // Note: The '?' in the following line shouldn't be necessary, but are there anyways to be defensive
  // because of the ts-ignore on getActiveRouteState.
  return activeRouteState?.routes[activeRouteState?.routes.length - 1]?.name === screen
}

export async function isBottomSheetVisible(screen: Screens) {
  await ensureNavigator()
  const state = navigationRef.current?.getRootState()
  return !!state?.routes.find((route: any) => route.name === screen)
}

/***
 * Navigates to the home screen resetting the navigation stack by default
 * If called from a modal make sure to pass fromModal: true. Otherwise it will cause a null pointer dereference and subsequent app crash
 * TODO: stop using ReactNative modals and switch to react-navigation modals
 */
export function navigateHome(fromModal?: boolean) {
  const timeout = fromModal && Platform.OS === 'ios' ? 500 : 0
  setTimeout(() => {
    navigateClearingStack(Screens.TabNavigator, { initialScreen: Screens.TabHome })
  }, timeout)
}

export function navigateToError(errorMessage: string, error?: Error) {
  Logger.debug(`${TAG}@navigateToError`, `Navigating to error screen: ${errorMessage}`, error)
  navigate(Screens.ErrorScreen, { errorMessage })
}

/**
 * Helper to navigate to home and then to another screen. Used in the CYA
 * screen. This doesn't work for bottom sheet screens.
 */
export function navigateHomeAndThenToScreen<RouteName extends keyof StackParamList>(
  ...args: undefined extends StackParamList[RouteName]
    ? [RouteName] | [RouteName, StackParamList[RouteName]]
    : [RouteName, StackParamList[RouteName]]
) {
  const [routeName, params] = args
  ensureNavigator()
    .then(() => {
      Logger.debug(`${TAG}@navigateHomeAndThenToScreen`, `Dispatch ${routeName}`)

      navigationRef.current?.dispatch(
        CommonActions.reset({
          index: 1,
          routes: [
            { name: Screens.TabNavigator, params: { initialScreen: Screens.TabHome } },
            { name: routeName, params },
          ],
        })
      )
    })
    .catch((reason) => {
      Logger.error(`${TAG}@navigateHomeAndThenToScreen`, 'Navigation failure', reason)
    })
}
