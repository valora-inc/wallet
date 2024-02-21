import firebase, { ReactNativeFirebase } from '@react-native-firebase/app'
import '@react-native-firebase/auth'
import '@react-native-firebase/database'
import { FirebaseDatabaseTypes } from '@react-native-firebase/database'
import '@react-native-firebase/messaging'
// We can't combine the 2 imports otherwise it only imports the type and fails at runtime
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging'
import remoteConfig, { FirebaseRemoteConfigTypes } from '@react-native-firebase/remote-config'
import CleverTap from 'clevertap-react-native'
import { PermissionsAndroid, PermissionStatus, Platform } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { eventChannel } from 'redux-saga'
import { handleUpdateAccountRegistration } from 'src/account/saga'
import { updateAccountRegistration } from 'src/account/updateAccountRegistration'
import { AppEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { pushNotificationsPermissionChanged } from 'src/app/actions'
import { RemoteConfigValues } from 'src/app/saga'
import {
  pushNotificationRequestedUnixTimeSelector,
  pushNotificationsEnabledSelector,
} from 'src/app/selectors'
import { DEFAULT_PERSONA_TEMPLATE_ID, FETCH_TIMEOUT_DURATION, FIREBASE_ENABLED } from 'src/config'
import { Actions } from 'src/firebase/actions'
import { handleNotification } from 'src/firebase/notifications'
import { REMOTE_CONFIG_VALUES_DEFAULTS } from 'src/firebase/remoteConfigValuesDefaults'
import { Actions as HomeActions } from 'src/home/actions'
import { NotificationReceiveState } from 'src/notifications/types'
import { retrieveSignedMessage } from 'src/pincode/authentication'
import Logger from 'src/utils/Logger'
import { Awaited } from 'src/utils/typescript'
import { call, put, select, take } from 'typed-redux-saga'

const TAG = 'firebase/firebase'

interface NotificationChannelEvent {
  message: FirebaseMessagingTypes.RemoteMessage
  stateType: NotificationReceiveState
}

export function* watchFirebaseNotificationChannel() {
  if (!FIREBASE_ENABLED) {
    return
  }

  try {
    const channel = createFirebaseNotificationChannel()

    Logger.debug(`${TAG}/watchFirebaseNotificationChannel`, 'Started channel watching')

    while (true) {
      const event = (yield* take(channel)) as NotificationChannelEvent
      if (!event) {
        Logger.debug(`${TAG}/watchFirebaseNotificationChannel`, 'Data in channel was empty')
        continue
      }
      Logger.debug(
        `${TAG}/watchFirebaseNotificationChannel`,
        'Notification received in the channel'
      )
      yield* call(handleNotification, event.message, event.stateType)
    }
  } catch (error) {
    Logger.error(
      `${TAG}/watchFirebaseNotificationChannel`,
      'Error proccesing notification channel event',
      error
    )
  } finally {
    Logger.debug(`${TAG}/watchFirebaseNotificationChannel`, 'Notification channel terminated')
  }
}

export function* checkInitialNotification() {
  if (!FIREBASE_ENABLED) {
    return
  }

  // We need this initial check because the app could be in the killed state
  // or in the background when the push notification arrives

  // Manual type checking because yield calls can't infer return type yet :'(
  const initialNotification: Awaited<
    ReturnType<FirebaseMessagingTypes.Module['getInitialNotification']>
  > = yield* call([firebase.messaging(), 'getInitialNotification'])
  if (initialNotification) {
    Logger.info(TAG, 'App opened fresh via a notification', initialNotification)
    yield* call(handleNotification, initialNotification, NotificationReceiveState.AppColdStart)
  }
}

export const initializeAuth = async (app: ReactNativeFirebase.Module, address: string) => {
  Logger.info(TAG, 'Initializing Firebase auth')
  const user = await app.auth().signInAnonymously()
  if (!user) {
    throw new Error('No Firebase user specified')
  }

  const userRef = app.database().ref('users')
  // Save some user data in DB if it's not there yet
  await userRef.child(user.user.uid).transaction((userData: { address?: string }) => {
    if (userData == null) {
      return { address }
    } else if (userData.address !== undefined && userData.address !== address) {
      // This shouldn't happen! If this is thrown it means the firebase user is reused
      // with different addresses (which we don't want) or the db was incorrectly changed remotely!
      Logger.debug("User address in the db doesn't match persisted address - updating address")
      return {
        address,
      }
    }
  })
  Logger.info(TAG, 'Firebase Auth initialized successfully')
}

export const firebaseSignOut = async (app: ReactNativeFirebase.FirebaseApp) => {
  await app.auth().signOut()
}

function createFirebaseNotificationChannel() {
  return eventChannel((emitter) => {
    const unsubscribe = () => {
      Logger.info(TAG, 'Notification channel closed, resetting callbacks.')
      firebase.messaging().onMessage(() => null)
      firebase.messaging().onNotificationOpenedApp(() => null)
    }

    firebase.messaging().onMessage((message) => {
      Logger.info(TAG, 'Notification received while open')
      emitter({
        message,
        stateType: NotificationReceiveState.AppAlreadyOpen,
      })
    })

    firebase.messaging().onNotificationOpenedApp((message) => {
      Logger.info(TAG, 'App opened via a notification')
      emitter({
        message,
        stateType: NotificationReceiveState.AppOpenedFromBackground,
      })
    })
    return unsubscribe
  })
}

const actionSeen: Record<string, boolean> = {}

export function* takeWithInMemoryCache(action: Actions | HomeActions) {
  if (actionSeen[action]) {
    return
  }
  yield* take(action)
  actionSeen[action] = true
  return
}

export function* initializeCloudMessaging(app: ReactNativeFirebase.Module, address: string) {
  Logger.info(TAG, 'Initializing Firebase Cloud Messaging')

  // permissions are denied by default on Android API level 33+, so we track
  // whether we should prompt the user for permission manually through redux
  // instead of relying on firebase messaging's `hasPermission` method
  const pushNotificationRequestedUnixTime = yield* select(pushNotificationRequestedUnixTimeSelector)
  const lastKnownEnabledState = yield* select(pushNotificationsEnabledSelector)

  if (pushNotificationRequestedUnixTime === null && !lastKnownEnabledState) {
    yield takeWithInMemoryCache(HomeActions.VISIT_HOME) // better than take(HomeActions.VISIT_HOME) because if failure occurs, retries can succeed without an additional visit home

    Logger.info(TAG, 'requesting permission')
    try {
      let permissionGranted = false
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const permissionStatus: PermissionStatus = yield* call(
          [PermissionsAndroid, 'request'],
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        )
        permissionGranted = permissionStatus === 'granted'
      } else {
        const permissionStatus = yield* call([app.messaging(), 'requestPermission'])
        permissionGranted = permissionStatus === firebase.messaging.AuthorizationStatus.AUTHORIZED
      }

      ValoraAnalytics.track(AppEvents.push_notifications_permission_changed, {
        enabled: permissionGranted,
      })
      yield* put(pushNotificationsPermissionChanged(permissionGranted, true))
    } catch (error) {
      Logger.warn(TAG, 'Failed to request permission from the user', error)
      throw error
    }
  } else {
    // this call needs to include context: https://github.com/redux-saga/redux-saga/issues/27
    // Manual type checking because yield calls can't infer return type yet :'(
    const authStatus: Awaited<ReturnType<FirebaseMessagingTypes.Module['hasPermission']>> =
      yield* call([app.messaging(), 'hasPermission'])

    const pushNotificationsEnabled = authStatus !== firebase.messaging.AuthorizationStatus.DENIED

    if (lastKnownEnabledState !== pushNotificationsEnabled) {
      ValoraAnalytics.track(AppEvents.push_notifications_permission_changed, {
        enabled: pushNotificationsEnabled,
      })
      yield* put(pushNotificationsPermissionChanged(pushNotificationsEnabled, false))
    }
  }
  let fcmToken
  const isEmulator = yield* call([DeviceInfo, 'isEmulator'])
  // Emulators can't handle fcm tokens and calling getToken on them will throw an error
  if (!isEmulator) {
    yield* call([CleverTap, 'registerForPush'])
    fcmToken = yield* call([app.messaging(), 'getToken'])
  }
  if (fcmToken) {
    yield* call(handleUpdateAccountRegistration)

    if (Platform.OS === 'android') {
      // @ts-ignore FCM constant missing from types
      yield* call([CleverTap, 'setPushToken'], fcmToken, CleverTap.FCM)
    }
  }

  CleverTap.createNotificationChannel('CleverTapChannelId', 'CleverTap', 'default channel', 5, true)

  app.messaging().onTokenRefresh(async (fcmToken) => {
    Logger.info(TAG, 'Cloud Messaging token refreshed')

    try {
      const signedMessage = await retrieveSignedMessage()
      if (signedMessage) {
        await updateAccountRegistration(address, signedMessage, { fcmToken })
      }
    } catch (error) {
      Logger.error(
        `${TAG}@initializeCloudMessaging`,
        'Unable to update cloud messaging token',
        error
      )
    }

    if (Platform.OS === 'android') {
      // @ts-ignore FCM constant missing from types
      CleverTap.setPushToken(fcmToken, CleverTap.FCM)
    }
  })
}

const VALUE_CHANGE_HOOK = 'value'

/*
Get the Version deprecation information.
Firebase DB Format:
  (New) Add minVersion child to versions category with a string of the mininum version as string
*/
export function appVersionDeprecationChannel() {
  if (!FIREBASE_ENABLED) {
    return null
  }

  const errorCallback = (error: Error) => {
    Logger.warn(TAG, error.toString())
  }

  return eventChannel<string>((emit: any) => {
    const emitter = (snapshot: FirebaseDatabaseTypes.DataSnapshot) => {
      const minVersion = snapshot.val().minVersion
      emit(minVersion)
    }

    const onValueChange = firebase
      .database()
      .ref('versions')
      .on(VALUE_CHANGE_HOOK, emitter, errorCallback)

    const cancel = () => {
      firebase.database().ref('versions').off(VALUE_CHANGE_HOOK, onValueChange)
    }

    return cancel
  })
}

/*
We use firebase remote config to manage feature flags.
https://firebase.google.com/docs/remote-config

This also allows us to run AB tests.
https://firebase.google.com/docs/ab-testing/abtest-config
*/
export async function fetchRemoteConfigValues(): Promise<RemoteConfigValues | null> {
  if (!FIREBASE_ENABLED) {
    return null
  }

  await remoteConfig().setDefaults(REMOTE_CONFIG_VALUES_DEFAULTS)
  // Don't cache values so we fetch the latest every time. https://rnfirebase.io/remote-config/usage
  await remoteConfig().setConfigSettings({ minimumFetchIntervalMillis: 0 })
  await remoteConfig().fetchAndActivate()

  const flags: FirebaseRemoteConfigTypes.ConfigValues = remoteConfig().getAll()
  Logger.debug(TAG, `Updated remote config values:`, flags)

  // When adding a new remote config value there are 2 places that need updating:
  // the RemoteConfigValues interface as well as the REMOTE_CONFIG_VALUES_DEFAULTS map
  // REMOTE_CONFIG_VALUES_DEFAULTS is in remoteConfigValuesDefaults.ts
  // RemoteConfigValues is in app/saga.ts

  const superchargeConfigByTokenString = flags.superchargeTokenConfigByToken?.asString()
  const fiatAccountSchemaCountryOverrides = flags.fiatAccountSchemaCountryOverrides?.asString()
  const celoNewsString = flags.celoNews?.asString()

  return {
    // these next 2 flags are a bit weird because their default is undefined or null
    // and the default map cannot have a value of undefined or null
    // that is why we still need to check for it before calling a method
    // in the future it would be great to avoid using these as default values
    celoEducationUri: flags.celoEducationUri?.asString() ?? null,
    dappListApiUrl: flags.dappListApiUrl?.asString() ?? null,
    inviteRewardsVersion: flags.inviteRewardsVersion.asString(),
    walletConnectV2Enabled: flags.walletConnectV2Enabled.asBoolean(),
    superchargeApy: flags.superchargeApy.asNumber(),
    superchargeTokenConfigByToken: superchargeConfigByTokenString
      ? JSON.parse(superchargeConfigByTokenString)
      : {},
    pincodeUseExpandedBlocklist: flags.pincodeUseExpandedBlocklist.asBoolean(),
    rampCashInButtonExpEnabled: flags.rampCashInButtonExpEnabled.asBoolean(),
    logPhoneNumberTypeEnabled: flags.logPhoneNumberTypeEnabled.asBoolean(),
    allowOtaTranslations: flags.allowOtaTranslations.asBoolean(),
    sentryTracesSampleRate: flags.sentryTracesSampleRate.asNumber(),
    sentryNetworkErrors: flags.sentryNetworkErrors.asString().split(','),
    maxNumRecentDapps: flags.maxNumRecentDapps.asNumber(),
    skipVerification: flags.skipVerification.asBoolean(),
    showPriceChangeIndicatorInBalances: flags.showPriceChangeIndicatorInBalances.asBoolean(),
    dappsWebViewEnabled: flags.dappsWebViewEnabled.asBoolean(),
    fiatConnectCashInEnabled: flags.fiatConnectCashInEnabled.asBoolean(),
    fiatConnectCashOutEnabled: flags.fiatConnectCashOutEnabled.asBoolean(),
    fiatAccountSchemaCountryOverrides: fiatAccountSchemaCountryOverrides
      ? JSON.parse(fiatAccountSchemaCountryOverrides)
      : {},
    visualizeNFTsEnabledInHomeAssetsPage: flags.visualizeNFTsEnabledInHomeAssetsPage.asBoolean(),
    coinbasePayEnabled: flags.coinbasePayEnabled.asBoolean(),
    showSwapMenuInDrawerMenu: flags.showSwapMenuInDrawerMenu.asBoolean(),
    maxSwapSlippagePercentage: flags.maxSwapSlippagePercentage.asNumber(),
    networkTimeoutSeconds: flags.networkTimeoutSeconds.asNumber(),
    celoNews: celoNewsString ? JSON.parse(celoNewsString) : {},
    twelveWordMnemonicEnabled: flags.twelveWordMnemonicEnabled.asBoolean(),
    // Convert to percentage, so we're consistent with the price impact value returned by our swap API
    priceImpactWarningThreshold: flags.priceImpactWarningThreshold.asNumber() * 100,
    superchargeRewardContractAddress: flags.superchargeRewardContractAddress.asString(),
  }
}

export async function knownAddressesChannel() {
  return simpleReadChannel('addressesExtraInfo')
}

export async function notificationsChannel() {
  return simpleReadChannel('notificationsV2')
}

export async function fetchRewardsSenders() {
  return fetchListFromFirebase('rewardsSenders')
}

export async function fetchInviteRewardsSenders() {
  return fetchListFromFirebase('inviteRewardAddresses')
}

export async function fetchCoinbasePaySenders() {
  return fetchListFromFirebase('coinbasePayAddresses')
}

async function fetchListFromFirebase(path: string) {
  if (!FIREBASE_ENABLED) {
    return null
  }
  return eventChannel((emit: any) => {
    const onValueChange = firebase
      .database()
      .ref(path)
      .on(
        VALUE_CHANGE_HOOK,
        (snapshot) => {
          emit(snapshot.val() ?? [])
        },
        (error: Error) => {
          Logger.warn(TAG, error.toString())
        }
      )

    return () => firebase.database().ref(path).off(VALUE_CHANGE_HOOK, onValueChange)
  })
}

export function simpleReadChannel(key: string) {
  if (!FIREBASE_ENABLED) {
    return null
  }

  const errorCallback = (error: Error) => {
    Logger.warn(TAG, error.toString())
  }

  return eventChannel((emit: any) => {
    const emitter = (snapshot: FirebaseDatabaseTypes.DataSnapshot) => {
      const value = snapshot.val()
      Logger.debug(`Got value from Firebase for key ${key}:`, value)
      emit(value || {})
    }

    const onValueChange = firebase.database().ref(key).on(VALUE_CHANGE_HOOK, emitter, errorCallback)

    const cancel = () => {
      firebase.database().ref(key).off(VALUE_CHANGE_HOOK, onValueChange)
    }

    return cancel
  })
}

export async function readOnceFromFirebase(path: string) {
  const timeout = new Promise<void>((_, reject) =>
    setTimeout(
      () => reject(Error(`Reading from Firebase @ ${path} timed out.`)),
      FETCH_TIMEOUT_DURATION
    )
  )
  const fetchFromFirebase = firebase
    .database()
    .ref(path)
    .once('value')
    .then((snapshot) => snapshot.val())
  return Promise.race([timeout, fetchFromFirebase])
}

export async function getPersonaTemplateId() {
  if (!FIREBASE_ENABLED) {
    return DEFAULT_PERSONA_TEMPLATE_ID
  }

  return readOnceFromFirebase('persona/templateId')
}
