import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { act, fireEvent, render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Provider } from 'react-redux'
import { SendOrigin } from 'src/analytics/types'
import { FeeType } from 'src/fees/reducer'
import { AddressValidationType, E164NumberToAddressType } from 'src/identity/reducer'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { RecipientType } from 'src/recipients/recipient'
import { RootState } from 'src/redux/reducers'
import { sendPayment } from 'src/send/actions'
import SendConfirmation from 'src/send/SendConfirmation'
import { getGasPrice } from 'src/web3/gas'
import {
  createMockStore,
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
  mockCeloTokenId,
  mockCeurAddress,
  mockCeurTokenId,
  mockCusdAddress,
  mockCusdTokenId,
  mockE164Number,
  mockFeeInfo,
  mockGasPrice,
  mockTestTokenAddress,
  mockTestTokenTokenId,
  mockTokenInviteTransactionData,
  mockTokenTransactionData,
} from 'test/values'
import { NetworkId } from 'src/transactions/types'

const mockDekFeeGas = new BigNumber(100000)

jest.mock('src/web3/gas')
const mockGetGasPrice = getGasPrice as jest.Mock

jest.mock('src/web3/dataEncryptionKey', () => ({
  getRegisterDekTxGas: () => mockDekFeeGas,
}))

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

const mockScreenProps = getMockStackScreenProps(Screens.SendConfirmation, {
  transactionData: {
    ...mockTokenTransactionData,
  },
  origin: SendOrigin.AppSendFlow,
  isFromScan: false,
})

const mockInviteScreenProps = getMockStackScreenProps(Screens.SendConfirmation, {
  transactionData: mockTokenInviteTransactionData,
  origin: SendOrigin.AppSendFlow,
  isFromScan: false,
})

type ScreenProps = NativeStackScreenProps<
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
          [mockCusdTokenId]: {
            address: mockCusdAddress,
            tokenId: mockCusdTokenId,
            networkId: NetworkId['celo-alfajores'],
            symbol: 'cUSD',
            balance: '200',
            priceUsd: '1',
            isCoreToken: true,
            priceFetchedAt: Date.now(),
          },
          [mockCeurTokenId]: {
            address: mockCeurAddress,
            tokenId: mockCeurTokenId,
            networkId: NetworkId['celo-alfajores'],
            symbol: 'cEUR',
            balance: '100',
            priceUsd: '1.2',
            isCoreToken: true,
            priceFetchedAt: Date.now(),
          },
          [mockCeloTokenId]: {
            address: mockCeloAddress,
            tokenId: mockCeloTokenId,
            networkId: NetworkId['celo-alfajores'],
            symbol: 'CELO',
            balance: '20',
            priceUsd: '5',
            isCoreToken: true,
            priceFetchedAt: Date.now(),
          },
          [mockTestTokenTokenId]: {
            address: mockTestTokenAddress,
            tokenId: mockTestTokenTokenId,
            networkId: NetworkId['celo-alfajores'],
            symbol: 'TT',
            balance: '10',
            priceUsd: '0.1234',
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

    await act(() => {
      jest.runAllTimers()
    })

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
          [mockCusdTokenId]: {
            address: mockCusdAddress,
            tokenId: mockCusdTokenId,
            networkId: NetworkId['celo-alfajores'],
            symbol: 'cUSD',
            balance: '2',
            priceUsd: '1',
            isCoreToken: true,
            priceFetchedAt: Date.now(),
          },
          [mockCeurTokenId]: {
            address: mockCeurAddress,
            tokenId: mockCeurTokenId,
            networkId: NetworkId['celo-alfajores'],
            symbol: 'cEUR',
            balance: '100',
            priceUsd: '1.2',
            isCoreToken: true,
            priceFetchedAt: Date.now(),
          },
        },
      },
    })

    fireEvent.press(getByText('feeEstimate'))

    await act(() => {
      jest.runAllTimers()
    })

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
        isFromScan: false,
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
        isFromScan: false,
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

  it('dispatches an action when the confirm button is pressed', async () => {
    const { store, getByTestId } = renderScreen({ web3: { isDekRegistered: true } })

    expect(store.getActions().length).toEqual(0)

    fireEvent.press(getByTestId('ConfirmButton'))

    const { inputAmount, tokenAddress, recipient } = mockTokenTransactionData

    expect(store.getActions()).toEqual(
      expect.arrayContaining([
        sendPayment(inputAmount, tokenAddress, inputAmount, '', recipient, mockFeeInfo, false),
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
          recipient: { e164PhoneNumber: mockE164Number, recipientType: RecipientType.PhoneNumber },
        },
        origin: SendOrigin.AppSendFlow,
        isFromScan: false,
      })
    )

    expect(store.getActions().length).toEqual(0)

    fireEvent.press(getByTestId('ConfirmButton'))

    const { inputAmount, tokenAddress } = mockTokenTransactionData
    expect(store.getActions()).toEqual(
      expect.arrayContaining([
        sendPayment(
          inputAmount,
          tokenAddress,
          inputAmount,
          '',
          {
            address: mockAccount2,
            e164PhoneNumber: mockE164Number,
            recipientType: RecipientType.PhoneNumber,
          },
          mockFeeInfo,
          false
        ),
      ])
    )
  })

  it('dispatches fee estimation if not already done', async () => {
    const { store } = renderScreen({ fees: { estimates: emptyFees } })

    expect(store.getActions()).toMatchInlineSnapshot(`
      [
        {
          "payload": {
            "feeType": "send",
            "tokenAddress": "0x874069fa1eb16d44d622f2e0ca25eea172369bc1",
          },
          "type": "FEES/ESTIMATE_FEE",
        },
        {
          "payload": {
            "feeType": "register-dek",
            "tokenAddress": "0x874069fa1eb16d44d622f2e0ca25eea172369bc1",
          },
          "type": "FEES/ESTIMATE_FEE",
        },
      ]
    `)
  })
})
