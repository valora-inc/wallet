import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { act, fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { SendOrigin } from 'src/analytics/types'
import { FeeType } from 'src/fees/reducer'
import { AddressValidationType } from 'src/identity/reducer'
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
  mockTokenTransactionData,
} from 'test/values'

jest.mock('src/web3/gas')
const mockGetGasPrice = getGasPrice as jest.Mock

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

jest.mock('src/statsig')

const mockScreenProps = getMockStackScreenProps(Screens.SendConfirmation, {
  transactionData: {
    ...mockTokenTransactionData,
  },
  origin: SendOrigin.AppSendFlow,
  isFromScan: false,
})

const mockScreenPropsWithPreparedTx = getMockStackScreenProps(Screens.SendConfirmation, {
  transactionData: {
    ...mockTokenTransactionData,
  },
  origin: SendOrigin.AppSendFlow,
  isFromScan: false,
  preparedTransaction: {
    from: '0xfrom',
    to: '0xto',
    data: '0xdata',
  },
  feeAmount: '0.004',
  feeTokenId: mockCeloTokenId,
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
    feeInfo: mockFeeInfo,
  },
}

describe('SendConfirmation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetGasPrice.mockImplementation(() => mockGasPrice)
    jest.mocked(getFeatureGate).mockReturnValue(true)
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

  it('renders correctly', async () => {
    const tree = renderScreen({}, mockScreenPropsWithPreparedTx)
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

  it('renders correctly for send payment confirmation with fees from props (new UI)', async () => {
    const { getByTestId } = renderScreen({}, mockScreenPropsWithPreparedTx)

    const feeComponent = getByTestId('LineItemRow/SendConfirmation/fee')
    expect(getElementText(feeComponent)).toEqual('0.004 CELO')

    const totalComponent = getByTestId('TotalLineItem/Total')
    expect(getElementText(totalComponent)).toEqual('~1.02 cUSD')
  })

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

  it('shows --- for fee when fee estimate fails (old UI)', async () => {
    jest.mocked(getFeatureGate).mockReturnValue(false)
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

  it('shows loading for fee while fee estimate loads (old UI)', async () => {
    jest.mocked(getFeatureGate).mockReturnValue(false)
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
    jest.mocked(getFeatureGate).mockReturnValue(false)
    const { queryByTestId } = renderScreen(
      {},
      getMockStackScreenProps(Screens.SendConfirmation, {
        transactionData: {
          ...mockTokenTransactionData,
          tokenAddress: mockCeloAddress,
          tokenId: mockCeloTokenId,
        },
        origin: SendOrigin.AppSendFlow,
        isFromScan: false,
      })
    )

    expect(queryByTestId('commentInput/send')).toBeFalsy()
  })

  it('doesnt show the comment for non core tokens (old UI)', () => {
    jest.mocked(getFeatureGate).mockReturnValue(false)
    const { queryByTestId } = renderScreen(
      {},
      getMockStackScreenProps(Screens.SendConfirmation, {
        transactionData: {
          ...mockTokenTransactionData,
          tokenAddress: mockTestTokenAddress,
          tokenId: mockTestTokenTokenId,
        },
        origin: SendOrigin.AppSendFlow,
        isFromScan: false,
      })
    )

    expect(queryByTestId('commentInput/send')).toBeFalsy()
  })

  it('shows comment when stable token on celo network (new UI)', () => {
    const { queryByTestId } = renderScreen(
      {},
      getMockStackScreenProps(Screens.SendConfirmation, {
        transactionData: {
          ...mockTokenTransactionData,
          tokenAddress: mockCusdAddress,
        },
        origin: SendOrigin.AppSendFlow,
        isFromScan: false,
      })
    )

    expect(queryByTestId('commentInput/send')).toBeTruthy()
  })

  it('dispatches an action with fee info from redux when the confirm button is pressed (old UI)', async () => {
    jest.mocked(getFeatureGate).mockReturnValue(false)
    const { store, getByTestId } = renderScreen({ web3: { isDekRegistered: true } })

    expect(store.getActions().length).toEqual(0)

    fireEvent.press(getByTestId('ConfirmButton'))

    const { inputAmount, tokenId, recipient } = mockTokenTransactionData

    expect(store.getActions()).toEqual(
      expect.arrayContaining([
        sendPayment(inputAmount, tokenId, inputAmount, '', recipient, false, mockFeeInfo),
      ])
    )
  })

  it('dispatches an action with prepared transaction when the confirm button is pressed (new UI)', async () => {
    const { store, getByTestId } = renderScreen(
      { fees: { estimates: emptyFees } },
      mockScreenPropsWithPreparedTx
    )

    expect(store.getActions().length).toEqual(0)

    fireEvent.press(getByTestId('ConfirmButton'))

    const { inputAmount, tokenId, recipient } = mockTokenTransactionData

    expect(store.getActions()[0]).toEqual(
      sendPayment(inputAmount, tokenId, inputAmount, '', recipient, false, undefined, {
        from: '0xfrom',
        to: '0xto',
        data: '0xdata',
      })
    )
  })

  it('dispatches the send action with the right address when going through Secure Send', async () => {
    jest.mocked(getFeatureGate).mockReturnValue(false)
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

    const { inputAmount, tokenId } = mockTokenTransactionData
    expect(store.getActions()).toEqual(
      expect.arrayContaining([
        sendPayment(
          inputAmount,
          tokenId,
          inputAmount,
          '',
          {
            address: mockAccount2,
            e164PhoneNumber: mockE164Number,
            recipientType: RecipientType.PhoneNumber,
          },
          false,
          mockFeeInfo
        ),
      ])
    )
  })

  it('dispatches fee estimation if not already done for old send flow', async () => {
    jest.mocked(getFeatureGate).mockReturnValue(false)
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

  it('does not dispatch fee estimate action for new send flow', async () => {
    const { store } = renderScreen({ fees: { estimates: emptyFees } })

    expect(store.getActions()).toEqual([])
  })
})
