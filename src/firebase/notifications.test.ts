import { FirebaseMessagingTypes } from '@react-native-firebase/messaging'
import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import { select } from 'redux-saga/effects'
import { showMessage } from 'src/alert/actions'
import { SendOrigin } from 'src/analytics/types'
import { openUrl } from 'src/app/actions'
import { handleNotification } from 'src/firebase/notifications'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { NotificationReceiveState, NotificationTypes } from 'src/notifications/types'
import { recipientInfoSelector } from 'src/recipients/reducer'
import { Currency } from 'src/utils/currencies'
import { mockRecipientInfo } from 'test/values'

describe(handleNotification, () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('with a simple notification', () => {
    const message = {
      notification: { title: 'My title', body: 'My Body' },
    }

    it('shows the in-app message when the app is already in the foreground', async () => {
      await expectSaga(handleNotification, message, NotificationReceiveState.AppAlreadyOpen)
        .put(showMessage('My Body', undefined, null, null, 'My title'))
        .run()
    })

    it('has no effect if the app is not already in the foreground', async () => {
      const result = await expectSaga(
        handleNotification,
        message,
        NotificationReceiveState.AppColdStart
      ).run()

      expect(result.toJSON()).toEqual({})
    })
  })

  describe("with a notification with an 'open url' semantic", () => {
    const message = {
      notification: { title: 'My title', body: 'My Body' },
      data: { ou: 'https://celo.org' },
    }

    it('shows the in-app message when the app is already in the foreground', async () => {
      await expectSaga(handleNotification, message, NotificationReceiveState.AppAlreadyOpen)
        .put(
          showMessage(
            'My Body',
            undefined,
            null,
            openUrl('https://celo.org', false, true),
            'My title'
          )
        )
        .run()
    })

    it('directly opens the url if the app is not already in the foreground', async () => {
      await expectSaga(handleNotification, message, NotificationReceiveState.AppColdStart)
        .put(openUrl('https://celo.org', false, true))
        .run()
    })

    it('directly opens the url externally if the app is not already in the foreground and openExternal is true', async () => {
      await expectSaga(
        handleNotification,
        { ...message, data: { ou: message.data.ou, openExternal: 'true' } },
        NotificationReceiveState.AppColdStart
      )
        .put(openUrl(message.data.ou, true, true))
        .run()
    })
  })

  describe("with a notification with an 'open url' semantic and a deep link", () => {
    const message = {
      notification: { title: 'My title', body: 'My Body' },
      data: { ou: `kolektivo://wallet/openScreen?screen=${Screens.WalletHome}` },
    }

    it('fires  an event to open the deep link', async () => {
      await expectSaga(handleNotification, message, NotificationReceiveState.AppColdStart)
        .put(openUrl(message.data.ou, false, true))
        .run()
    })
  })

  describe('with a payment received notification', () => {
    const message: FirebaseMessagingTypes.RemoteMessage = {
      notification: { title: 'My title', body: 'My Body' },
      data: {
        type: NotificationTypes.PAYMENT_RECEIVED,
        sender: '0xTEST',
        value: '10',
        tokenAddress: '0xCUSD',
        timestamp: '1',
        blockNumber: '42',
        txHash: '0xTXHASH',
        comment: 'Tea',
        name: 'Alice',
        imageUrl: 'https://example.com/image.png',
      },
    }

    it('shows the in-app message when the app is already in the foreground', async () => {
      await expectSaga(handleNotification, message, NotificationReceiveState.AppAlreadyOpen)
        .put(showMessage('My Body', undefined, null, null, 'My title'))
        .run()

      expect(navigate).not.toHaveBeenCalled()
    })

    it('navigates to the transaction details screen if the app is not already in the foreground', async () => {
      await expectSaga(handleNotification, message, NotificationReceiveState.AppColdStart).run()

      expect(navigate).toHaveBeenCalledWith(Screens.TransactionDetailsScreen, {
        transaction: {
          __typename: 'TokenTransferV2',
          type: 'RECEIVED',
          transactionHash: '0xTXHASH',
          timestamp: 1,
          block: '42',
          address: '0xtest',
          amount: {
            value: '10',
            tokenAddress: '0xCUSD',
          },
          metadata: {
            title: 'Alice',
            image: 'https://example.com/image.png',
            comment: 'Tea',
          },
          fees: [],
        },
      })
    })
  })

  describe('with a payment request notification', () => {
    const message = {
      notification: { title: 'My title', body: 'My Body' },
      data: {
        type: NotificationTypes.PAYMENT_REQUESTED,
        uid: 'abc',
        requesterAddress: '0xTEST',
        amount: '10',
        comment: 'Pizza',
      },
    }

    it('shows the in-app message when the app is already in the foreground', async () => {
      await expectSaga(handleNotification, message, NotificationReceiveState.AppAlreadyOpen)
        .put(showMessage('My Body', undefined, null, null, 'My title'))
        .run()

      expect(navigate).not.toHaveBeenCalled()
    })

    it('navigates to the send confirmation screen if the app is not already in the foreground', async () => {
      await expectSaga(handleNotification, message, NotificationReceiveState.AppColdStart)
        .provide([[select(recipientInfoSelector), mockRecipientInfo]])
        .run()

      expect(navigate).toHaveBeenCalledWith(Screens.SendConfirmationLegacy, {
        origin: SendOrigin.AppRequestFlow,
        transactionData: {
          amount: new BigNumber('10'),
          currency: Currency.Dollar,
          firebasePendingRequestUid: 'abc',
          reason: 'Pizza',
          recipient: { address: '0xTEST' },
          type: 'PAY_REQUEST',
        },
      })
    })
  })
})
