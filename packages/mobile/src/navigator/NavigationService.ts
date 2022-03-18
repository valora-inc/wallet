// (https://github.com/react-navigation/react-navigation/issues/1439)

import { NavigationActions, StackActions } from '@react-navigation/compat'
import { CommonActions, NavigationContainerRef, NavigationState } from '@react-navigation/native'
import { createRef, MutableRefObject } from 'react'
import sleep from 'sleep-promise'
import { PincodeType } from 'src/account/reducer'
import { pincodeTypeSelector } from 'src/account/selectors'
import { AuthenticationEvents, NavigationEvents, OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import {
  CANCELLED_PIN_INPUT,
  getPincodeWithBiometry,
  requestPincodeInput,
} from 'src/pincode/authentication'
import { store } from 'src/redux/store'
import { isUserCancelledError } from 'src/storage/keychain'
import Logger from 'src/utils/Logger'

const TAG = 'NavigationService'

const NAVIGATOR_INIT_RETRIES = 10

type SafeNavigate = typeof navigate

export const navigationRef = createRef<NavigationContainerRef>()
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
    ValoraAnalytics.track(NavigationEvents.navigator_not_ready)
    throw new Error('navigator is not initialized')
  }
}

export const replace: SafeNavigate = (...args) => {
  const [routeName, params] = args
  ensureNavigator()
    .then(() => {
      Logger.debug(`${TAG}@replace`, `Dispatch ${routeName}`)
      navigationRef.current?.dispatch(
        StackActions.replace({
          routeName,
          params,
        })
      )
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
      navigationRef.current?.dispatch(
        StackActions.push({
          routeName,
          params,
        })
      )
    })
    .catch((reason) => {
      Logger.error(`${TAG}@pushToStack`, 'Navigation failure', reason)
    })
}

export function navigate<RouteName extends keyof StackParamList>(
  ...args: undefined extends StackParamList[RouteName]
    ? [RouteName] | [RouteName, StackParamList[RouteName]]
    : [RouteName, StackParamList[RouteName]]
) {
  const [routeName, params] = args
  ensureNavigator()
    .then(() => {
      Logger.debug(`${TAG}@navigate`, `Dispatch ${routeName}`)
      navigationRef.current?.dispatch(
        NavigationActions.navigate({
          routeName,
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
  ValoraAnalytics.track(AuthenticationEvents.get_pincode_start)
  const pincodeType = pincodeTypeSelector(store.getState())

  if (pincodeType === PincodeType.Unset) {
    Logger.error(TAG + '@ensurePincode', 'Pin has never been set')
    ValoraAnalytics.track(OnboardingEvents.pin_never_set)
    return false
  }

  if (pincodeType !== PincodeType.CustomPin && pincodeType !== PincodeType.PhoneAuth) {
    Logger.error(TAG + '@ensurePincode', `Unsupported Pincode Type ${pincodeType}`)
    return false
  }

  if (pincodeType === PincodeType.PhoneAuth) {
    try {
      await getPincodeWithBiometry()
      ValoraAnalytics.track(AuthenticationEvents.get_pincode_complete)
      return true
    } catch (error) {
      if (!isUserCancelledError(error)) {
        Logger.warn(`${TAG}@ensurePincode`, `Retrieve PIN by biometry error`, error)
      }
      // do not return here, the pincode input is the user's fallback if
      // biometric auth fails
    }
  }

  try {
    await requestPincodeInput(true, false)
    ValoraAnalytics.track(AuthenticationEvents.get_pincode_complete)
    return true
  } catch (error) {
    if (error === CANCELLED_PIN_INPUT) {
      Logger.warn(`${TAG}@ensurePincode`, `PIN entering cancelled`, error)
    } else {
      Logger.error(`${TAG}@ensurePincode`, `PIN entering error`, error)
    }
    ValoraAnalytics.track(AuthenticationEvents.get_pincode_error)
    return false
  }
}

export function navigateToExchangeHome() {
  if (store.getState().goldToken.educationCompleted) {
    navigate(Screens.ExchangeHomeScreen)
  } else {
    navigate(Screens.GoldEducation)
  }
}

export function navigateBack(params?: object) {
  ensureNavigator()
    .then(() => {
      Logger.debug(`${TAG}@navigateBack`, `Dispatch navigate back`)
      // @ts-ignore
      navigationRef.current?.dispatch(NavigationActions.back(params))
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

  const childActiveRoute = (route.routes[route.index] as unknown) as NavigationState
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

interface NavigateHomeOptions {
  params?: StackParamList[Screens.DrawerNavigator]
}

export function navigateHome(options?: NavigateHomeOptions) {
  const { params } = options ?? {}
  navigationRef.current?.reset({
    index: 0,
    routes: [{ name: Screens.DrawerNavigator, params }],
  })
}

export function navigateToError(errorMessage: string, error?: Error) {
  Logger.debug(`${TAG}@navigateToError`, `Navigating to error screen: ${errorMessage}`, error)
  navigate(Screens.ErrorScreen, { errorMessage })
}
