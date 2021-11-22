import * as admin from 'firebase-admin'
import { Currencies } from '../src/blockscout/transfers'
import {
  sendPaymentNotification,
  _setInviteRewardsSenders,
  _setKnownAddressesCache,
  _setRegistrationsRef,
  _setRewardsSenders,
} from '../src/firebase'

const SENDER_ADDRESS = '0x123456'

const messagingMock = {
  send: jest.fn(),
}

jest.mock('firebase-admin', () => ({
  messaging() {
    return messagingMock
  },
}))

const mockedMessagingSend = admin.messaging().send as jest.Mock

const mockedKnownAddressesCache = {
  getDisplayInfoFor: (address: string) => {
    switch (address) {
      case SENDER_ADDRESS:
        return { name: 'Test Name', imageUrl: 'Test Image' }
      default:
        return {}
    }
  },
}

const mockedRegistrationsRef = {
  once: jest.fn((event, callback) =>
    // @ts-ignore: Only mocking the `val` property
    callback({ val: () => ({ '0xabc': { fcmToken: 'TEST_FCM_TOKEN' } }) })
  ),
}

describe('sendPaymentNotification', () => {
  beforeEach(() => {
    // @ts-ignore: Only mocking the `on` property
    _setRegistrationsRef(mockedRegistrationsRef)
    //@ts-ignore: Only mocking getDisplayInfo
    _setKnownAddressesCache(mockedKnownAddressesCache)
    mockedMessagingSend.mockClear()
  })

  it('should send a payment notification for cUSD', async () => {
    expect.hasAssertions()

    _setRewardsSenders([])

    await sendPaymentNotification(SENDER_ADDRESS, '0xabc', '10', Currencies.DOLLAR, 150, {})

    expect(mockedMessagingSend).toHaveBeenCalledTimes(1)
    expect(mockedMessagingSend.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        Object {
          "android": Object {
            "notification": Object {
              "color": "#42D689",
              "icon": "ic_stat_rings",
            },
            "priority": "normal",
            "ttl": 604800000,
          },
          "data": Object {
            "imageUrl": "Test Image",
            "name": "Test Name",
            "type": "PAYMENT_RECEIVED",
          },
          "notification": Object {
            "body": "You've received 10 cUSD",
            "title": "Payment Received",
          },
          "token": "TEST_FCM_TOKEN",
        },
        true,
      ]
    `)
  })

  it('should send a deposit received notification for CELO', async () => {
    _setRewardsSenders([])

    await sendPaymentNotification(SENDER_ADDRESS, '0xabc', '10', Currencies.GOLD, 150, {})

    expect(mockedMessagingSend).toHaveBeenCalledTimes(1)
    expect(mockedMessagingSend.mock.calls[0][0].notification.title).toEqual('CELO deposit received')
    expect(mockedMessagingSend.mock.calls[0][0].notification.body).toEqual(
      'You just received 10 CELO! You can earn, save and spend in Valora. Tap to learn more.'
    )
  })

  it('should send a reward received notification', async () => {
    _setRewardsSenders([SENDER_ADDRESS])

    await sendPaymentNotification(SENDER_ADDRESS, '0xabc', '10', Currencies.EURO, 150, {})

    expect(mockedMessagingSend).toHaveBeenCalledTimes(1)
    expect(mockedMessagingSend.mock.calls[0][0].notification.title).toEqual(
      "You're getting even more cEUR 📈"
    )
    expect(mockedMessagingSend.mock.calls[0][0].notification.body).toEqual(
      'Your weekly rewards have arrived! Add more cEUR to boost your balance.'
    )
  })

  it('should send an invite reward received notification', async () => {
    _setRewardsSenders([])
    _setInviteRewardsSenders([SENDER_ADDRESS])

    await sendPaymentNotification(SENDER_ADDRESS, '0xabc', '5', Currencies.EURO, 150, {})

    expect(mockedMessagingSend).toHaveBeenCalledTimes(1)
    expect(mockedMessagingSend.mock.calls[0][0].notification.title).toEqual('Invite Accepted')
    expect(mockedMessagingSend.mock.calls[0][0].notification.body).toEqual(
      'Your friend accepted your Valora invite, and you earned 5 cEUR!'
    )
  })
})
