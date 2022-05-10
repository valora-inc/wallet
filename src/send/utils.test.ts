import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { select } from 'redux-saga-test-plan/matchers'
import { SendOrigin } from 'src/analytics/types'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { fetchExchangeRate } from 'src/localCurrency/saga'
import { localCurrencyToUsdSelector } from 'src/localCurrency/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { UriData, urlFromUriData } from 'src/qrcode/schema'
import { PaymentInfo } from 'src/send/reducers'
import { TransactionDataInput } from 'src/send/SendAmount'
import {
  dailyAmountRemaining,
  handlePaymentDeeplink,
  handleSendPaymentData,
  _isPaymentLimitReached,
} from 'src/send/utils'
import { Currency } from 'src/utils/currencies'
import { createMockStore } from 'test/utils'
import {
  mockAccount2,
  mockCeloAddress,
  mockCeurAddress,
  mockCusdAddress,
  mockQRCodeRecipient,
  mockUriData,
} from 'test/values'

const dailyLimit = 500

describe('send/utils', () => {
  const HOURS = 3600 * 1000
  describe('isPaymentLimitReached', () => {
    it('no recent payments, fine', () => {
      const now = Date.now()
      const newPayment = 10
      const recentPayments: PaymentInfo[] = []
      expect(_isPaymentLimitReached(now, recentPayments, newPayment, dailyLimit)).toBeFalsy()
    })

    it('no recent payments, large transaction, fine', () => {
      const now = Date.now()
      const newPayment = 500
      const recentPayments: PaymentInfo[] = []
      expect(_isPaymentLimitReached(now, recentPayments, newPayment, dailyLimit)).toBeFalsy()
    })

    it('no recent payments, too large transaction', () => {
      const now = Date.now()
      const newPayment = 501
      const recentPayments: PaymentInfo[] = []
      expect(_isPaymentLimitReached(now, recentPayments, newPayment, dailyLimit)).toBeTruthy()
    })

    it('one recent payment, fine', () => {
      const now = Date.now()
      const newPayment = 10
      const recentPayments: PaymentInfo[] = [{ timestamp: now, amount: 10 }]
      expect(_isPaymentLimitReached(now, recentPayments, newPayment, dailyLimit)).toBeFalsy()
    })

    it('multiple recent payments, fine', () => {
      const now = Date.now()
      const newPayment = 10
      const recentPayments: PaymentInfo[] = [
        { timestamp: now - 2 * HOURS, amount: 200 },
        { timestamp: now - 3 * HOURS, amount: 200 },
      ]
      expect(_isPaymentLimitReached(now, recentPayments, newPayment, dailyLimit)).toBeFalsy()
    })

    it('one large recent payment, more than 24 hours ago, fine', () => {
      const now = Date.now()
      const newPayment = 10
      const recentPayments: PaymentInfo[] = [{ timestamp: now - 25 * HOURS, amount: 500 }]
      expect(_isPaymentLimitReached(now, recentPayments, newPayment, dailyLimit)).toBeFalsy()
    })

    it('multiple recent payments, over limit, more than 24 hours ago, fine', () => {
      const now = Date.now()
      const newPayment = 10
      const recentPayments: PaymentInfo[] = [
        { timestamp: now - 48 * HOURS, amount: 300 },
        { timestamp: now - 24 * HOURS, amount: 300 },
      ]
      expect(_isPaymentLimitReached(now, recentPayments, newPayment, dailyLimit)).toBeFalsy()
    })

    it('multiple recent payments, over limit', () => {
      const now = Date.now()
      const newPayment = 10
      const recentPayments: PaymentInfo[] = [
        { timestamp: now - 12 * HOURS, amount: 250 },
        { timestamp: now - 6 * HOURS, amount: 250 },
      ]
      expect(_isPaymentLimitReached(now, recentPayments, newPayment, dailyLimit)).toBeTruthy()
    })
  })
  describe('dailyAmountRemaining', () => {
    it('returns difference between amount sent in last 24 hours and the Limit', () => {
      const now = Date.now()
      const recentPayments: PaymentInfo[] = [{ timestamp: now, amount: 10 }]
      expect(dailyAmountRemaining(now, recentPayments, dailyLimit)).toEqual(490)
    })

    it('returns 0 when limit has been reached', () => {
      const now = Date.now()
      const recentPayments: PaymentInfo[] = [
        { timestamp: now, amount: 100 },
        { timestamp: now, amount: 200 },
        { timestamp: now, amount: 200 },
      ]
      expect(dailyAmountRemaining(now, recentPayments, dailyLimit)).toEqual(0)
    })

    it('works fine when no payments have been sent', () => {
      const now = Date.now()
      const recentPayments: PaymentInfo[] = []
      expect(dailyAmountRemaining(now, recentPayments, dailyLimit)).toEqual(500)
    })

    it('works fine when payments were sent but some more than 24 hours ago', () => {
      const now = Date.now()
      const recentPayments: PaymentInfo[] = [
        { timestamp: now - 48 * HOURS, amount: 300 },
        { timestamp: now - 16 * HOURS, amount: 300 },
      ]
      expect(dailyAmountRemaining(now, recentPayments, dailyLimit)).toEqual(200)
    })
  })

  describe('handlePaymentDeeplink', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    const mockData = {
      address: mockAccount2.toLowerCase(),
      currencyCode: 'USD' as LocalCurrencyCode,
    }

    it('should navigate to SendAmount screen when no amount nor token is sent', async () => {
      await expectSaga(handleSendPaymentData, mockData)
        .withState(createMockStore({}).getState())
        .provide([
          [matchers.call.fn(fetchExchangeRate), '1'],
          [select(localCurrencyToUsdSelector), '1'],
        ])
        .run()
      expect(navigate).toHaveBeenCalledWith(Screens.SendAmount, {
        origin: SendOrigin.AppSendFlow,
        recipient: { address: mockData.address },
        isOutgoingPaymentRequest: undefined,
        forceTokenAddress: undefined,
      })
    })

    it('should navigate to SendAmount screen when no amount is sent but token is', async () => {
      await expectSaga(handleSendPaymentData, { ...mockData, token: 'cEUR' })
        .withState(createMockStore({}).getState())
        .provide([
          [matchers.call.fn(fetchExchangeRate), '1'],
          [select(localCurrencyToUsdSelector), '1'],
        ])
        .run()
      expect(navigate).toHaveBeenCalledWith(Screens.SendAmount, {
        origin: SendOrigin.AppSendFlow,
        recipient: { address: mockData.address },
        isOutgoingPaymentRequest: undefined,
        forceTokenAddress: mockCeurAddress,
      })
    })

    it('should navigate to SendAmount screen when amount and token are sent but not recognized', async () => {
      await expectSaga(handleSendPaymentData, { ...mockData, amount: 1, token: 'NOT_A_TOKEN' })
        .withState(createMockStore({}).getState())
        .provide([
          [matchers.call.fn(fetchExchangeRate), '1'],
          [select(localCurrencyToUsdSelector), '1'],
        ])
        .run()
      expect(navigate).toHaveBeenCalledWith(Screens.SendAmount, {
        origin: SendOrigin.AppSendFlow,
        recipient: { address: mockData.address },
        isOutgoingPaymentRequest: undefined,
        forceTokenAddress: undefined,
      })
    })

    it('should throw an error when no local currency exchange rate is available', async () => {
      await expect(
        expectSaga(handleSendPaymentData, mockData)
          .withState(
            createMockStore({
              localCurrency: {
                exchangeRates: {
                  [Currency.Dollar]: null,
                },
              },
            }).getState()
          )
          .provide([
            [matchers.call.fn(fetchExchangeRate), '1'],
            [select(localCurrencyToUsdSelector), '1'],
          ])
          .run()
      ).rejects.toThrowError("Precondition failed: Can't send tokens from payment data")
      expect(navigate).not.toHaveBeenCalled()
    })

    it('should navigate to SendConfirmation screen when amount and token are sent', async () => {
      await expectSaga(handleSendPaymentData, { ...mockData, amount: 1, token: 'cEUR' })
        .withState(createMockStore({}).getState())
        .provide([
          [matchers.call.fn(fetchExchangeRate), '1'],
          [select(localCurrencyToUsdSelector), '1'],
        ])
        .run()
      expect(navigate).toHaveBeenCalledWith(Screens.SendConfirmation, {
        transactionData: {
          recipient: { address: mockData.address },
          inputAmount: new BigNumber(1),
          amountIsInLocalCurrency: true,
          tokenAddress: mockCeurAddress,
          tokenAmount: new BigNumber(1.2), // The cEUR exchange rate is 1.2
        },
        origin: SendOrigin.AppSendFlow,
      })
    })

    it('should navigate to SendConfirmation screen defaulting to cUSD when amount is sent but token isnt', async () => {
      await expectSaga(handleSendPaymentData, { ...mockData, amount: 1 })
        .withState(createMockStore({}).getState())
        .provide([
          [matchers.call.fn(fetchExchangeRate), '1'],
          [select(localCurrencyToUsdSelector), '1'],
        ])
        .run()
      expect(navigate).toHaveBeenCalledWith(Screens.SendConfirmation, {
        transactionData: {
          recipient: { address: mockData.address },
          inputAmount: new BigNumber(1),
          amountIsInLocalCurrency: true,
          tokenAddress: mockCusdAddress,
          tokenAmount: new BigNumber(1),
        },
        origin: SendOrigin.AppSendFlow,
      })
    })

    it('should call handleSendPaymentData with parsed payment data', async () => {
      const data = {
        address: '0xf7f551752A78Ce650385B58364225e5ec18D96cB',
        displayName: 'Super 8',
        currencyCode: 'PHP' as LocalCurrencyCode,
        amount: '500',
        comment: '92a53156-c0f2-11ea-b3de-0242ac13000',
      }

      const deeplink = urlFromUriData(data)
      const parsed: UriData = {
        ...data,
        e164PhoneNumber: undefined,
        token: undefined,
      }
      await expectSaga(handlePaymentDeeplink, deeplink)
        .withState(createMockStore({}).getState())
        .provide([[matchers.call.fn(handleSendPaymentData), parsed]])
        .run()
    })

    describe('deeplinks for sending cUSD', () => {
      beforeEach(() => {
        jest.clearAllMocks()
      })

      it('should navigate to SendAmount screen when only address & currencyCode are given', async () => {
        await expectSaga(handleSendPaymentData, mockUriData[3])
          .withState(createMockStore({}).getState())
          .provide([
            [matchers.call.fn(fetchExchangeRate), '1'],
            [select(localCurrencyToUsdSelector), '1'],
          ])
          .run()
        expect(navigate).toHaveBeenCalledWith(Screens.SendAmount, {
          origin: SendOrigin.AppSendFlow,
          recipient: mockQRCodeRecipient,
        })
      })

      it('should navigate to SendConfirmation screen when address, currencyCode, & amount are given', async () => {
        const mockTransactionData: TransactionDataInput = {
          recipient: mockQRCodeRecipient,
          tokenAddress: mockCusdAddress,
          tokenAmount: new BigNumber('1'),
          inputAmount: new BigNumber('1'),
          amountIsInLocalCurrency: true,
        }

        await expectSaga(handleSendPaymentData, mockUriData[4])
          .withState(createMockStore({}).getState())
          .provide([
            [matchers.call.fn(fetchExchangeRate), '1'],
            [select(localCurrencyToUsdSelector), '1'],
          ])
          .run()
        expect(navigate).toHaveBeenCalledWith(Screens.SendConfirmation, {
          origin: SendOrigin.AppSendFlow,
          transactionData: mockTransactionData,
        })
      })

      it('should navigate to SendConfirmation screen when address, currencyCode, amount, & token = cUSD are given', async () => {
        const mockTransactionData: TransactionDataInput = {
          recipient: mockQRCodeRecipient,
          tokenAddress: mockCusdAddress,
          tokenAmount: new BigNumber('1'),
          inputAmount: new BigNumber('1'),
          amountIsInLocalCurrency: true,
        }

        await expectSaga(handleSendPaymentData, mockUriData[5])
          .withState(createMockStore({}).getState())
          .provide([
            [matchers.call.fn(fetchExchangeRate), '1'],
            [select(localCurrencyToUsdSelector), '1'],
          ])
          .run()
        expect(navigate).toHaveBeenCalledWith(Screens.SendConfirmation, {
          origin: SendOrigin.AppSendFlow,
          transactionData: mockTransactionData,
        })
      })
    })

    describe('deeplinks for withdrawing CELO', () => {
      beforeEach(() => {
        jest.clearAllMocks()
      })

      it('should navigate to SendConfirmation screen when address, token = CELO, currencyCode, and amount are given', async () => {
        await expectSaga(handleSendPaymentData, mockUriData[0])
          .withState(createMockStore({}).getState())
          .provide([
            [matchers.call.fn(fetchExchangeRate), '1'],
            [select(localCurrencyToUsdSelector), '1'],
          ])
          .run()
        expect(navigate).toHaveBeenCalledWith(Screens.SendConfirmation, {
          origin: SendOrigin.AppSendFlow,
          transactionData: {
            recipient: { address: mockUriData[0].address.toLowerCase() },
            tokenAddress: mockCeloAddress,
            tokenAmount: new BigNumber(mockUriData[0].amount!).times(5), // 5 is the CELO price.
            inputAmount: new BigNumber(mockUriData[0].amount!),
            amountIsInLocalCurrency: true,
          },
        })
      })

      it('should navigate to SendAmount screen when only address & token = CELO are given', async () => {
        await expectSaga(handleSendPaymentData, mockUriData[1])
          .withState(createMockStore({}).getState())
          .provide([
            [matchers.call.fn(fetchExchangeRate), '1'],
            [select(localCurrencyToUsdSelector), '1'],
          ])
          .run()
        expect(navigate).toHaveBeenCalledWith(Screens.SendAmount, {
          origin: SendOrigin.AppSendFlow,
          recipient: { address: mockUriData[1].address.toLowerCase() },
          forceTokenAddress: mockCeloAddress,
        })
      })

      it('should navigate to SendAmount screen when an unsupported token is given', async () => {
        await expectSaga(handleSendPaymentData, mockUriData[2])
          .withState(createMockStore({}).getState())
          .provide([
            [matchers.call.fn(fetchExchangeRate), '1'],
            [select(localCurrencyToUsdSelector), '1'],
          ])
          .run()
        expect(navigate).toHaveBeenCalledWith(Screens.SendAmount, {
          origin: SendOrigin.AppSendFlow,
          recipient: { address: mockUriData[2].address.toLowerCase() },
        })
      })
    })
  })
})
