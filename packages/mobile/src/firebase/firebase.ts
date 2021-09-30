import firebase, { ReactNativeFirebase } from '@react-native-firebase/app'
import '@react-native-firebase/auth'
import { FirebaseDatabaseTypes } from '@react-native-firebase/database'
import '@react-native-firebase/messaging'
// We can't combine the 2 imports otherwise it only imports the type and fails at runtime
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging'
import remoteConfig, { FirebaseRemoteConfigTypes } from '@react-native-firebase/remote-config'
import CleverTap from 'clevertap-react-native'
import { Platform } from 'react-native'
import { eventChannel } from 'redux-saga'
import { call, select, take } from 'redux-saga/effects'
import { currentLanguageSelector } from 'src/app/reducers'
import { RemoteFeatureFlags } from 'src/app/saga'
import { FIREBASE_ENABLED } from 'src/config'
import { FEATURE_FLAG_DEFAULTS } from 'src/firebase/featureFlagDefaults'
import { handleNotification } from 'src/firebase/notifications'
import { NotificationReceiveState } from 'src/notifications/types'
import Logger from 'src/utils/Logger'
import { Awaited } from 'src/utils/typescript'

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
      const event: NotificationChannelEvent = yield take(channel)
      if (!event) {
        Logger.debug(`${TAG}/watchFirebaseNotificationChannel`, 'Data in channel was empty')
        continue
      }
      Logger.debug(
        `${TAG}/watchFirebaseNotificationChannel`,
        'Notification received in the channel'
      )
      yield call(handleNotification, event.message, event.stateType)
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
  > = yield call([firebase.messaging(), 'getInitialNotification'])
  if (initialNotification) {
    Logger.info(TAG, 'App opened fresh via a notification', JSON.stringify(initialNotification))
    yield call(handleNotification, initialNotification, NotificationReceiveState.AppColdStart)
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

export function* initializeCloudMessaging(app: ReactNativeFirebase.Module, address: string) {
  Logger.info(TAG, 'Initializing Firebase Cloud Messaging')

  // this call needs to include context: https://github.com/redux-saga/redux-saga/issues/27
  // Manual type checking because yield calls can't infer return type yet :'(
  const authStatus: Awaited<
    ReturnType<FirebaseMessagingTypes.Module['hasPermission']>
  > = yield call([app.messaging(), 'hasPermission'])
  Logger.info(TAG, 'Current messaging authorization status', authStatus.toString())
  if (authStatus === firebase.messaging.AuthorizationStatus.NOT_DETERMINED) {
    try {
      yield call([app.messaging(), 'requestPermission'])
    } catch (error) {
      Logger.error(TAG, 'User has rejected messaging permissions', error)
      throw error
    }
  }

  // `registerDeviceForRemoteMessages` must be called before calling `getToken`
  // Note: `registerDeviceForRemoteMessages` is really only required for iOS and is a no-op on Android
  yield call([app.messaging(), 'registerDeviceForRemoteMessages'])
  if (Platform.OS === 'android') {
    const fcmToken = yield call([app.messaging(), 'getToken'])
    if (fcmToken) {
      yield call(registerTokenToDb, app, address, fcmToken)
      // @ts-ignore FCM constant missing from types
      yield call([CleverTap, 'setPushToken'], fcmToken, CleverTap.FCM)
    }
    // First time setting the fcmToken also set the language selection
    const language = yield select(currentLanguageSelector)
    yield call(setUserLanguage, address, language)
  } else {
    const apnsToken = yield call([firebase.messaging(), 'getAPNSToken'])
    if (apnsToken) {
      CleverTap.setPushToken(apnsToken, 'APNS')
    }
  }

  CleverTap.createNotificationChannel('CleverTapChannelId', 'CleverTap', 'default channel', 5, true)

  app.messaging().onTokenRefresh(async (token) => {
    Logger.info(TAG, 'Cloud Messaging token refreshed')
    await registerTokenToDb(app, address, token)
    if (Platform.OS === 'android') {
      // @ts-ignore FCM constant missing from types
      CleverTap.setPushToken(token, CleverTap.FCM)
    }
  })
}

export const registerTokenToDb = async (
  app: ReactNativeFirebase.Module,
  address: string,
  fcmToken: string
) => {
  try {
    Logger.info(TAG, 'Registering Firebase client FCM token')
    const regRef = app.database().ref('registrations')
    // TODO(Rossy) add support for multiple tokens per address
    await regRef.child(address).update({ fcmToken })
    Logger.info(TAG, 'Firebase FCM token registered successfully', fcmToken)
  } catch (error) {
    Logger.error(TAG, 'Failed to register Firebase FCM token', error)
    throw error
  }
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

  return eventChannel((emit: any) => {
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
export async function fetchRemoteFeatureFlags(): Promise<RemoteFeatureFlags | null> {
  if (!FIREBASE_ENABLED) {
    return null
  }

  await remoteConfig().setDefaults(FEATURE_FLAG_DEFAULTS)
  // Cache values for 1 hour. The default is 12 hours.
  // https://rnfirebase.io/remote-config/usage
  await remoteConfig().setConfigSettings({ minimumFetchIntervalMillis: 60 * 60 * 1000 })
  const fetchedRemotely = await remoteConfig().fetchAndActivate()

  if (fetchedRemotely) {
    const flags: FirebaseRemoteConfigTypes.ConfigValues = remoteConfig().getAll()
    Logger.debug(TAG, `Updated feature flags: ${JSON.stringify(flags)}`)

    // When adding a new feature flag there are 2 places that need updating:
    // the RemoteFeatureFlags interface as well as the FEATURE_FLAG_DEFAULTS map
    // FEATURE_FLAG_DEFAULTS is in featureFlagDefaults.ts
    // RemoteFeatureFlags is in app/saga.ts

    return {
      hideVerification: flags.hideVerification.asBoolean(),
      // these next 2 flags are a bit weird because their default is undefined or null
      // and the default map cannot have a value of undefined or null
      // that is why we still need to check for it before calling a method
      // in the future it would be great to avoid using these as default values
      showRaiseDailyLimitTarget: flags.showRaiseDailyLimitTargetV2?.asString(),
      celoEducationUri: flags.celoEducationUri?.asString() ?? null,
      celoEuroEnabled: flags.celoEuroEnabled.asBoolean(),
      shortVerificationCodesEnabled: flags.shortVerificationCodesEnabled.asBoolean(),
      inviteRewardsEnabled: flags.inviteRewardsEnabled.asBoolean(),
      inviteRewardCusd: flags.inviteRewardCusd.asNumber(),
      inviteRewardWeeklyLimit: flags.inviteRewardWeeklyLimit.asNumber(),
      walletConnectEnabled: flags.walletConnectEnabled.asBoolean(),
      rewardsABTestThreshold: flags.rewardsABTestThreshold.asString(),
      rewardsPercent: flags.rewardsPercent.asNumber(),
      rewardsStartDate: flags.rewardsStartDate.asNumber(),
      rewardsMax: flags.rewardsMax.asNumber(),
      rewardsMin: flags.rewardsMin.asNumber(),
      komenciUseLightProxy: flags.komenciUseLightProxy.asBoolean(),
      komenciAllowedDeployers: flags.komenciAllowedDeployers.asString().split(','),
      pincodeUseExpandedBlocklist: flags.pincodeUseExpandedBlocklist.asBoolean(),
      rewardPillText: flags.rewardPillText.asString(),
    }
  } else {
    Logger.debug('No new configs were fetched from the backend.')
    return null
  }
}

export async function knownAddressesChannel() {
  return simpleReadChannel('addressesExtraInfo')
}

export async function notificationsChannel() {
  return simpleReadChannel('notificationsV2')
}

export async function fetchLostAccounts() {
  if (!FIREBASE_ENABLED) {
    return []
  }
  return firebase
    .database()
    .ref('lostAccounts')
    .once(VALUE_CHANGE_HOOK)
    .then((snapshot) => snapshot.val())
    .then((values) => values.map((address: string) => address.toLowerCase()))
    .catch((error) => {
      Logger.error(TAG, 'Error fetching lost accounts', error)
      return []
    })
}

export async function fetchRewardsSenders() {
  return fetchListFromFirebase('rewardsSenders')
}

export async function fetchInviteRewardsSenders() {
  return fetchListFromFirebase('inviteRewardAddresses')
}

async function fetchListFromFirebase(path: string) {
  if (!FIREBASE_ENABLED) {
    return []
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

export async function cUsdDailyLimitChannel(address: string) {
  return simpleReadChannel(`registrations/${address}/dailyLimitCusd`)
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
      Logger.debug(`Got value from Firebase for key ${key}: ${JSON.stringify(value)}`)
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
  return firebase
    .database()
    .ref(path)
    .once('value')
    .then((snapshot) => snapshot.val())
}

export async function setUserLanguage(address: string, language: string) {
  try {
    Logger.info(TAG, `Setting language selection for user ${address}`)
    const regRef = firebase.database().ref('registrations')
    await regRef.child(address).update({ language })

    Logger.info(TAG, 'User Language synced successfully', language)
  } catch (error) {
    Logger.error(TAG, 'Failed to sync user language selection', error)
    throw error
  }
}
