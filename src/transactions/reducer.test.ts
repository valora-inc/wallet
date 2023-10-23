import { Actions } from 'src/transactions/actions'
import { initialState, reducer } from 'src/transactions/reducer'
import {
  NetworkId,
  StandbyTransaction,
  TokenTransaction,
  TokenTransactionTypeV2,
  TransactionStatus,
} from 'src/transactions/types'

const createMockStandbyTransaction = (contextId: string): StandbyTransaction => ({
  context: {
    description: 'Send payment',
    tag: 'send/saga',
    id: contextId,
  },
  address: '0x047154ac4d7e01b1dc9ddeea9e8996b57895a747',
  timestamp: 1698046668931,
  status: TransactionStatus.Pending,
  networkId: NetworkId['celo-alfajores'],
  amount: {
    tokenId: 'celo-alfajores:0x874069fa1eb16d44d622f2e0ca25eea172369bc1',
    tokenAddress: '0x874069fa1eb16d44d622f2e0ca25eea172369bc1',
    value: '-0.466666666666666667',
  },
  type: TokenTransactionTypeV2.Sent,
  metadata: {
    comment: '',
  },
  __typename: 'TokenTransferV3',
})

const transactionHash = '0x1234567890'
const createMockTransaction = (contextId: string): TokenTransaction => ({
  ...createMockStandbyTransaction(contextId),
  status: TransactionStatus.Complete,
  fees: [],
  block: '123',
  transactionHash,
})

describe('transactions reducer', () => {
  it('should update the correct transaction with the ADD_HASH_TO_STANDBY_TRANSACTIONS action', () => {
    expect(
      reducer(
        {
          ...initialState,
          standbyTransactions: [
            createMockStandbyTransaction('id1'),
            createMockStandbyTransaction('id2'),
          ],
        },
        {
          type: Actions.ADD_HASH_TO_STANDBY_TRANSACTIONS,
          idx: 'id2',
          hash: transactionHash,
        }
      )
    ).toEqual({
      ...initialState,
      standbyTransactions: [
        createMockStandbyTransaction('id1'),
        { ...createMockStandbyTransaction('id2'), transactionHash },
      ],
    })
  })

  it('should update correctly for the TRANSACTION_FEED_UPDATED action', () => {
    expect(
      reducer(
        {
          ...initialState,
          standbyTransactions: [
            createMockStandbyTransaction('id1'),
            { ...createMockStandbyTransaction('id2'), transactionHash },
          ],
        },
        {
          type: Actions.TRANSACTION_FEED_UPDATED,
          transactions: [createMockTransaction('id2')],
        }
      )
    ).toEqual({
      ...initialState,
      transactions: [createMockTransaction('id2')],
      standbyTransactions: [createMockStandbyTransaction('id1')],
      knownFeedTransactions: {
        [transactionHash]: '0x047154ac4d7e01b1dc9ddeea9e8996b57895a747',
      },
    })
  })
})
