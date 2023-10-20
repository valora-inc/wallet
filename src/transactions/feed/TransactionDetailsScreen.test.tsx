import { render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import TransactionDetailsScreen from 'src/transactions/feed/TransactionDetailsScreen'
import {
  Fee,
  FeeType,
  TokenAmount,
  TokenExchange,
  TokenExchangeMetadata,
  TokenTransaction,
  TokenTransactionTypeV2,
  TokenTransfer,
  TokenTransferMetadata,
  NetworkId,
  TransactionStatus,
} from 'src/transactions/types'
import {
  createMockStore,
  getElementText,
  getMockStackScreenProps,
  RecursivePartial,
} from 'test/utils'
import {
  mockAccount,
  mockCeloAddress,
  mockCeloTokenId,
  mockCeurAddress,
  mockCeurTokenId,
  mockCusdAddress,
  mockCusdTokenId,
  mockDisplayNumber2,
  mockE164Number2,
} from 'test/values'

const mockAddress = '0x8C3b8Af721384BB3479915C72CEe32053DeFca4E'
const mockName = 'Hello World'

describe('TransactionDetailsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  function renderScreen({
    storeOverrides = {},
    transaction,
  }: {
    storeOverrides?: RecursivePartial<RootState>
    transaction: TokenTransaction
  }) {
    const store = createMockStore({
      identity: { addressToE164Number: { [mockAddress]: mockE164Number2 } },
      recipients: { phoneRecipientCache: { [mockE164Number2]: { name: mockName } } },
      ...storeOverrides,
    })

    const mockScreenProps = getMockStackScreenProps(Screens.TransactionDetailsScreen, {
      transaction,
    })

    const tree = render(
      <Provider store={store}>
        <TransactionDetailsScreen {...mockScreenProps} />
      </Provider>
    )

    return {
      store,
      ...tree,
    }
  }

  function tokenTransfer({
    type,
    address = mockAccount,
    amount = {
      value: 10,
      tokenAddress: mockCusdAddress,
      tokenId: mockCusdTokenId,
      localAmount: {
        currencyCode: 'EUR',
        exchangeRate: '0.4',
        value: '4',
      },
    },
    metadata = {},
    fees = [],
  }: {
    type: TokenTransactionTypeV2
    address?: string
    amount?: TokenAmount
    metadata?: TokenTransferMetadata
    fees?: Fee[]
  }): TokenTransfer {
    return {
      __typename: 'TokenTransferV3',
      networkId: NetworkId['celo-alfajores'],
      type,
      transactionHash: '0x544367eaf2b01622dd1c7b75a6b19bf278d72127aecfb2e5106424c40c268e8b',
      timestamp: 1542306118,
      block: '8648978',
      address,
      amount,
      metadata,
      fees,
      status: TransactionStatus.Complete,
    }
  }

  function swapTransaction({
    inAmount = {
      value: 34,
      tokenAddress: mockCeurAddress,
      tokenId: mockCeurTokenId,
    },
    outAmount = {
      value: 17,
      tokenAddress: mockCusdAddress,
      tokenId: mockCusdTokenId,
    },
    metadata = {},
    fees = [],
  }: {
    inAmount?: TokenAmount
    outAmount?: TokenAmount
    metadata?: TokenExchangeMetadata
    fees?: Fee[]
  }): TokenExchange {
    return {
      __typename: 'TokenExchangeV3',
      networkId: NetworkId['celo-alfajores'],
      type: TokenTransactionTypeV2.SwapTransaction,
      transactionHash: '0xf5J440sML02q2z8q92Vyt3psStjBACc3825KmFGB2Zk1zMil6wrI306097C1Rps2',
      timestamp: 1531306119,
      block: '7523159',
      inAmount,
      outAmount,
      metadata,
      fees,
      status: TransactionStatus.Complete,
    }
  }

  it('renders correctly for sends', async () => {
    const { getByTestId } = renderScreen({
      transaction: tokenTransfer({
        type: TokenTransactionTypeV2.Sent,
        address: mockAddress,
        fees: [
          {
            type: 'fee_type',
            amount: {
              value: '0.01',
              tokenAddress: mockCeloAddress,
              tokenId: mockCeloTokenId,
              localAmount: {
                value: '0.04',
                currencyCode: 'EUR',
                exchangeRate: '0.4',
              },
            },
          },
        ],
      }),
    })

    const nameComponent = getByTestId('TransferSent/name')
    expect(getElementText(nameComponent)).toEqual(mockName)

    const numberComponent = getByTestId('TransferSent/number')
    expect(getElementText(numberComponent)).toEqual(mockDisplayNumber2)

    const amountComponent = getByTestId('SentAmount')
    expect(getElementText(amountComponent)).toEqual('€4.00')
    const totalComponent = getByTestId('TotalLineItem/Total')
    expect(getElementText(totalComponent)).toEqual('€4.04')
  })

  it('renders correctly for receives', async () => {
    const { getByTestId } = renderScreen({
      transaction: tokenTransfer({
        type: TokenTransactionTypeV2.Received,
        address: mockAddress,
      }),
    })

    const nameComponent = getByTestId('TransferReceived/name')
    expect(getElementText(nameComponent)).toEqual(mockName)

    const numberComponent = getByTestId('TransferReceived/number')
    expect(getElementText(numberComponent)).toEqual(mockDisplayNumber2)

    const totalComponent = getByTestId('TotalLineItem/Total')
    expect(getElementText(totalComponent)).toEqual('€4.00')
  })

  it('renders correctly for rewards received', async () => {
    const { getByTestId, queryByTestId } = renderScreen({
      transaction: tokenTransfer({
        type: TokenTransactionTypeV2.Received,
        address: mockAddress,
      }),
      storeOverrides: {
        identity: {},
        recipients: { rewardsSenders: [mockAddress] },
      },
    })

    const nameComponent = getByTestId('RewardReceived/name')
    expect(getElementText(nameComponent)).toEqual('feedItemRewardReceivedTitle')

    expect(queryByTestId('RewardReceived/number')).toBeNull()

    const totalComponent = getByTestId('TotalLineItem/Total')
    expect(getElementText(totalComponent)).toEqual('€4.00')
  })

  it('renders correctly for cUSD to cEUR swap', async () => {
    const { getByTestId } = renderScreen({
      transaction: swapTransaction({
        fees: [
          {
            type: FeeType.SecurityFee,
            amount: {
              value: 0.1,
              tokenAddress: mockCusdAddress,
              tokenId: mockCusdTokenId,
            },
          },
        ],
      }),
      storeOverrides: {},
    })

    const swapTo = getByTestId('SwapContent/swapTo')
    expect(getElementText(swapTo)).toEqual('34.00 cEUR')

    const swapFrom = getByTestId('SwapContent/swapFrom')
    expect(getElementText(swapFrom)).toEqual('17.00 cUSD')

    const rate = getByTestId('SwapContent/rate')
    expect(getElementText(rate)).toEqual('1 cUSD ≈ 2.00 cEUR')

    // Includes the fee
    const estimatedFee = getByTestId('SwapContent/estimatedFee')
    expect(getElementText(estimatedFee)).toEqual('0.10 cUSD')
  })
})
