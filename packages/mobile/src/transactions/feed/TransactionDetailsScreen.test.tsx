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
  mockCusdAddress,
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
      __typename: 'TokenTransferV2',
      type,
      transactionHash: '0x544367eaf2b01622dd1c7b75a6b19bf278d72127aecfb2e5106424c40c268e8b',
      timestamp: 1542306118,
      block: '8648978',
      address,
      amount,
      metadata,
      fees,
    }
  }

  function tokenExchange({
    inAmount = {
      value: 10,
      tokenAddress: mockCusdAddress,
      localAmount: {
        currencyCode: 'EUR',
        exchangeRate: '0.4',
        value: '4',
      },
    },
    outAmount = {
      value: 3,
      tokenAddress: mockCeloAddress,
      localAmount: {
        currencyCode: 'EUR',
        exchangeRate: '1.33',
        value: '4',
      },
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
      __typename: 'TokenExchangeV2',
      type: TokenTransactionTypeV2.Exchange,
      transactionHash: '0x544367eaf2b01622dd1c7b75a6b19bf278d72127aecfb2e5106424c40c268e8b',
      timestamp: 1542306118,
      block: '8648978',
      inAmount,
      outAmount,
      metadata,
      fees,
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

  it('renders correctly for CELO purchases', async () => {
    const { getByTestId } = renderScreen({
      transaction: tokenExchange({
        fees: [
          {
            type: FeeType.SecurityFee,
            amount: {
              value: 0.1,
              tokenAddress: mockCusdAddress,
              localAmount: {
                value: '0.4',
                currencyCode: 'EUR',
                exchangeRate: '4',
              },
            },
          },
        ],
      }),
      storeOverrides: {},
    })

    const celoAmount = getByTestId('CeloAmount')
    expect(getElementText(celoAmount)).toEqual('3.00')

    const fiatAmount = getByTestId('FiatAmount')
    expect(getElementText(fiatAmount)).toEqual('€4.00')

    const totalFee = getByTestId('feeDrawer/CeloExchangeContent/totalFee/value')
    // Note that the fee display still uses the local exchange rate. In practice it should never not match,
    // but we need to fix that.
    expect(getElementText(totalFee)).toEqual('₱0.133')

    // Includes the fee
    const total = getByTestId('TotalLineItem/Total')
    expect(getElementText(total)).toEqual('€4.40')

    const subtotal = getByTestId('TotalLineItem/Subtotal')
    expect(getElementText(subtotal)).toEqual('10.10 cUSD')
  })

  it('renders correctly for selling CELO', async () => {
    const { getByTestId } = renderScreen({
      transaction: tokenExchange({
        fees: [
          {
            type: FeeType.SecurityFee,
            amount: {
              value: 0.1,
              tokenAddress: mockCusdAddress,
              localAmount: {
                value: '0.4',
                currencyCode: 'EUR',
                exchangeRate: '4',
              },
            },
          },
        ],
      }),
      storeOverrides: {},
    })

    const celoAmount = getByTestId('CeloAmount')
    expect(getElementText(celoAmount)).toEqual('3.00')

    const fiatAmount = getByTestId('FiatAmount')
    expect(getElementText(fiatAmount)).toEqual('€4.00')

    const totalFee = getByTestId('feeDrawer/CeloExchangeContent/totalFee/value')
    expect(getElementText(totalFee)).toEqual('₱0.133')

    // Includes the fee
    const total = getByTestId('TotalLineItem/Total')
    expect(getElementText(total)).toEqual('€4.40')

    const subtotal = getByTestId('TotalLineItem/Subtotal')
    expect(getElementText(subtotal)).toEqual('10.10 cUSD')
  })
})
