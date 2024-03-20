import { render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { getDynamicConfigParams } from 'src/statsig'
import JumpstartTransactionDetailsScreen from 'src/transactions/feed/JumpstartTransactionDetailsScreen'
import {
  Fee,
  NetworkId,
  TokenAmount,
  TokenTransaction,
  TokenTransactionTypeV2,
  TokenTransfer,
  TokenTransferMetadata,
  TransactionStatus,
} from 'src/transactions/types'
import {
  RecursivePartial,
  createMockStore,
  getElementText,
  getMockStackScreenProps,
} from 'test/utils'
import {
  mockAccount,
  mockCusdAddress,
  mockCusdTokenId,
  mockE164Number2,
  mockJumpstartAdddress,
} from 'test/values'

jest.mock('src/analytics/ValoraAnalytics')
jest.mock('src/statsig')

const mockAddress = '0x8C3b8Af721384BB3479915C72CEe32053DeFca4E'
const mockName = 'Hello World'

describe('TransactionDetailsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    jest.mocked(getDynamicConfigParams).mockReturnValue({
      jumpstartContracts: {
        [NetworkId['celo-alfajores']]: { contractAddress: mockJumpstartAdddress },
      },
    })
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
        <JumpstartTransactionDetailsScreen {...mockScreenProps} />
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
    status = TransactionStatus.Complete,
  }: {
    type: TokenTransactionTypeV2
    address?: string
    amount?: TokenAmount
    metadata?: TokenTransferMetadata
    fees?: Fee[]
    status?: TransactionStatus
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
      status,
    }
  }

  it('handles jumpstart sent transactions correctly', async () => {
    const { getByTestId } = renderScreen({
      transaction: tokenTransfer({
        type: TokenTransactionTypeV2.Sent,
      }),
    })

    const amountSendComponent = getByTestId('LineItemRowTitle/JumpstartContent/TokenDetails')
    expect(getElementText(amountSendComponent)).toBe('amountSent')
    const amountValue = getByTestId('JumpstartContent/AmountValue')
    expect(getElementText(amountValue)).toBe('10.00 cUSD')
  })

  it('handles jumpstart received transactions correctly', async () => {
    const { getByTestId } = renderScreen({
      transaction: tokenTransfer({
        type: TokenTransactionTypeV2.Received,
      }),
    })

    const amountReceivedComponent = getByTestId('LineItemRowTitle/JumpstartContent/TokenDetails')
    expect(getElementText(amountReceivedComponent)).toBe('amountReceived')
    const amountValue = getByTestId('JumpstartContent/AmountValue')
    expect(getElementText(amountValue)).toBe('10.00 cUSD')
  })
})
