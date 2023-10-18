import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import { select } from 'redux-saga/effects'
import { SendOrigin } from 'src/analytics/types'
import { activeScreenChanged } from 'src/app/actions'
import { bidaliPaymentRequested } from 'src/fiatExchanges/actions'
import { watchBidaliPaymentRequests } from 'src/fiatExchanges/saga'
import { Actions as IdentityActions, updateKnownAddresses } from 'src/identity/actions'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { AddressRecipient, RecipientType } from 'src/recipients/recipient'
import { sendPayment, sendPaymentFailure, sendPaymentSuccess } from 'src/send/actions'
import { tokensByCurrencySelector } from 'src/tokens/selectors'
import Logger from 'src/utils/Logger'
import { Currency } from 'src/utils/currencies'

const now = Date.now()
Date.now = jest.fn(() => now)

const loggerErrorSpy = jest.spyOn(Logger, 'error')

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
    currencyCode | expectedCurrency   | expectedTokenAddress
    ${'cUSD'}    | ${Currency.Dollar} | ${'mockCusdAddress'}
    ${'cEUR'}    | ${Currency.Euro}   | ${'mockCeurAddress'}
  `(
    'triggers the payment flow with $currencyCode and calls `onPaymentSent` when successful',
    async ({ currencyCode, expectedCurrency, expectedTokenAddress }) => {
      const onPaymentSent = jest.fn()
      const onCancelled = jest.fn()

      await expectSaga(watchBidaliPaymentRequests)
        .provide([
          [
            select(tokensByCurrencySelector),
            { [expectedCurrency]: { address: expectedTokenAddress } },
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
            expectedTokenAddress,
            new BigNumber('20'),
            'Some description (TEST_CHARGE_ID)',
            recipient,
            {
              fee: new BigNumber('0.01'),
              gas: new BigNumber('0.01'),
              gasPrice: new BigNumber('0.01'),
              feeCurrency: expectedCurrency,
            },
            true
          )
        )
        .dispatch(sendPaymentSuccess(amount))
        .run()

      expect(navigate).toHaveBeenCalledWith(Screens.SendConfirmationModal, {
        origin: SendOrigin.Bidali,
        transactionData: {
          inputAmount: amount,
          comment: 'Some description (TEST_CHARGE_ID)',
          recipient,
          amountIsInLocalCurrency: false,
          tokenAddress: expectedTokenAddress,
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
        [select(tokensByCurrencySelector), { [Currency.Dollar]: { address: 'mockCusdAddress' } }],
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
          'mockCusdAddress',
          new BigNumber('20'),
          'Some description (TEST_CHARGE_ID)',
          recipient,
          {
            fee: new BigNumber('0.01'),
            gas: new BigNumber('0.01'),
            gasPrice: new BigNumber('0.01'),
            feeCurrency: Currency.Dollar,
          },
          true
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
        tokenAddress: 'mockCusdAddress',
        tokenAmount: amount,
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
