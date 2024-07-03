import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFlipper } from '@react-navigation/devtools'
import { NavigationContainer, NavigationState } from '@react-navigation/native'
import * as Sentry from '@sentry/react-native'
import { SeverityLevel } from '@sentry/types'
import * as React from 'react'
import { StyleSheet, View } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import ShakeForSupport from 'src/account/ShakeForSupport'
import AlertBanner from 'src/alert/AlertBanner'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import UpgradeScreen from 'src/app/UpgradeScreen'
import { activeScreenChanged } from 'src/app/actions'
import { getAppLocked } from 'src/app/selectors'
import { useDeepLinks } from 'src/app/useDeepLinks'
import { DEV_RESTORE_NAV_STATE_ON_RELOAD } from 'src/config'
import JumpstartClaimStatusToasts from 'src/jumpstart/JumpstartClaimStatusToasts'
import {
  navigateClearingStack,
  navigationRef,
  navigatorIsReadyRef,
} from 'src/navigator/NavigationService'
import Navigator from 'src/navigator/Navigator'
import { Screens } from 'src/navigator/Screens'
import PincodeLock from 'src/pincode/PincodeLock'
import HooksPreviewModeBanner from 'src/positions/HooksPreviewModeBanner'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { sentryRoutingInstrumentation } from 'src/sentry/Sentry'
import appTheme from 'src/styles/appTheme'
import Logger from 'src/utils/Logger'
import { userInSanctionedCountrySelector } from 'src/utils/countryFeatures'
import { isVersionBelowMinimum } from 'src/utils/versionCheck'

// This uses RN Navigation's experimental nav state persistence
// to improve the hot reloading experience when in DEV mode
// https://reactnavigation.org/docs/en/state-persistence.html
const PERSISTENCE_KEY = 'NAVIGATION_STATE'

// @ts-ignore https://reactnavigation.org/docs/screen-tracking/
const getActiveRouteName = (state: NavigationState) => {
  const route = state.routes[state.index]

  if (route.state) {
    // @ts-ignore Dive into nested navigators
    return getActiveRouteName(route.state)
  }

  return route.name
}

const RESTORE_STATE = __DEV__ && DEV_RESTORE_NAV_STATE_ON_RELOAD

export const NavigatorWrapper = () => {
  const [isReady, setIsReady] = React.useState(RESTORE_STATE ? false : true)
  const [initialState, setInitialState] = React.useState()
  const appLocked = useSelector(getAppLocked)
  const minRequiredVersion = useSelector((state) => state.app.minVersion)
  const routeNameRef = React.useRef()
  const inSanctionedCountry = useSelector(userInSanctionedCountrySelector)

  const dispatch = useDispatch()

  useFlipper(navigationRef)
  useDeepLinks()

  const updateRequired = React.useMemo(() => {
    if (!minRequiredVersion) {
      return false
    }
    const version = DeviceInfo.getVersion()
    Logger.info(
      'NavigatorWrapper',
      `Current version: ${version}. Required min version: ${minRequiredVersion}`
    )
    return isVersionBelowMinimum(version, minRequiredVersion)
  }, [minRequiredVersion])

  React.useEffect(() => {
    if (inSanctionedCountry) {
      navigateClearingStack(Screens.SanctionedCountryErrorScreen)
    }
  }, [inSanctionedCountry])

  React.useEffect(() => {
    if (navigationRef && navigationRef.current) {
      const state = navigationRef.current.getRootState()

      if (state) {
        // Save the initial route name
        routeNameRef.current = getActiveRouteName(state)
      }
    }
  }, [])

  React.useEffect(() => {
    const restoreState = async () => {
      const savedStateString = await AsyncStorage.getItem(PERSISTENCE_KEY)
      if (savedStateString) {
        try {
          const state = JSON.parse(savedStateString)

          setInitialState(state)
        } catch (e) {
          Logger.error('NavigatorWrapper', 'Error getting nav state', e)
        }
      }
      setIsReady(true)
    }

    if (!isReady) {
      restoreState().catch((error) =>
        Logger.error('NavigatorWrapper', 'Error persisting nav state', error)
      )
    }
  }, [isReady])

  React.useEffect(() => {
    return () => {
      navigatorIsReadyRef.current = false
    }
  }, [])

  if (!isReady) {
    return null
  }

  const handleStateChange = (state: NavigationState | undefined) => {
    if (state === undefined) {
      return
    }

    if (RESTORE_STATE) {
      AsyncStorage.setItem(PERSISTENCE_KEY, JSON.stringify(state)).catch((error) =>
        Logger.error('NavigatorWrapper', 'Error persisting nav state', error)
      )
    }

    const previousRouteName = routeNameRef.current
    const currentRouteName = getActiveRouteName(state)

    if (previousRouteName !== currentRouteName) {
      ValoraAnalytics.page(currentRouteName, {
        previousScreen: previousRouteName,
        currentScreen: currentRouteName,
      })
      dispatch(activeScreenChanged(currentRouteName))
      Sentry.addBreadcrumb({
        category: 'navigation',
        message: `Navigated to ${currentRouteName}`,
        level: 'info' as SeverityLevel,
      })
    }

    // Save the current route name for later comparision
    routeNameRef.current = currentRouteName
  }

  const onReady = () => {
    navigatorIsReadyRef.current = true
    sentryRoutingInstrumentation.registerNavigationContainer(navigationRef)
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={onReady}
      onStateChange={handleStateChange}
      initialState={initialState}
      theme={appTheme}
    >
      <View style={styles.container}>
        <Navigator />
        <HooksPreviewModeBanner />
        {(appLocked || updateRequired) && (
          <View style={styles.locked}>{updateRequired ? <UpgradeScreen /> : <PincodeLock />}</View>
        )}
        <AlertBanner />
        <ShakeForSupport />
        <JumpstartClaimStatusToasts />
      </View>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  locked: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
})

export const navbarStyle: {
  headerMode: 'none'
} = {
  headerMode: 'none',
}

export const headerArea = {
  navigationOptions: {
    headerStyle: {
      elevation: 0,
    },
  },
}

export default NavigatorWrapper
