import firebase from '@react-native-firebase/app'
import { expectSaga, SagaType } from 'redux-saga-test-plan'
import { throwError } from 'redux-saga-test-plan/providers'
import { call, select } from 'typed-redux-saga'
import { handleUpdateAccountRegistration } from 'src/account/saga'
import { updateAccountRegistration } from 'src/account/updateAccountRegistration'
import { AppEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { pushNotificationsPermissionChanged } from 'src/app/actions'
import { pushNotificationsEnabledSelector } from 'src/app/selectors'
import { Actions } from 'src/firebase/actions'
import { initializeCloudMessaging, takeWithInMemoryCache } from 'src/firebase/firebase'
import { retrieveSignedMessage } from 'src/pincode/authentication'
import { mockAccount } from 'test/values'

jest.mock('src/analytics/ValoraAnalytics')

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
      yield* call(testEffect)
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
  })

  it('should track and throw error when messaging permission is denied', async () => {
    const errorToRaise = new Error('No permission')
    let catchedError

    await expectSaga(initializeCloudMessaging as SagaType, app, mockAccount)
      .dispatch({ type: 'HOME/VISIT_HOME' })
      .provide([
        [
          call([app.messaging(), 'hasPermission']),
          firebase.messaging.AuthorizationStatus.NOT_DETERMINED,
        ],
        [call([app.messaging(), 'requestPermission']), throwError(errorToRaise)],
      ])
      .run()
      .catch((error: Error) => {
        catchedError = error
      })

    expect(errorToRaise).toEqual(catchedError)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      AppEvents.push_notifications_permission_changed,
      { enabled: false }
    )
  })

  it('handle account registration if firebase messaging is enabled', async () => {
    await expectSaga(initializeCloudMessaging as SagaType, app, mockAccount)
      .provide([
        [select(pushNotificationsEnabledSelector), true],
        [
          call([app.messaging(), 'hasPermission']),
          firebase.messaging.AuthorizationStatus.AUTHORIZED,
        ],
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

    expect(ValoraAnalytics.track).not.toHaveBeenCalled()
  })

  it('should track when messaging permission is granted', async () => {
    await expectSaga(initializeCloudMessaging as SagaType, app, mockAccount)
      .dispatch({ type: 'HOME/VISIT_HOME' })
      .provide([
        [
          call([app.messaging(), 'hasPermission']),
          firebase.messaging.AuthorizationStatus.NOT_DETERMINED,
        ],
        [call([app.messaging(), 'getToken']), mockFcmToken],
      ])
      .put(pushNotificationsPermissionChanged(true))
      .run()

    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      AppEvents.push_notifications_permission_changed,
      { enabled: true }
    )
  })

  it('track when firebase messaging permission has changed between app sessions', async () => {
    await expectSaga(initializeCloudMessaging as SagaType, app, mockAccount)
      .provide([
        [select(pushNotificationsEnabledSelector), true],
        [call([app.messaging(), 'hasPermission']), firebase.messaging.AuthorizationStatus.DENIED],
      ])
      .put(pushNotificationsPermissionChanged(false))
      .run()

    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      AppEvents.push_notifications_permission_changed,
      { enabled: false }
    )
  })
})
