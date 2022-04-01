import AsyncStorage from '@react-native-async-storage/async-storage'
import { DefaultTheme, NavigationContainer, NavigationState } from '@react-navigation/native'
import * as Sentry from '@sentry/react-native'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Share, StyleSheet, View } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { useDispatch, useSelector } from 'react-redux'
import ShakeForSupport from 'src/account/ShakeForSupport'
import AlertBanner from 'src/alert/AlertBanner'
import { InviteEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { activeScreenChanged } from 'src/app/actions'
import { getAppLocked } from 'src/app/selectors'
import UpgradeScreen from 'src/app/UpgradeScreen'
import { doingBackupFlowSelector, shouldForceBackupSelector } from 'src/backup/selectors'
import { DEV_RESTORE_NAV_STATE_ON_RELOAD, DYNAMIC_DOWNLOAD_LINK } from 'src/config'
import InviteFriendModal from 'src/invite/InviteFriendModal'
import { navigate, navigationRef, navigatorIsReadyRef } from 'src/navigator/NavigationService'
import Navigator from 'src/navigator/Navigator'
import { Screens } from 'src/navigator/Screens'
import PincodeLock from 'src/pincode/PincodeLock'
import useTypedSelector from 'src/redux/useSelector'
import { sentryRoutingInstrumentation } from 'src/sentry/Sentry'
import colors from 'src/styles/colors'
import Logger from 'src/utils/Logger'
import { isVersionBelowMinimum } from 'src/utils/versionCheck'

// This uses RN Navigation's experimental nav state persistence
// to improve the hot reloading experience when in DEV mode
// https://reactnavigation.org/docs/en/state-persistence.html
const PERSISTENCE_KEY = 'NAVIGATION_STATE'

// @ts-ignore https://reactnavigation.org/docs/screen-tracking/
export const getActiveRouteName = (state: NavigationState) => {
  const route = state.routes[state.index]

  if (route.state) {
    // @ts-ignore Dive into nested navigators
    return getActiveRouteName(route.state)
  }

  return route.name
}

const RESTORE_STATE = __DEV__ && DEV_RESTORE_NAV_STATE_ON_RELOAD

// Global app them used by react-navigation
const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.light,
  },
}

export const NavigatorWrapper = () => {
  const { t } = useTranslation()
  const [isReady, setIsReady] = React.useState(RESTORE_STATE ? false : true)
  const [initialState, setInitialState] = React.useState()
  const appLocked = useTypedSelector(getAppLocked)
  const minRequiredVersion = useTypedSelector((state) => state.app.minVersion)
  const isInviteModalVisible = useTypedSelector((state) => state.app.inviteModalVisible)
  const routeNameRef = React.useRef()

  const dispatch = useDispatch()

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

  const shouldForceBackup = useSelector(shouldForceBackupSelector)
  const doingBackupFlow = useSelector(doingBackupFlowSelector)

  React.useEffect(() => {
    if (shouldForceBackup && !doingBackupFlow) {
      navigate(Screens.BackupForceScreen)
    }
  }, [shouldForceBackup, doingBackupFlow])

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
      // The line below uses the @react-native-firebase/analytics tracker
      // Change this line to use another Mobile analytics SDK
      ValoraAnalytics.page(currentRouteName, {
        previousScreen: previousRouteName,
        currentScreen: currentRouteName,
      })
      dispatch(activeScreenChanged(currentRouteName))
      Sentry.addBreadcrumb({
        category: 'navigation',
        message: `Navigated to ${currentRouteName}`,
        level: Sentry.Severity.Info,
      })
    }

    // Save the current route name for later comparision
    routeNameRef.current = currentRouteName
  }

  const onInvite = async () => {
    const message = t('inviteWithoutPayment', {
      link: DYNAMIC_DOWNLOAD_LINK,
    })
    ValoraAnalytics.track(InviteEvents.invite_from_menu)
    await Share.share({ message })
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
      theme={AppTheme}
    >
      <View style={styles.container}>
        <Navigator />
        {(appLocked || updateRequired) && (
          <View style={styles.locked}>{updateRequired ? <UpgradeScreen /> : <PincodeLock />}</View>
        )}
        <View style={styles.floating}>
          <AlertBanner />
          <InviteFriendModal isVisible={isInviteModalVisible} onInvite={onInvite} />
        </View>
        <ShakeForSupport />
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
  floating: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
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
