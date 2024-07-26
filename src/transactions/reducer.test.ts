import { Actions } from 'src/transactions/actions'
import { initialState, reducer, State } from 'src/transactions/reducer'
import {
  NetworkId,
  StandbyTransaction,
  TokenExchange,
  TokenTransactionTypeV2,
  TransactionStatus,
} from 'src/transactions/types'

const standbyCrossChainSwap: StandbyTransaction = {
  __typename: 'CrossChainTokenExchange',
  timestamp: 1721978699901,
  feeCurrencyId: 'celo-mainnet:native',
  inAmount: {
    value: '0.000030353037245945',
    tokenId: 'op-mainnet:native',
  },
  context: {
    id: '8440fcf7-11f4-45e9-874e-7a1198f9810e',
    tag: 'swap/saga',
    description: 'Swap/Execute',
  },
  transactionHash: '0xfe6882fbcabc01debb1c4776c14f545d5ffd6877c460ac5fb6bcafab60089f3d',
  type: TokenTransactionTypeV2.CrossChainSwapTransaction,
  networkId: NetworkId['celo-mainnet'],
  status: TransactionStatus.Pending,
  outAmount: {
    value: '0.1',
    tokenId: 'celo-mainnet:0x765de816845861e75a25fca122bb6898b8b1282a',
  },
}

const incomingCrossChainSwap: TokenExchange = {
  status: TransactionStatus.Pending,
  outAmount: {
    tokenId: 'celo-mainnet:0x765de816845861e75a25fca122bb6898b8b1282a',
    tokenAddress: '0x765de816845861e75a25fca122bb6898b8b1282a',
    value: '0.0994',
  },
  fees: [
    {
      amount: {
        value: '0.003580927',
        tokenAddress: '0x471ece3750da237f93b8e339c536989b8978a438',
        tokenId: 'celo-mainnet:native',
      },
      type: 'SECURITY_FEE',
    },
    {
      amount: {
        value: '0.0006',
        tokenAddress: '0x765de816845861e75a25fca122bb6898b8b1282a',
        tokenId: 'celo-mainnet:0x765de816845861e75a25fca122bb6898b8b1282a',
      },
      type: 'APP_FEE',
    },
    {
      amount: {
        value: '0.309402927137214979',
        tokenAddress: '0x471ece3750da237f93b8e339c536989b8978a438',
        tokenId: 'celo-mainnet:native',
      },
      type: 'CROSS_CHAIN_FEE',
    },
  ],
  inAmount: {
    tokenId: 'op-mainnet:native',
    value: '',
  },
  transactionHash: '0xfe6882fbcabc01debb1c4776c14f545d5ffd6877c460ac5fb6bcafab60089f3d',
  block: '26861364',
  type: TokenTransactionTypeV2.CrossChainSwapTransaction,
  networkId: NetworkId['celo-mainnet'],
  timestamp: 1721978706000,
  __typename: 'CrossChainTokenExchange',
}

describe('transactions reducer', () => {
  it('should handle UPDATE_TRANSACTIONS action for a pending cross chain swap', () => {
    const state: State = {
      ...initialState,
      standbyTransactions: [standbyCrossChainSwap],
    }
    const updatedState = reducer(state, {
      type: Actions.UPDATE_TRANSACTIONS,
      networkId: NetworkId['celo-mainnet'],
      transactions: [incomingCrossChainSwap],
    })

    expect(updatedState).toEqual({
      ...initialState,
      transactionsByNetworkId: {
        [NetworkId['celo-mainnet']]: [], // the incoming pending transaction is not added to the store
      },
      standbyTransactions: [
        // resulting standby transaction is the incoming pending transaction,
        // plus the standby properties that we want to retain
        {
          ...incomingCrossChainSwap,
          feeCurrencyId: 'celo-mainnet:native',
          inAmount: {
            value: '0.000030353037245945',
            tokenId: 'op-mainnet:native',
          },
          context: {
            id: '8440fcf7-11f4-45e9-874e-7a1198f9810e',
            tag: 'swap/saga',
            description: 'Swap/Execute',
          },
        },
      ],
    })
  })

  it('should handle UPDATE_TRANSACTIONS action for a pending cross chain swap that is not already in the store', () => {
    const state: State = {
      ...initialState,
    }
    const updatedState = reducer(state, {
      type: Actions.UPDATE_TRANSACTIONS,
      networkId: NetworkId['celo-mainnet'],
      transactions: [incomingCrossChainSwap],
    })

    expect(updatedState).toEqual({
      ...initialState,
      transactionsByNetworkId: {
        [NetworkId['celo-mainnet']]: [incomingCrossChainSwap],
      },
      standbyTransactions: [], // the incoming pending transaction is not added to the standby transactions
    })
  })

  it('should handle UPDATE_TRANSACTIONS action for a completed cross chain swap', () => {
    const state: State = {
      ...initialState,
      standbyTransactions: [standbyCrossChainSwap],
    }
    const updatedState = reducer(state, {
      type: Actions.UPDATE_TRANSACTIONS,
      networkId: NetworkId['celo-mainnet'],
      transactions: [{ ...incomingCrossChainSwap, status: TransactionStatus.Complete }],
    })

    expect(updatedState).toEqual({
      ...initialState,
      transactionsByNetworkId: {
        [NetworkId['celo-mainnet']]: [
          { ...incomingCrossChainSwap, status: TransactionStatus.Complete },
        ],
      },
      standbyTransactions: [standbyCrossChainSwap], // the standby transaction is not altered
    })
  })
})
