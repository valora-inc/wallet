import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { act, fireEvent, render } from '@testing-library/react-native'
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
import SendConfirmation from 'src/send/SendConfirmation'
import { sendPayment } from 'src/send/actions'
import { getFeatureGate } from 'src/statsig'
import { NetworkId } from 'src/transactions/types'
import { getGasPrice } from 'src/web3/gas'
import {
  RecursivePartial,
  createMockStore,
  getElementText,
  getMockStackScreenProps,
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
  mockFeeInfoCEUR,
  mockGasPrice,
  mockTestTokenAddress,
  mockTestTokenTokenId,
  mockTokenInviteTransactionData,
  mockTokenTransactionData,
} from 'test/values'

jest.mock('src/web3/gas')
const mockGetGasPrice = getGasPrice as jest.Mock

jest.mock('src/statsig')

// jest.mock('src/tokens/hooks', () => ({
//   ...jest.requireActual('src/tokens/hooks'),
//   useTokenInfo: jest.fn(),
//   useTokenInfoByAddress: jest.fn()
// }))

const mockTokenAAA = mockCeurTokenId
jest.mock('src/web3/networkConfig', () => {
  const originalModule = jest.requireActual('src/web3/networkConfig')
  return {
    ...originalModule,
    __esModule: true,
    default: {
      ...originalModule.default,
      defaultNetworkId: 'celo-alfajores',
      currencyToTokenId: {
        cGLD: 'celo-alfajores:native',
        cEUR: 'celo-alfajores:' + '0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F'.toLowerCase(),
      },
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
const mockFeeEstimatesCeur = {
  ...emptyFees,
  [FeeType.SEND]: {
    usdFee: '0.02',
    lastUpdated: 500,
    loading: false,
    error: false,
    feeInfo: mockFeeInfoCEUR,
  },
}

// jest.mocked(useTokenInfo).mockReturnValue({
//   balance: new BigNumber(0),
//   priceUsd: new BigNumber(10),
//   lastKnownPriceUsd: null,
//   address: '0x0',
//   tokenId: 'celo-alfajores:0x0',
//   decimals: 0,
//   name: 'CELO',
//   networkId: NetworkId['celo-alfajores'],
//   symbol: 'CELO',
// })

// jest.mocked(useTokenInfoByAddress).mockReturnValue({
//   balance: new BigNumber(0),
//   priceUsd: new BigNumber(10),
//   lastKnownPriceUsd: null,
//   address: '0x0',
//   tokenId: 'celo-alfajores:0x0',
//   decimals: 0,
//   name: 'CELO',
//   networkId: NetworkId['celo-alfajores'],
//   symbol: 'CELO',
// })

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
          [mockCeurAddress]: mockFeeEstimatesCeur,
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

  // TODO: need to redo snapshot for new
  it('renders correctly', async () => {
    jest.mocked(getFeatureGate).mockReturnValue(true)
    const tree = renderScreen()
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly for send payment confirmation with cUSD fees (old UI)', async () => {
    jest.mocked(getFeatureGate).mockReturnValue(false)
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

  it('renders correctly for send payment confirmation, sending cUSD, fee in CELO (new UI)', async () => {
    jest.mocked(getFeatureGate).mockReturnValue(true)
    const { getByText, getByTestId } = renderScreen()

    fireEvent.press(getByText('feeEstimate'))

    await act(() => {
      jest.runAllTimers()
    })

    const feeComponent = getByTestId('feeDrawer/SendConfirmation/totalFee')
    expect(getElementText(feeComponent)).toEqual('0.004 CELO')

    const totalComponent = getByTestId('TotalLineItem/Total')
    expect(getElementText(totalComponent)).toEqual('~1.00 cUSD')
  })

  // TODO: Need to make for old and new
  it('renders correctly for send payment confirmation with cEUR fees (old UI)', async () => {
    jest.mocked(getFeatureGate).mockReturnValue(false)
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
    jest.mocked(getFeatureGate).mockReturnValue(true)
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
    jest.mocked(getFeatureGate).mockReturnValue(true)
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
    jest.mocked(getFeatureGate).mockReturnValue(true)
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
    jest.mocked(getFeatureGate).mockReturnValue(true)
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
    jest.mocked(getFeatureGate).mockReturnValue(false)
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

  // TODO: Need to make this test for new and old version
  it('doesnt show the comment for non core tokens (old UI)', () => {
    jest.mocked(getFeatureGate).mockReturnValue(false)
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

  it('shows comment when on celo network (new UI)', () => {
    jest.mocked(getFeatureGate).mockReturnValue(true)
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

    expect(queryByTestId('commentInput/send')).toBeTruthy()
  })

  it('navigates to ValidateRecipientIntro when "edit" button is pressed', async () => {
    jest.mocked(getFeatureGate).mockReturnValue(true)
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
    jest.mocked(getFeatureGate).mockReturnValue(true)
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
    jest.mocked(getFeatureGate).mockReturnValue(true)
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
    jest.mocked(getFeatureGate).mockReturnValue(true)
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
    jest.mocked(getFeatureGate).mockReturnValue(true)
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
