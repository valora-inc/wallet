import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import { call, select } from 'redux-saga/effects'
import { SendOrigin } from 'src/analytics/types'
import { TokenTransactionType, TransactionFeedFragment } from 'src/apollo/types'
import { activeScreenChanged } from 'src/app/actions'
import { assignProviderToTxHash, bidaliPaymentRequested } from 'src/fiatExchanges/actions'
import { providerLogosSelector } from 'src/fiatExchanges/reducer'
import {
  fetchTxHashesToProviderMapping,
  tagTxsWithProviderInfo,
  watchBidaliPaymentRequests,
} from 'src/fiatExchanges/saga'
import { Actions as IdentityActions, updateKnownAddresses } from 'src/identity/actions'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { AddressRecipient } from 'src/recipients/recipient'
import {
  sendPaymentOrInviteFailure,
  sendPaymentOrInviteLegacy,
  sendPaymentOrInviteSuccess,
} from 'src/send/actions'
import { NewTransactionsInFeedAction } from 'src/transactions/actions'
import { Currency } from 'src/utils/currencies'
import { mockAccount } from 'test/values'

const now = Date.now()
Date.now = jest.fn(() => now)

describe(watchBidaliPaymentRequests, () => {
  const amount = new BigNumber(20)
  const recipient: AddressRecipient = {
    address: '0xTEST',
    name: 'Bidali',
    thumbnailPath:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fbidali.png?alt=media',
  }

  beforeAll(() => {
    jest.useRealTimers()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.each`
    currencyCode | expectedCurrency
    ${'cUSD'}    | ${Currency.Dollar}
    ${'cEUR'}    | ${Currency.Euro}
  `(
    'triggers the payment flow with $currencyCode and calls `onPaymentSent` when successful',
    async ({ currencyCode, expectedCurrency }) => {
      const onPaymentSent = jest.fn()
      const onCancelled = jest.fn()

      await expectSaga(watchBidaliPaymentRequests)
        .put(
          updateKnownAddresses({
            '0xTEST': { name: recipient.name!, imageUrl: recipient.thumbnailPath || null },
          })
        )
        .dispatch(
          bidaliPaymentRequested(
            '0xTEST',
            '20',
            currencyCode,
            'Some description',
            'TEST_CHARGE_ID',
            onPaymentSent,
            onCancelled
          )
        )
        .dispatch(
          sendPaymentOrInviteLegacy(
            amount,
            expectedCurrency,
            'Some description (TEST_CHARGE_ID)',
            recipient,
            '0xTEST',
            undefined,
            undefined,
            true
          )
        )
        .dispatch(sendPaymentOrInviteSuccess(amount))
        .run()

      expect(navigate).toHaveBeenCalledWith(Screens.SendConfirmationLegacyModal, {
        origin: SendOrigin.Bidali,
        transactionData: {
          amount,
          currency: expectedCurrency,
          reason: 'Some description (TEST_CHARGE_ID)',
          recipient,
          type: TokenTransactionType.PayPrefill,
        },
      })
      expect(onPaymentSent).toHaveBeenCalledTimes(1)
      expect(onCancelled).not.toHaveBeenCalled()
    }
  )

  it('triggers the payment flow and calls `onCancelled` when navigating back to the Bidali screen after a failure', async () => {
    const onPaymentSent = jest.fn()
    const onCancelled = jest.fn()

    await expectSaga(watchBidaliPaymentRequests)
      .not.put.actionType(IdentityActions.UPDATE_KNOWN_ADDRESSES)
      .dispatch(
        bidaliPaymentRequested(
          '0xTEST',
          '20',
          'cUSD',
          'Some description',
          'TEST_CHARGE_ID',
          onPaymentSent,
          onCancelled
        )
      )
      .dispatch(
        sendPaymentOrInviteLegacy(
          amount,
          Currency.Dollar,
          'Some description (TEST_CHARGE_ID)',
          recipient,
          '0xTEST',
          undefined,
          undefined,
          true
        )
      )
      .dispatch(sendPaymentOrInviteFailure())
      .dispatch(activeScreenChanged(Screens.BidaliScreen))
      .run()

    expect(navigate).toHaveBeenCalledWith(Screens.SendConfirmationLegacyModal, {
      origin: SendOrigin.Bidali,
      transactionData: {
        amount,
        currency: Currency.Dollar,
        reason: 'Some description (TEST_CHARGE_ID)',
        recipient,
        type: TokenTransactionType.PayPrefill,
      },
    })
    expect(onPaymentSent).not.toHaveBeenCalled()
    expect(onCancelled).toHaveBeenCalled()
  })

  it('throws an error when passing an unsupported currency', async () => {
    const onPaymentSent = jest.fn()
    const onCancelled = jest.fn()

    await expect(
      expectSaga(watchBidaliPaymentRequests)
        .dispatch(
          bidaliPaymentRequested(
            '0xTEST',
            '20',
            'ETH',
            'Some description',
            'TEST_CHARGE_ID',
            onPaymentSent,
            onCancelled
          )
        )
        .run()
    ).rejects.toThrowErrorMatchingInlineSnapshot(`"Unsupported payment currency from Bidali: ETH"`)

    expect(navigate).not.toHaveBeenCalled()
    expect(onPaymentSent).not.toHaveBeenCalled()
    expect(onCancelled).not.toHaveBeenCalled()
  })
})

describe(tagTxsWithProviderInfo, () => {
  const mockAmount = {
    __typename: 'MoneyAmount',
    value: '-0.2',
    currencyCode: 'cUSD',
    localAmount: {
      __typename: 'LocalMoneyAmount',
      value: '-0.2',
      currencyCode: 'USD',
      exchangeRate: '1',
    },
  }

  const providerTransferHash = '0x4607df6d11e63bb024cf1001956de7b6bd7adc253146f8412e8b3756752b8353'
  const exchangeHash = '0x16fbd53c4871f0657f40e1b4515184be04bed8912c6e2abc2cda549e4ad8f852'
  const nonProviderTransferHash =
    '0x28147e5953639687915e9b152173076611cc9e51e8634fad3850374ccc87d7aa'
  const mockProviderAccount = '0x30d5ca2a263e0c0d11e7a668ccf30b38f1482251'

  const transactions: TransactionFeedFragment[] = [
    {
      __typename: 'TokenTransfer',
      type: TokenTransactionType.Received,
      hash: providerTransferHash,
      amount: mockAmount,
      timestamp: 1578530538,
      address: mockProviderAccount,
    },
    {
      __typename: 'TokenExchange',
      type: TokenTransactionType.Exchange,
      hash: exchangeHash,
    } as any,
    {
      __typename: 'TokenTransfer',
      type: TokenTransactionType.Received,
      hash: nonProviderTransferHash,
      amount: mockAmount,
      timestamp: 1578530602,
      address: mockAccount,
    },
  ]

  it('assigns specific display info for providers with tx hashes associated with the user', async () => {
    const providerName = 'Provider'
    const mockProviderLogo = 'www.provider.com/logo'
    const mockDisplayInfo = {
      name: providerName,
      icon: mockProviderLogo,
    }

    const mockTxHashesToProvider = { [providerTransferHash]: providerName }
    const mockProviderLogos = { [providerName]: mockProviderLogo }

    await expectSaga(tagTxsWithProviderInfo, { transactions } as NewTransactionsInFeedAction)
      .provide([
        [select(providerLogosSelector), mockProviderLogos],
        [call(fetchTxHashesToProviderMapping), mockTxHashesToProvider],
      ])
      .put(assignProviderToTxHash(providerTransferHash, mockDisplayInfo))
      .run()
  })
})
