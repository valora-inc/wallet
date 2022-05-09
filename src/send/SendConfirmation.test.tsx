import { StackScreenProps } from '@react-navigation/stack'
import { fireEvent, render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Provider } from 'react-redux'
import { SendOrigin } from 'src/analytics/types'
import { FeeType } from 'src/fees/reducer'
import { AddressValidationType, E164NumberToAddressType } from 'src/identity/reducer'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { RootState } from 'src/redux/reducers'
import { sendPaymentOrInvite } from 'src/send/actions'
import SendConfirmation from 'src/send/SendConfirmation'
import { getGasPrice } from 'src/web3/gas'
import {
  createMockStore,
  flushMicrotasksQueue,
  getElementText,
  getMockStackScreenProps,
  RecursivePartial,
} from 'test/utils'
import {
  emptyFees,
  mockAccount,
  mockAccount2,
  mockAccount2Invite,
  mockAccountInvite,
  mockCeloAddress,
  mockCeurAddress,
  mockCusdAddress,
  mockE164Number,
  mockFeeInfo,
  mockGasPrice,
  mockInvitableRecipient,
  mockTestTokenAddress,
  mockTokenInviteTransactionData,
  mockTokenTransactionData,
} from 'test/values'

const mockDekFeeGas = new BigNumber(100000)

jest.mock('src/web3/gas')
const mockGetGasPrice = getGasPrice as jest.Mock

jest.mock('src/web3/dataEncryptionKey', () => ({
  getRegisterDekTxGas: () => mockDekFeeGas,
}))

const mockScreenProps = getMockStackScreenProps(Screens.SendConfirmation, {
  transactionData: mockTokenTransactionData,
  origin: SendOrigin.AppSendFlow,
})

const mockInviteScreenProps = getMockStackScreenProps(Screens.SendConfirmation, {
  transactionData: mockTokenInviteTransactionData,
  origin: SendOrigin.AppSendFlow,
})

type ScreenProps = StackScreenProps<
  StackParamList,
  Screens.SendConfirmation | Screens.SendConfirmationModal
>

const mockFeeEstimates = {
  ...emptyFees,
  [FeeType.SEND]: {
    usdFee: '0.02',
    lastUpdated: 500,
    loading: false,
    error: false,
    feeInfo: mockFeeInfo,
  },
  [FeeType.INVITE]: {
    usdFee: '0.04',
    lastUpdated: 500,
    loading: false,
    error: false,
    feeInfo: mockFeeInfo,
  },
}

describe('SendConfirmation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetGasPrice.mockImplementation(() => mockGasPrice)
  })

  function renderScreen(
    storeOverrides: RecursivePartial<RootState> = {},
    screenProps?: ScreenProps
  ) {
    const store = createMockStore({
      tokens: {
        tokenBalances: {
          [mockCusdAddress]: {
            address: mockCusdAddress,
            symbol: 'cUSD',
            balance: '200',
            usdPrice: '1',
            isCoreToken: true,
            priceFetchedAt: Date.now(),
          },
          [mockCeurAddress]: {
            address: mockCeurAddress,
            symbol: 'cEUR',
            balance: '100',
            usdPrice: '1.2',
            isCoreToken: true,
            priceFetchedAt: Date.now(),
          },
          [mockCeloAddress]: {
            address: mockCeloAddress,
            symbol: 'CELO',
            balance: '20',
            usdPrice: '5',
            isCoreToken: true,
            priceFetchedAt: Date.now(),
          },
          [mockTestTokenAddress]: {
            address: mockTestTokenAddress,
            symbol: 'TT',
            balance: '10',
            usdPrice: '0.1234',
            priceFetchedAt: Date.now(),
          },
        },
      },
      fees: {
        estimates: {
          [mockCusdAddress]: mockFeeEstimates,
          [mockCeurAddress]: mockFeeEstimates,
        },
      },
      ...storeOverrides,
    })

    const tree = render(
      <Provider store={store}>
        <SendConfirmation {...(screenProps ? screenProps : mockScreenProps)} />
      </Provider>
    )

    return {
      store,
      ...tree,
    }
  }

  it('renders correctly', async () => {
    const tree = renderScreen()
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly for send payment confirmation with cUSD fees', async () => {
    const { getByText, getByTestId } = renderScreen()

    fireEvent.press(getByText('feeEstimate'))

    jest.runAllTimers()
    await flushMicrotasksQueue()

    const feeComponent = getByTestId('feeDrawer/SendConfirmation/totalFee/value')
    expect(getElementText(feeComponent)).toEqual('₱0.0266')

    // Subtotal is $1.33, which is added the fee amount.
    const totalComponent = getByTestId('TotalLineItem/Total')
    expect(getElementText(totalComponent)).toEqual('₱1.36')
  })

  it('renders correctly for send payment confirmation with cEUR fees', async () => {
    // Note: Higher balance is picked to pay for fees.
    const { getByText, getByTestId } = renderScreen({
      tokens: {
        tokenBalances: {
          [mockCusdAddress]: {
            address: mockCusdAddress,
            symbol: 'cUSD',
            balance: '2',
            usdPrice: '1',
            isCoreToken: true,
            priceFetchedAt: Date.now(),
          },
          [mockCeurAddress]: {
            address: mockCeurAddress,
            symbol: 'cEUR',
            balance: '100',
            usdPrice: '1.2',
            isCoreToken: true,
            priceFetchedAt: Date.now(),
          },
        },
      },
    })

    fireEvent.press(getByText('feeEstimate'))

    jest.runAllTimers()
    await flushMicrotasksQueue()

    const feeComponent = getByTestId('feeDrawer/SendConfirmation/totalFee/value')
    expect(getElementText(feeComponent)).toEqual('₱0.0266')

    // Subtotal is $1.33, which is added to the fee amount.
    const totalComponent = getByTestId('TotalLineItem/Total')
    expect(getElementText(totalComponent)).toEqual('₱1.36')
  })

  it('shows --- for fee when fee estimate fails', async () => {
    const { queryByTestId, getByText } = renderScreen({
      fees: {
        estimates: {
          [mockCusdAddress]: {
            [FeeType.SEND]: {
              error: true,
            },
          },
        },
      },
    })

    const feeComponent = queryByTestId('feeDrawer/SendConfirmation/totalFee/value')
    expect(feeComponent).toBeFalsy()
    expect(getByText('---')).toBeTruthy()
  })

  it('shows loading for fee while fee estimate loads', async () => {
    const { queryByTestId, getByTestId } = renderScreen({
      fees: {
        estimates: {
          [mockCusdAddress]: {
            [FeeType.SEND]: {
              loading: true,
            },
          },
        },
      },
    })

    const feeComponent = queryByTestId('feeDrawer/SendConfirmation/totalFee/value')
    expect(feeComponent).toBeFalsy()
    expect(getByTestId('LineItemLoading')).toBeTruthy()
  })

  it('renders correctly when there are multiple user addresses (should show edit button)', async () => {
    const mockE164NumberToAddress: E164NumberToAddressType = {
      [mockE164Number]: [mockAccountInvite, mockAccount2Invite],
    }

    const { getByTestId } = renderScreen(
      {
        identity: {
          e164NumberToAddress: mockE164NumberToAddress,
          secureSendPhoneNumberMapping: {
            [mockE164Number]: {
              addressValidationType: AddressValidationType.FULL,
              address: mockAccount2Invite,
            },
          },
        },
      },
      mockInviteScreenProps
    )

    expect(getByTestId('accountEditButton')).toBeTruthy()
  })

  it('updates the comment/reason', () => {
    const { getByTestId, queryAllByDisplayValue } = renderScreen({
      fees: {
        estimates: {
          [mockCusdAddress]: {
            [FeeType.SEND]: {
              usdFee: '1',
            },
          },
        },
      },
    })

    const input = getByTestId('commentInput/send')
    const comment = 'A comment!'
    fireEvent.changeText(input, comment)
    expect(queryAllByDisplayValue(comment)).toHaveLength(1)
  })

  it('doesnt show the comment for CELO', () => {
    const { queryByTestId } = renderScreen(
      {},
      getMockStackScreenProps(Screens.SendConfirmation, {
        transactionData: {
          ...mockTokenTransactionData,
          tokenAddress: mockCeloAddress,
        },
        origin: SendOrigin.AppSendFlow,
      })
    )

    expect(queryByTestId('commentInput/send')).toBeFalsy()
  })

  it('doesnt show the comment for non core tokens', () => {
    const { queryByTestId } = renderScreen(
      {},
      getMockStackScreenProps(Screens.SendConfirmation, {
        transactionData: {
          ...mockTokenTransactionData,
          tokenAddress: mockTestTokenAddress,
        },
        origin: SendOrigin.AppSendFlow,
      })
    )

    expect(queryByTestId('commentInput/send')).toBeFalsy()
  })

  it('doesnt show the comment for invites', () => {
    const { queryByTestId } = renderScreen(
      {},
      getMockStackScreenProps(Screens.SendConfirmation, {
        transactionData: {
          ...mockTokenInviteTransactionData,
          recipient: {
            ...mockInvitableRecipient,
            e164PhoneNumber: '+14155550001',
          },
        },
        origin: SendOrigin.AppSendFlow,
      })
    )
    expect(queryByTestId('commentInput/send')).toBeFalsy()
  })

  it('navigates to ValidateRecipientIntro when "edit" button is pressed', async () => {
    const mockE164NumberToAddress: E164NumberToAddressType = {
      [mockE164Number]: [mockAccountInvite, mockAccount2Invite],
    }
    const mockAddressValidationType = AddressValidationType.PARTIAL

    const { getByTestId } = renderScreen(
      {
        identity: {
          e164NumberToAddress: mockE164NumberToAddress,
          secureSendPhoneNumberMapping: {
            [mockE164Number]: {
              addressValidationType: mockAddressValidationType,
              address: mockAccount2Invite,
            },
          },
        },
      },
      mockInviteScreenProps
    )

    fireEvent.press(getByTestId('accountEditButton'))
    expect(navigate).toHaveBeenCalledWith(Screens.ValidateRecipientIntro, {
      origin: SendOrigin.AppSendFlow,
      transactionData: mockTokenInviteTransactionData,
      addressValidationType: mockAddressValidationType,
    })
  })

  it('does nothing when trying to press "edit" when user has not gone through Secure Send', async () => {
    const mockE164NumberToAddress: E164NumberToAddressType = {
      [mockE164Number]: [mockAccount2Invite],
    }

    const { queryByTestId } = renderScreen({
      identity: {
        e164NumberToAddress: mockE164NumberToAddress,
        secureSendPhoneNumberMapping: {
          [mockE164Number]: {
            addressValidationType: AddressValidationType.NONE,
            address: undefined,
          },
        },
      },
    })

    expect(queryByTestId('accountEditButton')).toBeNull()
  })

  it('renders correct modal for invitations', async () => {
    const { getByTestId, queryAllByTestId } = renderScreen(
      { identity: { e164NumberToAddress: {} } },
      mockInviteScreenProps
    )

    expect(queryAllByTestId('InviteAndSendModal')[0].props.visible).toBe(false)

    fireEvent.press(getByTestId('ConfirmButton'))

    expect(queryAllByTestId('InviteAndSendModal')[0].props.visible).toBe(true)
  })

  it('dispatches an action when the confirm button is pressed', async () => {
    const { store, getByTestId } = renderScreen({ web3: { isDekRegistered: true } })

    expect(store.getActions().length).toEqual(0)

    fireEvent.press(getByTestId('ConfirmButton'))

    const { inputAmount, tokenAddress, recipient } = mockTokenTransactionData
    expect(store.getActions()).toEqual(
      expect.arrayContaining([
        sendPaymentOrInvite(
          inputAmount,
          tokenAddress,
          inputAmount,
          '',
          recipient,
          mockFeeInfo,
          false
        ),
      ])
    )
  })

  it('dispatches the send action with the right address when going through Secure Send', async () => {
    const { store, getByTestId } = renderScreen(
      {
        identity: {
          e164NumberToAddress: {
            [mockE164Number]: [mockAccount, mockAccount2],
          },
          secureSendPhoneNumberMapping: {
            [mockE164Number]: {
              address: mockAccount2,
              addressValidationType: AddressValidationType.FULL,
            },
          },
        },
        web3: { isDekRegistered: true },
      },
      getMockStackScreenProps(Screens.SendConfirmation, {
        transactionData: {
          ...mockTokenTransactionData,
          recipient: { e164PhoneNumber: mockE164Number },
        },
        origin: SendOrigin.AppSendFlow,
      })
    )

    expect(store.getActions().length).toEqual(0)

    fireEvent.press(getByTestId('ConfirmButton'))

    const { inputAmount, tokenAddress } = mockTokenTransactionData
    expect(store.getActions()).toEqual(
      expect.arrayContaining([
        sendPaymentOrInvite(
          inputAmount,
          tokenAddress,
          inputAmount,
          '',
          { address: mockAccount2, e164PhoneNumber: mockE164Number },
          mockFeeInfo,
          false
        ),
      ])
    )
  })

  it('dispatches fee estimation if not already done', async () => {
    const { store } = renderScreen({ fees: { estimates: emptyFees } })

    expect(store.getActions()).toMatchInlineSnapshot(`
      Array [
        Object {
          "payload": Object {
            "feeType": "send",
            "tokenAddress": "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
          },
          "type": "FEES/ESTIMATE_FEE",
        },
        Object {
          "payload": Object {
            "feeType": "register-dek",
            "tokenAddress": "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1",
          },
          "type": "FEES/ESTIMATE_FEE",
        },
      ]
    `)
  })
})
