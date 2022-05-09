import firebase from '@react-native-firebase/app'
import { expectSaga } from 'redux-saga-test-plan'
import { throwError } from 'redux-saga-test-plan/providers'
import { call } from 'redux-saga/effects'
import { handleUpdateAccountRegistration } from 'src/account/saga'
import { updateAccountRegistration } from 'src/account/updateAccountRegistration'
import { initializeCloudMessaging } from 'src/firebase/firebase'
import { retrieveSignedMessage } from 'src/pincode/authentication'
import { mockAccount2 } from 'test/values'

const hasPermissionMock = jest.fn(() => null)
const requestPermissionMock = jest.fn(() => null)
const registerDeviceForRemoteMessagesMock = jest.fn(() => null)
const getTokenMock = jest.fn(() => null)
const onTokenRefreshMock = jest.fn(() => null)
const onMessageMock = jest.fn(() => null)
const onNotificationOpenedAppMock = jest.fn(() => null)
const getInitialNotificationMock = jest.fn(() => null)
const setBackgroundMessageHandler = jest.fn(() => null)

const address = mockAccount2
const mockFcmToken = 'token'

const app: any = {
  messaging: () => ({
    hasPermission: hasPermissionMock,
    requestPermission: requestPermissionMock,
    registerDeviceForRemoteMessages: registerDeviceForRemoteMessagesMock,
    getToken: getTokenMock,
    onTokenRefresh: onTokenRefreshMock,
    setBackgroundMessageHandler,
    onMessage: onMessageMock,
    onNotificationOpenedApp: onNotificationOpenedAppMock,
    getInitialNotification: getInitialNotificationMock,
  }),
}

describe(initializeCloudMessaging, () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it("Firebase doesn't have permission", async () => {
    const errorToRaise = new Error('No permission')
    let catchedError

    await expectSaga(initializeCloudMessaging, app, address)
      .provide([
        [
          call([app.messaging(), 'hasPermission']),
          firebase.messaging.AuthorizationStatus.NOT_DETERMINED,
        ],
        [call([app.messaging(), 'requestPermission']), throwError(errorToRaise)],
        {
          spawn(effect, next) {
            // mock all spawns
            return
          },
        },
      ])
      .run()
      .catch((error: Error) => {
        catchedError = error
      })

    expect(errorToRaise).toEqual(catchedError)
  })

  it('Firebase has permission', async () => {
    await expectSaga(initializeCloudMessaging, app, address)
      .provide([
        [call([app.messaging(), 'hasPermission']), true],
        [call([app.messaging(), 'getToken']), mockFcmToken],
        [call(handleUpdateAccountRegistration), null],
        [
          call(updateAccountRegistration, address, 'someSignature', {
            fcmToken: mockFcmToken,
          }),
          null,
        ],
        [call(retrieveSignedMessage), 'someSignature'],
        {
          spawn(effect, next) {
            // mock all spawns
            return
          },
        },
      ])
      .call(handleUpdateAccountRegistration)
      .run()
  })
})
