// @ts-ignore
import { toBeDisabled } from '@testing-library/jest-native'
import { fireEvent, render, RenderAPI } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { ActivityIndicator } from 'react-native'
import * as RNLocalize from 'react-native-localize'
import { Provider } from 'react-redux'
import { ErrorDisplayType } from 'src/alert/reducer'
import { SendOrigin } from 'src/analytics/types'
import { DEFAULT_DAILY_PAYMENT_LIMIT_CUSD } from 'src/config'
import { FeeType } from 'src/fees/reducer'
import i18n from 'src/i18n'
import { AddressValidationType, E164NumberToAddressType } from 'src/identity/reducer'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import SendAmount from 'src/send/SendAmount'
import { Currency } from 'src/utils/currencies'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import {
  mockAccount2Invite,
  mockAccountInvite,
  mockCeurAddress,
  mockCusdAddress,
  mockE164NumberInvite,
  mockTransactionData,
} from 'test/values'

expect.extend({ toBeDisabled })

jest.mock('src/components/useShowOrHideAnimation')

const AMOUNT_ZERO = '0.00'
const AMOUNT_VALID = '4.93'
const AMOUNT_TOO_MUCH = '106.98'
const BALANCE_VALID = '23.85'
const REQUEST_OVER_LIMIT = (DEFAULT_DAILY_PAYMENT_LIMIT_CUSD * 2).toString()
const LARGE_BALANCE = (DEFAULT_DAILY_PAYMENT_LIMIT_CUSD * 10).toString()

const storeData = {
  tokens: {
    tokenBalances: {
      [mockCusdAddress]: {
        address: mockCusdAddress,
        symbol: 'cUSD',
        usdPrice: '1',
        balance: BALANCE_VALID,
      },
      [mockCeurAddress]: {
        address: mockCeurAddress,
        symbol: 'cEUR',
        usdPrice: '1.2',
        balance: '10',
      },
    },
  },

  fees: {
    estimates: {
      [mockCusdAddress]: {
        [FeeType.SEND]: {
          usdFee: '1',
        },
        [FeeType.INVITE]: {
          usdFee: '1',
        },
      },
    },
  },
}

const mockE164NumberToAddress: E164NumberToAddressType = {
  [mockE164NumberInvite]: [mockAccountInvite, mockAccount2Invite],
}

const mockTransactionData2 = {
  type: mockTransactionData.type,
  recipient: mockTransactionData.recipient,
  amount: new BigNumber('3.706766917293233083'),
  tokenAddress: mockCusdAddress,
  reason: '',
}

const mockScreenProps = (isOutgoingPaymentRequest?: boolean, forceTokenAddress?: string) =>
  getMockStackScreenProps(Screens.SendAmount, {
    recipient: mockTransactionData.recipient,
    isOutgoingPaymentRequest,
    origin: SendOrigin.AppSendFlow,
    forceTokenAddress,
  })

const enterAmount = (wrapper: RenderAPI, text: string) => {
  for (const letter of text) {
    const digitButton = wrapper.getByTestId(`digit${letter}`)
    fireEvent.press(digitButton)
  }
}

describe('SendAmount', () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('enter amount with balance', () => {
    const store = createMockStore(storeData)
    const getWrapper = () =>
      render(
        <Provider store={store}>
          <SendAmount {...mockScreenProps()} />
        </Provider>
      )

    it('updates the amount', () => {
      const wrapper = getWrapper()
      enterAmount(wrapper, AMOUNT_VALID)
      expect(wrapper.queryAllByText(AMOUNT_VALID)).toHaveLength(1)
    })

    it.skip('handles commas', () => {
      // TODO figure out how to mock RNLocalize.getNumberFormatSettings
      // from react-components properly
      ;(RNLocalize.getNumberFormatSettings as jest.Mock).mockReturnValue({
        decimalSeparator: ',',
      })
      const wrapper = getWrapper()
      enterAmount(wrapper, '4,0')
      expect(wrapper.queryAllByText('4,0')).toHaveLength(1)
      ;(RNLocalize.getNumberFormatSettings as jest.Mock).mockReturnValue({
        decimalSeparator: '.',
      })
    })

    it('handles decimals', () => {
      const wrapper = getWrapper()
      enterAmount(wrapper, '4.0')
      expect(wrapper.queryAllByText('4.0')).toHaveLength(1)
    })
  })

  describe('enter amount', () => {
    it('shows an error when tapping the send button with not enough balance', () => {
      const store = createMockStore(storeData)
      const wrapper = render(
        <Provider store={store}>
          <SendAmount {...mockScreenProps()} />
        </Provider>
      )
      enterAmount(wrapper, AMOUNT_TOO_MUCH)

      const reviewButton = wrapper.getByTestId('Review')
      expect(reviewButton).not.toBeDisabled()

      store.clearActions()
      fireEvent.press(reviewButton)
      expect(store.getActions()).toEqual([
        {
          action: null,
          alertType: 'error',
          buttonMessage: null,
          dismissAfter: null,
          displayMethod: ErrorDisplayType.BANNER,
          message: i18n.t('needMoreFundsToSend', {
            amountNeeded: '108.3152',
            currencySymbol: '$',
          }),
          title: null,
          type: 'ALERT/SHOW',
          underlyingError: 'needMoreFundsToSend',
        },
      ])
    })

    it('shows an error when tapping the send button with an amount over the limit', () => {
      const store = createMockStore({
        ...storeData,
        tokens: {
          tokenBalances: {
            [mockCusdAddress]: {
              address: mockCusdAddress,
              symbol: 'cUSD',
              usdPrice: '1',
              balance: LARGE_BALANCE,
            },
          },
        },
      })
      const wrapper = render(
        <Provider store={store}>
          <SendAmount {...mockScreenProps()} />
        </Provider>
      )
      enterAmount(wrapper, REQUEST_OVER_LIMIT)

      const sendButton = wrapper.getByTestId('Review')
      expect(sendButton).not.toBeDisabled()

      store.clearActions()
      fireEvent.press(sendButton)
      expect(store.getActions()).toEqual([
        {
          action: null,
          alertType: 'error',
          buttonMessage: null,
          dismissAfter: 5000,
          displayMethod: ErrorDisplayType.BANNER,
          message: i18n.t('paymentLimitReached', {
            currencySymbol: '$',
            dailyRemaining: '1330',
            dailyLimit: '1330',
            dailyRemainingcUSD: '1000.00',
            dailyLimitcUSD: 1000,
          }),
          title: null,
          type: 'ALERT/SHOW',
          underlyingError: 'paymentLimitReached',
        },
      ])
    })

    it('disables the send button with 0 as amount', () => {
      const store = createMockStore(storeData)
      const wrapper = render(
        <Provider store={store}>
          <SendAmount {...mockScreenProps()} />
        </Provider>
      )
      enterAmount(wrapper, AMOUNT_ZERO)

      const reviewButton = wrapper.getByTestId('Review')
      expect(reviewButton).toBeDisabled()
    })

    it("doesnt allow choosing the currency when there's only balance for one token", () => {
      const store = createMockStore({
        ...storeData,
        tokens: {
          tokenBalances: {
            [mockCusdAddress]: {
              address: mockCusdAddress,
              symbol: 'cUSD',
              usdPrice: '1',
              balance: '0',
            },
            [mockCeurAddress]: {
              address: mockCeurAddress,
              symbol: 'cEUR',
              usdPrice: '1.2',
              balance: '10.12',
            },
          },
        },
      })
      const { queryByTestId } = render(
        <Provider store={store}>
          <SendAmount {...mockScreenProps()} />
        </Provider>
      )

      expect(queryByTestId('HeaderCurrencyPicker')).toBeFalsy()
    })

    it("allows choosing the currency when there's balance for more than one token", () => {
      const store = createMockStore({
        ...storeData,
        stableToken: { balances: { [Currency.Dollar]: '10.56', [Currency.Euro]: '10.12' } },
      })
      const { queryByTestId } = render(
        <Provider store={store}>
          <SendAmount {...mockScreenProps()} />
        </Provider>
      )

      expect(queryByTestId('HeaderCurrencyPicker')).toBeTruthy()
    })

    it('displays the loading spinner when review button is pressed and verification status is unknown', () => {
      let store = createMockStore({
        identity: {
          e164NumberToAddress: {},
          secureSendPhoneNumberMapping: {},
        },
        ...storeData,
      })

      const tree = render(
        <Provider store={store}>
          <SendAmount {...mockScreenProps()} />
        </Provider>
      )

      enterAmount(tree, AMOUNT_VALID)
      fireEvent.press(tree.getByTestId('Review'))

      expect(tree.UNSAFE_getByType(ActivityIndicator)).toBeTruthy()

      store = createMockStore({
        identity: {
          e164NumberToAddress: mockE164NumberToAddress,
          secureSendPhoneNumberMapping: {
            [mockE164NumberInvite]: {
              addressValidationType: AddressValidationType.NONE,
            },
          },
        },
        ...storeData,
      })

      tree.rerender(
        <Provider store={store}>
          <SendAmount {...mockScreenProps()} />
        </Provider>
      )

      expect(navigate).toHaveBeenCalledWith(Screens.SendConfirmation, {
        origin: SendOrigin.AppSendFlow,
        isFromScan: false,
        transactionData: {
          inputAmount: new BigNumber(AMOUNT_VALID),
          amountIsInLocalCurrency: true,
          recipient: mockTransactionData.recipient,
          tokenAddress: mockCusdAddress,
        },
      })
    })
  })

  describe('Navigation', () => {
    it('navigates to ValidateRecipientIntro screen on Send click when a manual address check is needed', () => {
      const store = createMockStore({
        identity: {
          e164NumberToAddress: mockE164NumberToAddress,
          secureSendPhoneNumberMapping: {
            [mockE164NumberInvite]: {
              addressValidationType: AddressValidationType.FULL,
            },
          },
        },
        ...storeData,
      })

      const tree = render(
        <Provider store={store}>
          <SendAmount {...mockScreenProps()} />
        </Provider>
      )
      enterAmount(tree, AMOUNT_VALID)
      fireEvent.press(tree.getByTestId('Review'))
      expect(navigate).toHaveBeenCalledWith(Screens.ValidateRecipientIntro, {
        origin: SendOrigin.AppSendFlow,
        transactionData: {
          inputAmount: new BigNumber(AMOUNT_VALID),
          amountIsInLocalCurrency: true,
          recipient: mockTransactionData2.recipient,
          tokenAddress: mockCusdAddress,
        },
        addressValidationType: AddressValidationType.FULL,
      })
    })

    it('navigates to SendConfirmation screen on Send click when a manual address check is not needed', () => {
      const store = createMockStore({
        identity: {
          e164NumberToAddress: mockE164NumberToAddress,
          secureSendPhoneNumberMapping: {
            [mockE164NumberInvite]: {
              addressValidationType: AddressValidationType.NONE,
            },
          },
        },
        ...storeData,
        send: {
          lastUsedCurrency: Currency.Euro,
        },
      })

      const tree = render(
        <Provider store={store}>
          <SendAmount {...mockScreenProps(undefined, mockCeurAddress)} />
        </Provider>
      )
      enterAmount(tree, AMOUNT_VALID)
      fireEvent.press(tree.getByTestId('Review'))
      expect(navigate).toHaveBeenCalledWith(Screens.SendConfirmation, {
        origin: SendOrigin.AppSendFlow,
        isFromScan: false,
        transactionData: {
          inputAmount: new BigNumber(AMOUNT_VALID),
          amountIsInLocalCurrency: true,
          recipient: mockTransactionData2.recipient,
          tokenAddress: mockCeurAddress,
        },
      })
    })
  })
})
