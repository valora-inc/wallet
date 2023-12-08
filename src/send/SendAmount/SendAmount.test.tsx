import { fireEvent, render, RenderAPI } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Share } from 'react-native'
import * as RNLocalize from 'react-native-localize'
import { Provider } from 'react-redux'
import { ErrorDisplayType } from 'src/alert/reducer'
import { SendOrigin } from 'src/analytics/types'
import { FeeType } from 'src/fees/reducer'
import i18n from 'src/i18n'
import { AddressValidationType, E164NumberToAddressType } from 'src/identity/reducer'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import SendAmount from 'src/send/SendAmount'
import { NetworkId } from 'src/transactions/types'
import { createMockStore, getElementText, getMockStackScreenProps } from 'test/utils'
import {
  mockAccount2Invite,
  mockAccountInvite,
  mockCeurAddress,
  mockCeurTokenId,
  mockCusdAddress,
  mockCusdTokenId,
  mockE164NumberInvite,
  mockTestTokenAddress,
  mockTestTokenTokenId,
  mockTransactionData,
  mockTransactionDataLegacy,
} from 'test/values'

jest.mock('src/web3/networkConfig', () => {
  const originalModule = jest.requireActual('src/web3/networkConfig')
  return {
    ...originalModule,
    __esModule: true,
    default: {
      ...originalModule.default,
      defaultNetworkId: 'celo-alfajores',
    },
  }
})

const AMOUNT_ZERO = '0.00'
const AMOUNT_VALID = '4.93'
const AMOUNT_TOO_MUCH = '106.98'
const BALANCE_VALID = '23.85'

const storeData = {
  tokens: {
    tokenBalances: {
      [mockCusdTokenId]: {
        address: mockCusdAddress,
        tokenId: mockCusdTokenId,
        networkId: NetworkId['celo-alfajores'],
        symbol: 'cUSD',
        priceUsd: '1',
        balance: BALANCE_VALID,
        isFeeCurrency: true,
        priceFetchedAt: Date.now(),
      },
      [mockCeurTokenId]: {
        address: mockCeurAddress,
        tokenId: mockCeurTokenId,
        networkId: NetworkId['celo-alfajores'],
        symbol: 'cEUR',
        priceUsd: '1.2',
        balance: '10',
        isFeeCurrency: true,
        priceFetchedAt: Date.now(),
      },
      [mockTestTokenTokenId]: {
        address: mockTestTokenAddress,
        tokenId: mockTestTokenTokenId,
        networkId: NetworkId['celo-alfajores'],
        symbol: 'TT',
        balance: '50',
      },
    },
  },

  fees: {
    estimates: {
      [mockCusdAddress]: {
        [FeeType.SEND]: {
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
  type: mockTransactionDataLegacy.type,
  recipient: mockTransactionDataLegacy.recipient,
  amount: new BigNumber('3.706766917293233083'), // AMOUNT_VALID / 1.33 (default local currency exchange rate) / 1 (priceUsd of cUSD)
  tokenAddress: mockCusdAddress,
  reason: '',
}

const mockScreenProps = ({
  defaultTokenIdOverride,
  forceTokenId,
}: {
  defaultTokenIdOverride?: string
  forceTokenId?: boolean
}) =>
  getMockStackScreenProps(Screens.SendAmount, {
    isFromScan: false,
    defaultTokenIdOverride,
    recipient: mockTransactionData.recipient,
    origin: SendOrigin.AppSendFlow,
    forceTokenId,
  })

const enterAmount = (wrapper: RenderAPI, text: string) => {
  for (const letter of text) {
    const digitButton = wrapper.getByTestId(`digit${letter}`)
    fireEvent.press(digitButton)
  }
}

Share.share = jest.fn()

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
          <SendAmount {...mockScreenProps({})} />
        </Provider>
      )

    it('updates the amount', () => {
      const wrapper = getWrapper()
      enterAmount(wrapper, AMOUNT_VALID)
      expect(wrapper.queryAllByText(AMOUNT_VALID)).toHaveLength(1)
    })

    // eslint-disable-next-line jest/no-disabled-tests
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
          <SendAmount {...mockScreenProps({})} />
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
            currencySymbol: '₱',
          }),
          title: null,
          type: 'ALERT/SHOW',
          underlyingError: 'needMoreFundsToSend',
        },
      ])
    })

    it('max button sets the max accounting for fees', () => {
      const store = createMockStore({
        ...storeData,
        localCurrency: {
          preferredCurrencyCode: LocalCurrencyCode.USD,
          fetchedCurrencyCode: LocalCurrencyCode.USD,
          usdToLocalRate: '1',
        },
      })
      const { getByTestId } = render(
        <Provider store={store}>
          <SendAmount {...mockScreenProps({})} />
        </Provider>
      )

      const maxButton = getByTestId('MaxButton')
      fireEvent.press(maxButton)

      // The value expected here is |BALANCE_VALID| - the send fee (1 cUSD)
      expect(getElementText(getByTestId('InputAmount'))).toEqual('22.85')
    })

    it('max button maxes out the token value only and displays the correct number of decimal places', () => {
      const store = createMockStore({
        ...storeData,
        localCurrency: {
          preferredCurrencyCode: LocalCurrencyCode.USD,
          fetchedCurrencyCode: LocalCurrencyCode.USD,
          usdToLocalRate: '1',
        },
        tokens: {
          tokenBalances: {
            [mockCusdTokenId]: {
              address: mockCusdAddress,
              tokenId: mockCusdTokenId,
              networkId: NetworkId['celo-alfajores'],
              symbol: 'cUSD',
              priceUsd: '1',
              balance: '22.85789012',
              isFeeCurrency: true,
              priceFetchedAt: Date.now(),
            },
          },
        },
      })
      const { getByTestId } = render(
        <Provider store={store}>
          <SendAmount {...mockScreenProps({})} />
        </Provider>
      )

      fireEvent.press(getByTestId('MaxButton'))

      // The value expected here is |balance| - the send fee (1 cUSD)
      expect(getElementText(getByTestId('InputAmountContainer'))).toEqual('$21.85')
      expect(getElementText(getByTestId('SecondaryAmountContainer'))).toEqual('21.86cUSD')

      fireEvent.press(getByTestId('SwapInput'))
      fireEvent.press(getByTestId('MaxButton'))

      // The value expected here is |balance| - the send fee (1 cUSD)
      expect(getElementText(getByTestId('InputAmountContainer'))).toEqual('21.85789012cUSD')
      expect(getElementText(getByTestId('SecondaryAmountContainer'))).toEqual('$21.86')
    })

    it('disables the send button with 0 as amount', () => {
      const store = createMockStore(storeData)
      const wrapper = render(
        <Provider store={store}>
          <SendAmount {...mockScreenProps({})} />
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
            [mockCusdTokenId]: {
              address: mockCusdAddress,
              tokenId: mockCusdTokenId,
              networkId: NetworkId['celo-alfajores'],
              symbol: 'cUSD',
              priceUsd: '1',
              balance: '0',
              priceFetchedAt: Date.now(),
            },
            [mockCeurTokenId]: {
              address: mockCeurAddress,
              tokenId: mockCeurTokenId,
              networkId: NetworkId['celo-alfajores'],
              symbol: 'cEUR',
              priceUsd: '1.2',
              balance: '10.12',
              priceFetchedAt: Date.now(),
            },
          },
        },
      })
      const { queryByText } = render(
        <Provider store={store}>
          <SendAmount {...mockScreenProps({})} />
        </Provider>
      )

      expect(queryByText('send')).toBeFalsy()
    })

    it("allows choosing the currency when there's balance for more than one token", () => {
      const store = createMockStore(storeData)
      const { getByText } = render(
        <Provider store={store}>
          <SendAmount {...mockScreenProps({})} />
        </Provider>
      )

      expect(getByText('send')).toBeTruthy()
    })

    it("Doesn't allow inputting in local currency if token has no usd price", () => {
      const store = createMockStore(storeData)
      const wrapper = render(
        <Provider store={store}>
          <SendAmount
            {...mockScreenProps({
              defaultTokenIdOverride: mockTestTokenTokenId,
              forceTokenId: true,
            })}
          />
        </Provider>
      )
      enterAmount(wrapper, AMOUNT_VALID)

      expect(wrapper.getByTestId('MaxButton')).toBeTruthy()
      expect(wrapper.queryByTestId('SwapInput')).toBeFalsy()

      const reviewButton = wrapper.getByTestId('Review')
      expect(reviewButton).toBeEnabled()
      fireEvent.press(wrapper.getByTestId('Review'))

      expect(navigate).toHaveBeenCalledWith(Screens.SendConfirmation, {
        origin: SendOrigin.AppSendFlow,
        isFromScan: false,
        transactionData: {
          inputAmount: new BigNumber(AMOUNT_VALID),
          amountIsInLocalCurrency: false,
          recipient: mockTransactionData.recipient,
          tokenAddress: mockTestTokenAddress,
          tokenAmount: new BigNumber(AMOUNT_VALID),
          tokenId: mockTestTokenTokenId,
        },
      })
    })

    it('clears the entered amount when changing the token', () => {
      const store = createMockStore(storeData)
      const wrapper = render(
        <Provider store={store}>
          <SendAmount {...mockScreenProps({})} />
        </Provider>
      )

      enterAmount(wrapper, '10')
      expect(getElementText(wrapper.getByTestId('InputAmountContainer'))).toEqual('₱10')
      expect(getElementText(wrapper.getByTestId('SecondaryAmountContainer'))).toEqual('7.52cUSD')

      fireEvent.press(wrapper.getByTestId('TokenPickerSelector'))
      fireEvent.press(wrapper.getByTestId('cEURTouchable'))

      expect(getElementText(wrapper.getByTestId('InputAmountContainer'))).toEqual('₱0')
      expect(getElementText(wrapper.getByTestId('SecondaryAmountContainer'))).toEqual('0.00cEUR')
    })

    it('clears the entered amount on press of the swap button', () => {
      const store = createMockStore(storeData)
      const wrapper = render(
        <Provider store={store}>
          <SendAmount {...mockScreenProps({})} />
        </Provider>
      )

      enterAmount(wrapper, '10')
      expect(getElementText(wrapper.getByTestId('InputAmountContainer'))).toEqual('₱10')
      expect(getElementText(wrapper.getByTestId('SecondaryAmountContainer'))).toEqual('7.52cUSD')

      fireEvent.press(wrapper.getByTestId('SwapInput'))

      expect(getElementText(wrapper.getByTestId('InputAmountContainer'))).toEqual('0cUSD')
      expect(getElementText(wrapper.getByTestId('SecondaryAmountContainer'))).toEqual('₱0.00')
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
          <SendAmount {...mockScreenProps({})} />
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
          tokenAmount: mockTransactionData2.amount,
          tokenId: mockCusdTokenId,
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
      })

      const tree = render(
        <Provider store={store}>
          <SendAmount
            {...mockScreenProps({
              forceTokenId: true,
              defaultTokenIdOverride: mockCeurTokenId,
            })}
          />
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
          tokenId: mockCeurTokenId,
          tokenAmount: new BigNumber('3.088972431077694236'), // inputAmount converted to token value: AMOUNT_VALID / 1.33 (default local currency exchange rate) / 1.2 (priceUsd of cEUR)
        },
      })
    })
  })
})
