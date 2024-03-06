import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import { call, select } from 'redux-saga/effects'
import { SendOrigin } from 'src/analytics/types'
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
import { AddressRecipient, RecipientType } from 'src/recipients/recipient'
import { sendPayment, sendPaymentFailure, sendPaymentSuccess } from 'src/send/actions'
import { tokensByCurrencySelector } from 'src/tokens/selectors'
import { updateTransactions } from 'src/transactions/actions'
import {
  NetworkId,
  TokenTransaction,
  TokenTransactionTypeV2,
  TransactionStatus,
} from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { Currency } from 'src/utils/currencies'
import { SerializableTransactionRequest } from 'src/viem/preparedTransactionSerialization'
import {
  mockAccount,
  mockCeurAddress,
  mockCeurTokenId,
  mockCusdAddress,
  mockCusdTokenId,
} from 'test/values'

const now = Date.now()
Date.now = jest.fn(() => now)

const loggerErrorSpy = jest.spyOn(Logger, 'error')
const mockPreparedTransaction: SerializableTransactionRequest = {
  from: '0xfrom',
  to: '0xto',
  data: '0xdata',
}

describe(watchBidaliPaymentRequests, () => {
  const amount = new BigNumber(20)
  const recipient: AddressRecipient = {
    address: '0xTEST',
    name: 'Bidali',
    thumbnailPath:
      'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fbidali.png?alt=media',
    recipientType: RecipientType.Address,
  }

  beforeAll(() => {
    jest.useRealTimers()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.each`
    currencyCode | expectedCurrency   | expectedTokenAddress | expectedTokenId
    ${'cUSD'}    | ${Currency.Dollar} | ${mockCusdAddress}   | ${mockCusdTokenId}
    ${'cEUR'}    | ${Currency.Euro}   | ${mockCeurAddress}   | ${mockCeurTokenId}
  `(
    'triggers the payment flow with $currencyCode and calls `onPaymentSent` when successful',
    async ({ currencyCode, expectedCurrency, expectedTokenAddress, expectedTokenId }) => {
      const onPaymentSent = jest.fn()
      const onCancelled = jest.fn()

      await expectSaga(watchBidaliPaymentRequests)
        .provide([
          [
            select(tokensByCurrencySelector),
            { [expectedCurrency]: { address: expectedTokenAddress, tokenId: expectedTokenId } },
          ],
        ])
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
          sendPayment(
            amount,
            expectedTokenId,
            new BigNumber('20'),
            'Some description (TEST_CHARGE_ID)',
            recipient,
            true,
            mockPreparedTransaction
          )
        )
        .dispatch(sendPaymentSuccess({ amount, tokenId: expectedTokenId }))
        .run()

      expect(navigate).toHaveBeenCalledWith(Screens.SendConfirmationModal, {
        origin: SendOrigin.Bidali,
        transactionData: {
          inputAmount: amount,
          comment: 'Some description (TEST_CHARGE_ID)',
          recipient,
          amountIsInLocalCurrency: false,
          tokenAddress: expectedTokenAddress,
          tokenId: expectedTokenId,
          tokenAmount: amount,
        },
        isFromScan: false,
      })
      expect(onPaymentSent).toHaveBeenCalledTimes(1)
      expect(onCancelled).not.toHaveBeenCalled()
    }
  )

  it('triggers the payment flow and calls `onCancelled` when navigating back to the Bidali screen after a failure', async () => {
    const onPaymentSent = jest.fn()
    const onCancelled = jest.fn()

    await expectSaga(watchBidaliPaymentRequests)
      .provide([
        [
          select(tokensByCurrencySelector),
          { [Currency.Dollar]: { address: mockCusdAddress, tokenId: mockCusdTokenId } },
        ],
      ])
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
        sendPayment(
          amount,
          mockCusdTokenId,
          new BigNumber('20'),
          'Some description (TEST_CHARGE_ID)',
          recipient,
          true,
          mockPreparedTransaction
        )
      )
      .dispatch(sendPaymentFailure())
      .dispatch(activeScreenChanged(Screens.BidaliScreen))
      .run()

    expect(navigate).toHaveBeenCalledWith(Screens.SendConfirmationModal, {
      origin: SendOrigin.Bidali,
      transactionData: {
        inputAmount: amount,
        comment: 'Some description (TEST_CHARGE_ID)',
        recipient,
        amountIsInLocalCurrency: false,
        tokenAddress: mockCusdAddress,
        tokenAmount: amount,
        tokenId: mockCusdTokenId,
      },
      isFromScan: false,
    })
    expect(onPaymentSent).not.toHaveBeenCalled()
    expect(onCancelled).toHaveBeenCalled()
  })

  it('logs an error when passing an unsupported currency', async () => {
    const onPaymentSent = jest.fn()
    const onCancelled = jest.fn()

    await expectSaga(watchBidaliPaymentRequests)
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

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'utils/safely',
      'Unhandled error in wrapped saga',
      new Error('Unsupported payment currency from Bidali: ETH')
    )
    expect(navigate).not.toHaveBeenCalled()
    expect(onPaymentSent).not.toHaveBeenCalled()
    expect(onCancelled).not.toHaveBeenCalled()
  })
})

describe(tagTxsWithProviderInfo, () => {
  const mockAmount = {
    value: '-0.2',
    localAmount: {
      value: '-0.2',
      currencyCode: 'USD',
      exchangeRate: '1',
    },
    tokenId: 'celo-mainnet:0xabc',
  }

  const providerTransferHash = '0x4607df6d11e63bb024cf1001956de7b6bd7adc253146f8412e8b3756752b8353'
  const sentHash = '0x16fbd53c4871f0657f40e1b4515184be04bed8912c6e2abc2cda549e4ad8f852'
  const nonProviderTransferHash =
    '0x28147e5953639687915e9b152173076611cc9e51e8634fad3850374ccc87d7aa'
  const mockProviderAccount = '0x30d5ca2a263e0c0d11e7a668ccf30b38f1482251'

  const mockTransactionDetails = {
    __typename: 'TokenTransferV3' as const,
    amount: mockAmount,
    timestamp: 1578530602,
    address: mockAccount,
    networkId: NetworkId['celo-mainnet'],
    block: '123',
    fees: [],
    metadata: {},
    status: TransactionStatus.Complete,
  }
  const transactions: TokenTransaction[] = [
    {
      ...mockTransactionDetails,
      type: TokenTransactionTypeV2.Received,
      transactionHash: providerTransferHash,
      timestamp: 1578530538,
      address: mockProviderAccount,
    },
    {
      ...mockTransactionDetails,
      type: TokenTransactionTypeV2.Sent,
      transactionHash: sentHash,
    },
    {
      ...mockTransactionDetails,
      type: TokenTransactionTypeV2.Received,
      transactionHash: nonProviderTransferHash,
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

    await expectSaga(
      tagTxsWithProviderInfo,
      updateTransactions(NetworkId['celo-alfajores'], transactions)
    )
      .provide([
        [select(providerLogosSelector), mockProviderLogos],
        [call(fetchTxHashesToProviderMapping), mockTxHashesToProvider],
      ])
      .put(assignProviderToTxHash(providerTransferHash, mockDisplayInfo))
      .run()
  })
})
