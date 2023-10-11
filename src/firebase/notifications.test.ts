import { KycSchema } from '@fiatconnect/fiatconnect-types'
import { FirebaseMessagingTypes } from '@react-native-firebase/messaging'
import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import { select } from 'redux-saga/effects'
import { showError, showMessage } from 'src/alert/actions'
import { SendOrigin } from 'src/analytics/types'
import { openUrl } from 'src/app/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { handleNotification } from 'src/firebase/notifications'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { NotificationReceiveState, NotificationTypes } from 'src/notifications/types'
import { RecipientType } from 'src/recipients/recipient'
import { NetworkId } from 'src/transactions/types'
import { recipientInfoSelector } from 'src/recipients/reducer'
import { stablecoinsSelector } from 'src/tokens/selectors'
import { mockRecipientInfo, mockTokenBalances } from 'test/values'

describe(handleNotification, () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('with a simple notification', () => {
    const message: FirebaseMessagingTypes.RemoteMessage = {
      notification: { title: 'My title', body: 'My Body' },
      fcmOptions: {},
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
    const message: FirebaseMessagingTypes.RemoteMessage = {
      notification: { title: 'My title', body: 'My Body' },
      data: { ou: 'https://celo.org' },
      fcmOptions: {},
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
        { ...message, data: { ou: message.data!.ou, openExternal: 'true' } },
        NotificationReceiveState.AppColdStart
      )
        .put(openUrl(message.data!.ou, true, true))
        .run()
    })
  })

  describe("with a notification with an 'open url' semantic and a deep link", () => {
    const message: FirebaseMessagingTypes.RemoteMessage = {
      notification: { title: 'My title', body: 'My Body' },
      data: { ou: `celo://wallet/openScreen?screen=${Screens.WalletHome}` },
      fcmOptions: {},
    }

    it('fires  an event to open the deep link', async () => {
      await expectSaga(handleNotification, message, NotificationReceiveState.AppColdStart)
        .put(openUrl(message.data!.ou, false, true))
        .run()
    })
  })

  describe('with a payment received notification', () => {
    const message: FirebaseMessagingTypes.RemoteMessage = {
      fcmOptions: { link: 'https://valoraapp.com' },
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
          __typename: 'TokenTransferV3',
          networkId: NetworkId['celo-alfajores'],
          type: 'RECEIVED',
          transactionHash: '0xTXHASH',
          timestamp: 1,
          block: '42',
          address: '0xtest',
          amount: {
            tokenId: 'celo-alfajores:0xCUSD',
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
    const message: FirebaseMessagingTypes.RemoteMessage = {
      notification: { title: 'My title', body: 'My Body' },
      data: {
        type: NotificationTypes.PAYMENT_REQUESTED,
        uid: 'abc',
        requesterAddress: '0xTEST',
        amount: '10',
        comment: 'Pizza',
      },
      fcmOptions: {},
    }

    it('shows the in-app message when the app is already in the foreground', async () => {
      await expectSaga(handleNotification, message, NotificationReceiveState.AppAlreadyOpen)
        .put(showMessage('My Body', undefined, null, null, 'My title'))
        .run()

      expect(navigate).not.toHaveBeenCalled()
    })

    it('navigates to the send confirmation screen if the app is not already in the foreground', async () => {
      const tokenBalances = Object.values(mockTokenBalances).map((tokenBalance) => ({
        ...tokenBalance,
        balance: BigNumber(11), // Balance in usd is larger than requested amount
        priceUsd: BigNumber(1),
        lastKnownPriceUsd: null,
      }))

      await expectSaga(handleNotification, message, NotificationReceiveState.AppColdStart)
        .provide([
          [select(recipientInfoSelector), mockRecipientInfo],
          [select(stablecoinsSelector), tokenBalances],
        ])
        .run()

      expect(navigate).toHaveBeenCalledWith(Screens.SendConfirmation, {
        isFromScan: false,
        origin: SendOrigin.AppRequestFlow,
        transactionData: {
          recipient: {
            address: '0xTEST',
            recipientType: RecipientType.Address,
            contactId: undefined,
            displayNumber: undefined,
            e164PhoneNumber: undefined,
            name: undefined,
            thumbnailPath: undefined,
          },
          amountIsInLocalCurrency: false,
          paymentRequestId: 'abc',
          inputAmount: BigNumber(10),
          comment: 'Pizza',
          tokenAddress: '0x874069fa1eb16d44d622f2e0ca25eea172369bc1',
          tokenAmount: BigNumber(10),
        },
      })
    })

    it('does not navigate to the send confirmation screen if requested amount is greater than available balance', async () => {
      const tokenBalances = Object.values(mockTokenBalances).map((tokenBalance) => ({
        ...tokenBalance,
        balance: BigNumber(1), // Balance in usd is smaller than requested amount
        priceUsd: BigNumber(1),
        lastKnownPriceUsd: null,
      }))

      await expectSaga(handleNotification, message, NotificationReceiveState.AppColdStart)
        .provide([
          [select(recipientInfoSelector), mockRecipientInfo],
          [select(stablecoinsSelector), tokenBalances],
        ])
        .put(showError(ErrorMessages.INSUFFICIENT_BALANCE_STABLE))
        .run()

      expect(navigate).not.toHaveBeenCalled()
    })
  })

  describe('with a kyc approved notification', () => {
    const message: FirebaseMessagingTypes.RemoteMessage = {
      notification: { title: 'KYC', body: 'Kyc Approved' },
      data: {
        type: NotificationTypes.FIAT_CONNECT_KYC_APPROVED,
        kycSchema: KycSchema.PersonalDataAndDocuments,
        providerId: 'test-provider',
      },
      fcmOptions: {},
    }

    it('shows the in-app message when the app is already in the foreground', async () => {
      await expectSaga(handleNotification, message, NotificationReceiveState.AppAlreadyOpen)
        .put(showMessage('Kyc Approved', undefined, null, null, 'KYC'))
        .run()

      expect(navigate).not.toHaveBeenCalled()
    })

    it('navigates to the review screen if the app is not already in the foreground', async () => {
      await expectSaga(handleNotification, message, NotificationReceiveState.AppColdStart)
        .provide([[select(recipientInfoSelector), mockRecipientInfo]])
        .run()

      expect(navigate).toHaveBeenCalledWith(Screens.FiatConnectRefetchQuote, {
        kycSchema: KycSchema.PersonalDataAndDocuments,
        providerId: 'test-provider',
        type: NotificationTypes.FIAT_CONNECT_KYC_APPROVED,
      })
    })
  })
})
