import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { SendOrigin } from 'src/analytics/types'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { RootState } from 'src/redux/reducers'
import SendConfirmation from 'src/send/SendConfirmation'
import { sendPayment } from 'src/send/actions'
import { NetworkId } from 'src/transactions/types'
import {
  RecursivePartial,
  createMockStore,
  getElementText,
  getMockStackScreenProps,
} from 'test/utils'
import {
  emptyFees,
  mockCeloAddress,
  mockCeloTokenId,
  mockCeurAddress,
  mockCeurTokenId,
  mockCusdAddress,
  mockCusdTokenId,
  mockTestTokenAddress,
  mockTestTokenTokenId,
  mockTokenTransactionData,
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
  feeAmount: '0.01',
  feeTokenId: mockCeloTokenId,
})

type ScreenProps = NativeStackScreenProps<
  StackParamList,
  Screens.SendConfirmation | Screens.SendConfirmationModal
>

describe('SendConfirmation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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
            isFeeCurrency: true,
            canTransferWithComment: true,
            priceFetchedAt: Date.now(),
          },
          [mockCeurTokenId]: {
            address: mockCeurAddress,
            tokenId: mockCeurTokenId,
            networkId: NetworkId['celo-alfajores'],
            symbol: 'cEUR',
            balance: '100',
            priceUsd: '1.2',
            isFeeCurrency: true,
            canTransferWithComment: true,
            priceFetchedAt: Date.now(),
          },
          [mockCeloTokenId]: {
            address: mockCeloAddress,
            tokenId: mockCeloTokenId,
            networkId: NetworkId['celo-alfajores'],
            symbol: 'CELO',
            balance: '20',
            priceUsd: '5',
            isFeeCurrency: true,
            canTransferWithComment: true,
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
      ...storeOverrides,
    })

    const tree = render(
      <Provider store={store}>
        <SendConfirmation {...(screenProps ? screenProps : mockScreenPropsWithPreparedTx)} />
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

  it('renders correctly for send payment confirmation with fees from props', async () => {
    const { getByTestId } = renderScreen()

    const feeComponent = getByTestId('LineItemRow/SendConfirmation/fee')
    expect(getElementText(feeComponent)).toEqual('0.01 CELO')

    const totalComponent = getByTestId('TotalLineItem/Total')
    expect(getElementText(totalComponent)).toEqual('~1.05 cUSD')
  })

  it('updates the comment/reason', () => {
    const { getByTestId, queryAllByDisplayValue } = renderScreen()

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
          tokenId: mockCeloTokenId,
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
          tokenId: mockTestTokenTokenId,
        },
        origin: SendOrigin.AppSendFlow,
        isFromScan: false,
      })
    )

    expect(queryByTestId('commentInput/send')).toBeFalsy()
  })

  it('shows comment when stable token on celo network', () => {
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

  it('dispatches an action with prepared transaction when the confirm button is pressed', async () => {
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
})
