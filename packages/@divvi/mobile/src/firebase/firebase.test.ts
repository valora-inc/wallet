import firebase from '@react-native-firebase/app'
import { PermissionsAndroid, Platform } from 'react-native'
import { expectSaga } from 'redux-saga-test-plan'
import { call, select } from 'redux-saga/effects'
import { handleUpdateAccountRegistration } from 'src/account/saga'
import { updateAccountRegistration } from 'src/account/updateAccountRegistration'
import { AppEvents } from 'src/analytics/Events'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { pushNotificationsPermissionChanged } from 'src/app/actions'
import {
  pushNotificationRequestedUnixTimeSelector,
  pushNotificationsEnabledSelector,
} from 'src/app/selectors'
import { Actions } from 'src/firebase/actions'
import { initializeCloudMessaging, takeWithInMemoryCache } from 'src/firebase/firebase'
import { retrieveSignedMessage } from 'src/pincode/authentication'
import { mockAccount } from 'test/values'

jest.mock('src/analytics/AppAnalytics')

const hasPermissionMock = jest.fn(() => null)
const requestPermissionMock = jest.fn(() => null)
const getTokenMock = jest.fn(() => null)
const onTokenRefreshMock = jest.fn(() => null)
const onMessageMock = jest.fn(() => null)
const onNotificationOpenedAppMock = jest.fn(() => null)
const getInitialNotificationMock = jest.fn(() => null)
const setBackgroundMessageHandler = jest.fn(() => null)

const mockFcmToken = 'token'

const app: any = {
  messaging: () => ({
    hasPermission: hasPermissionMock,
    requestPermission: requestPermissionMock,
    getToken: getTokenMock,
    onTokenRefresh: onTokenRefreshMock,
    setBackgroundMessageHandler,
    onMessage: onMessageMock,
    onNotificationOpenedApp: onNotificationOpenedAppMock,
    getInitialNotification: getInitialNotificationMock,
  }),
}

describe(takeWithInMemoryCache, () => {
  it('should take the action if it is not in the cache', async () => {
    const testAction = 'TEST/ACTION'
    const testEffect = jest.fn()
    const testSaga = function* () {
      yield takeWithInMemoryCache(testAction as Actions)
      yield call(testEffect)
    }

    // calls testEffect after action is dispatched
    await expectSaga(testSaga).dispatch({ type: testAction }).call(testEffect).run()

    // calls testEffect without waiting for action after the first time
    await expectSaga(testSaga).call(testEffect).run()
  })
})

describe(initializeCloudMessaging, () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Platform.OS = 'ios' // default
  })

  it('should track and throw error when messaging permission is denied on iOS', async () => {
    await expectSaga(initializeCloudMessaging, app, mockAccount)
      .dispatch({ type: 'HOME/VISIT_HOME' })
      .provide([
        [call([app.messaging(), 'requestPermission']), 0],
        [select(pushNotificationRequestedUnixTimeSelector), null],
        [select(pushNotificationsEnabledSelector), false],
      ])
      .put(pushNotificationsPermissionChanged(false, true))
      .run()

    expect(AppAnalytics.track).toHaveBeenCalledWith(
      AppEvents.push_notifications_permission_changed,
      { enabled: false }
    )
  })

  it('should track when messaging permission is denied on Android API 33+ by the user', async () => {
    Platform.OS = 'android'
    Object.defineProperty(Platform, 'Version', {
      get: jest.fn(() => 33),
    })

    await expectSaga(initializeCloudMessaging, app, mockAccount)
      .dispatch({ type: 'HOME/VISIT_HOME' })
      .provide([
        [
          call([PermissionsAndroid, 'request'], PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS),
          'denied',
        ],
        [select(pushNotificationRequestedUnixTimeSelector), null],
        [select(pushNotificationsEnabledSelector), false],
      ])
      .put(pushNotificationsPermissionChanged(false, true))
      .run()

    expect(AppAnalytics.track).toHaveBeenCalledWith(
      AppEvents.push_notifications_permission_changed,
      { enabled: false }
    )
  })

  it('handle account registration if firebase messaging is enabled', async () => {
    await expectSaga(initializeCloudMessaging, app, mockAccount)
      .provide([
        [select(pushNotificationRequestedUnixTimeSelector), 123],
        [select(pushNotificationsEnabledSelector), true],
        [call([app.messaging(), 'getToken']), mockFcmToken],
        [call(handleUpdateAccountRegistration), null],
        [
          call(updateAccountRegistration, mockAccount, 'someSignature', {
            fcmToken: mockFcmToken,
          }),
          null,
        ],
        [call(retrieveSignedMessage), 'someSignature'],
      ])
      .call(handleUpdateAccountRegistration)
      .run()

    expect(AppAnalytics.track).not.toHaveBeenCalled()
  })

  it('should track when messaging permission is granted on iOS', async () => {
    await expectSaga(initializeCloudMessaging, app, mockAccount)
      .dispatch({ type: 'HOME/VISIT_HOME' })
      .provide([
        [select(pushNotificationRequestedUnixTimeSelector), null],
        [select(pushNotificationsEnabledSelector), false],
        [call([app.messaging(), 'requestPermission']), 1],
        [call([app.messaging(), 'getToken']), mockFcmToken],
      ])
      .put(pushNotificationsPermissionChanged(true, true))
      .run()

    expect(AppAnalytics.track).toHaveBeenCalledWith(
      AppEvents.push_notifications_permission_changed,
      { enabled: true }
    )
  })

  it('should track when messaging permission is granted on Android API 33+ by the user', async () => {
    Platform.OS = 'android'
    Object.defineProperty(Platform, 'Version', {
      get: jest.fn(() => 33),
    })

    await expectSaga(initializeCloudMessaging, app, mockAccount)
      .dispatch({ type: 'HOME/VISIT_HOME' })
      .provide([
        [select(pushNotificationRequestedUnixTimeSelector), null],
        [select(pushNotificationsEnabledSelector), false],
        [
          call([PermissionsAndroid, 'request'], PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS),
          'granted',
        ],
        [call([app.messaging(), 'getToken']), mockFcmToken],
      ])
      .put(pushNotificationsPermissionChanged(true, true))
      .run()

    expect(AppAnalytics.track).toHaveBeenCalledWith(
      AppEvents.push_notifications_permission_changed,
      { enabled: true }
    )
  })

  it('track when firebase messaging permission has changed between app sessions', async () => {
    await expectSaga(initializeCloudMessaging, app, mockAccount)
      .provide([
        [select(pushNotificationRequestedUnixTimeSelector), 123],
        [select(pushNotificationsEnabledSelector), true],
        [call([app.messaging(), 'hasPermission']), firebase.messaging.AuthorizationStatus.DENIED],
      ])
      .put(pushNotificationsPermissionChanged(false, false))
      .run()

    expect(AppAnalytics.track).toHaveBeenCalledWith(
      AppEvents.push_notifications_permission_changed,
      { enabled: false }
    )
  })
})
