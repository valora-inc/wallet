import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { select } from 'redux-saga-test-plan/matchers'
import { SendOrigin } from 'src/analytics/types'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { fetchExchangeRate } from 'src/localCurrency/saga'
import { usdToLocalCurrencyRateSelector } from 'src/localCurrency/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { UriData, urlFromUriData } from 'src/qrcode/schema'
import { RecipientType } from 'src/recipients/recipient'
import { TransactionDataInput } from 'src/send/SendAmount'
import { handlePaymentDeeplink, handleSendPaymentData } from 'src/send/utils'
import { createMockStore } from 'test/utils'
import {
  mockAccount2,
  mockCeloAddress,
  mockCeurAddress,
  mockCusdAddress,
  mockQRCodeRecipient,
  mockUriData,
} from 'test/values'

describe('send/utils', () => {
  describe('handlePaymentDeeplink', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    const mockData: UriData = {
      address: mockAccount2.toLowerCase(),
      currencyCode: 'USD' as LocalCurrencyCode,
      displayName: undefined,
      e164PhoneNumber: undefined,
      amount: undefined,
      token: undefined,
      comment: undefined,
    }

    it('should navigate to SendAmount screen when no amount nor token is sent', async () => {
      await expectSaga(handleSendPaymentData, mockData, false, undefined, undefined)
        .withState(createMockStore({}).getState())
        .provide([
          [matchers.call.fn(fetchExchangeRate), '1'],
          [select(usdToLocalCurrencyRateSelector), '1'],
        ])
        .run()
      expect(navigate).toHaveBeenCalledWith(
        Screens.SendAmount,
        expect.objectContaining({
          origin: SendOrigin.AppSendFlow,
          recipient: { address: mockData.address, recipientType: RecipientType.Address },
          isOutgoingPaymentRequest: undefined,
          forceTokenAddress: false,
        })
      )
    })

    it('should navigate to SendAmount screen when no amount is sent but token is', async () => {
      await expectSaga(
        handleSendPaymentData,
        { ...mockData, token: 'cEUR' },
        false,
        undefined,
        undefined
      )
        .withState(createMockStore({}).getState())
        .provide([
          [matchers.call.fn(fetchExchangeRate), '1'],
          [select(usdToLocalCurrencyRateSelector), '1'],
        ])
        .run()
      expect(navigate).toHaveBeenCalledWith(
        Screens.SendAmount,
        expect.objectContaining({
          origin: SendOrigin.AppSendFlow,
          recipient: { address: mockData.address, recipientType: RecipientType.Address },
          isOutgoingPaymentRequest: undefined,
          forceTokenAddress: true,
          defaultTokenOverride: mockCeurAddress,
        })
      )
    })

    it('should navigate to SendAmount screen when amount and token are sent but not recognized', async () => {
      await expectSaga(
        handleSendPaymentData,
        { ...mockData, amount: '1', token: 'NOT_A_TOKEN' },
        false,
        undefined,
        undefined
      )
        .withState(createMockStore({}).getState())
        .provide([
          [matchers.call.fn(fetchExchangeRate), '1'],
          [select(usdToLocalCurrencyRateSelector), '1'],
        ])
        .run()
      expect(navigate).toHaveBeenCalledWith(
        Screens.SendAmount,
        expect.objectContaining({
          origin: SendOrigin.AppSendFlow,
          recipient: { address: mockData.address, recipientType: RecipientType.Address },
          isOutgoingPaymentRequest: undefined,
          forceTokenAddress: false,
        })
      )
    })

    it('should throw an error when no local currency exchange rate is available', async () => {
      await expect(
        expectSaga(handleSendPaymentData, mockData, false, undefined, undefined)
          .withState(
            createMockStore({
              localCurrency: {
                usdToLocalRate: null,
              },
            }).getState()
          )
          .provide([
            [matchers.call.fn(fetchExchangeRate), '1'],
            [select(usdToLocalCurrencyRateSelector), '1'],
          ])
          .run()
      ).rejects.toThrow("Precondition failed: Can't send tokens from payment data")
      expect(navigate).not.toHaveBeenCalled()
    })

    it('should navigate to SendConfirmation screen when amount and token are sent', async () => {
      await expectSaga(
        handleSendPaymentData,
        { ...mockData, amount: '1', token: 'cEUR' },
        false,
        undefined,
        undefined
      )
        .withState(createMockStore({}).getState())
        .provide([
          [matchers.call.fn(fetchExchangeRate), '1'],
          [select(usdToLocalCurrencyRateSelector), '1'],
        ])
        .run()
      expect(navigate).toHaveBeenCalledWith(
        Screens.SendConfirmation,
        expect.objectContaining({
          transactionData: {
            recipient: { address: mockData.address, recipientType: RecipientType.Address },
            inputAmount: new BigNumber(1),
            amountIsInLocalCurrency: true,
            tokenAddress: mockCeurAddress,
            tokenAmount: new BigNumber(1.2), // The cEUR exchange rate is 1.2
          },
          origin: SendOrigin.AppSendFlow,
        })
      )
    })

    it('should navigate to SendConfirmation screen defaulting to cUSD when amount is sent but token isnt', async () => {
      await expectSaga(
        handleSendPaymentData,
        { ...mockData, amount: '1' },
        false,
        undefined,
        undefined
      )
        .withState(createMockStore({}).getState())
        .provide([
          [matchers.call.fn(fetchExchangeRate), '1'],
          [select(usdToLocalCurrencyRateSelector), '1'],
        ])
        .run()
      expect(navigate).toHaveBeenCalledWith(
        Screens.SendConfirmation,
        expect.objectContaining({
          transactionData: {
            recipient: { address: mockData.address, recipientType: RecipientType.Address },
            inputAmount: new BigNumber(1),
            amountIsInLocalCurrency: true,
            tokenAddress: mockCusdAddress,
            tokenAmount: new BigNumber(1),
          },
          origin: SendOrigin.AppSendFlow,
        })
      )
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
        await expectSaga(handleSendPaymentData, mockUriData[3], false, undefined, undefined)
          .withState(createMockStore({}).getState())
          .provide([
            [matchers.call.fn(fetchExchangeRate), '1'],
            [select(usdToLocalCurrencyRateSelector), '1'],
          ])
          .run()
        expect(navigate).toHaveBeenCalledWith(
          Screens.SendAmount,
          expect.objectContaining({
            origin: SendOrigin.AppSendFlow,
            recipient: mockQRCodeRecipient,
            forceTokenAddress: false,
          })
        )
      })

      it('should navigate to SendConfirmation screen when address, currencyCode, & amount are given', async () => {
        const mockTransactionData: TransactionDataInput = {
          recipient: mockQRCodeRecipient,
          tokenAddress: mockCusdAddress,
          tokenAmount: new BigNumber('1'),
          inputAmount: new BigNumber('1'),
          amountIsInLocalCurrency: true,
        }

        await expectSaga(handleSendPaymentData, mockUriData[4], false, undefined, undefined)
          .withState(createMockStore({}).getState())
          .provide([
            [matchers.call.fn(fetchExchangeRate), '1'],
            [select(usdToLocalCurrencyRateSelector), '1'],
          ])
          .run()
        expect(navigate).toHaveBeenCalledWith(
          Screens.SendConfirmation,
          expect.objectContaining({
            origin: SendOrigin.AppSendFlow,
            transactionData: mockTransactionData,
          })
        )
      })

      it('should navigate to SendConfirmation screen when address, currencyCode, amount, & token = cUSD are given', async () => {
        const mockTransactionData: TransactionDataInput = {
          recipient: mockQRCodeRecipient,
          tokenAddress: mockCusdAddress,
          tokenAmount: new BigNumber('1'),
          inputAmount: new BigNumber('1'),
          amountIsInLocalCurrency: true,
        }

        await expectSaga(handleSendPaymentData, mockUriData[5], false, undefined, undefined)
          .withState(createMockStore({}).getState())
          .provide([
            [matchers.call.fn(fetchExchangeRate), '1'],
            [select(usdToLocalCurrencyRateSelector), '1'],
          ])
          .run()
        expect(navigate).toHaveBeenCalledWith(
          Screens.SendConfirmation,
          expect.objectContaining({
            origin: SendOrigin.AppSendFlow,
            transactionData: mockTransactionData,
          })
        )
      })
    })

    describe('deeplinks for withdrawing CELO', () => {
      beforeEach(() => {
        jest.clearAllMocks()
      })

      it('should navigate to SendConfirmation screen when address, token = CELO, currencyCode, and amount are given', async () => {
        await expectSaga(handleSendPaymentData, mockUriData[0], false, undefined, undefined)
          .withState(createMockStore({}).getState())
          .provide([
            [matchers.call.fn(fetchExchangeRate), '1'],
            [select(usdToLocalCurrencyRateSelector), '1'],
          ])
          .run()
        expect(navigate).toHaveBeenCalledWith(
          Screens.SendConfirmation,
          expect.objectContaining({
            origin: SendOrigin.AppSendFlow,
            transactionData: {
              recipient: {
                address: mockUriData[0].address.toLowerCase(),
                recipientType: RecipientType.Address,
              },
              tokenAddress: mockCeloAddress,
              tokenAmount: new BigNumber(mockUriData[0].amount!).times(5), // 5 is the CELO price.
              inputAmount: new BigNumber(mockUriData[0].amount!),
              amountIsInLocalCurrency: true,
            },
          })
        )
      })

      it('should navigate to SendAmount screen when only address & token = CELO are given', async () => {
        await expectSaga(handleSendPaymentData, mockUriData[1], false, undefined, undefined)
          .withState(createMockStore({}).getState())
          .provide([
            [matchers.call.fn(fetchExchangeRate), '1'],
            [select(usdToLocalCurrencyRateSelector), '1'],
          ])
          .run()
        expect(navigate).toHaveBeenCalledWith(
          Screens.SendAmount,
          expect.objectContaining({
            origin: SendOrigin.AppSendFlow,
            recipient: {
              address: mockUriData[1].address.toLowerCase(),
              recipientType: RecipientType.Address,
            },
            forceTokenAddress: true,
            defaultTokenOverride: mockCeloAddress,
          })
        )
      })

      it('should navigate to SendAmount screen when an unsupported token is given', async () => {
        await expectSaga(handleSendPaymentData, mockUriData[2], false, undefined, undefined)
          .withState(createMockStore({}).getState())
          .provide([
            [matchers.call.fn(fetchExchangeRate), '1'],
            [select(usdToLocalCurrencyRateSelector), '1'],
          ])
          .run()
        expect(navigate).toHaveBeenCalledWith(
          Screens.SendAmount,
          expect.objectContaining({
            origin: SendOrigin.AppSendFlow,
            recipient: {
              address: mockUriData[2].address.toLowerCase(),
              recipientType: RecipientType.Address,
            },
            forceTokenAddress: false,
          })
        )
      })
    })
  })
})
