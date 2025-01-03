import { type RootState } from 'src/redux/store'
import { getMultichainFeatures } from 'src/statsig'
import { pendingStandbyTransactionsSelector } from 'src/transactions/selectors'
import reducer, { _initialState, updateTransactions } from 'src/transactions/slice'
import {
  NetworkId,
  type StandbyTransaction,
  type TokenExchange,
  type TokenTransaction,
  TokenTransactionTypeV2,
  TransactionStatus,
} from 'src/transactions/types'
import { getMockStoreData } from 'test/utils'

jest.mock('src/statsig')

const standbyCrossChainSwap: StandbyTransaction = {
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
}

describe('transactions reducer', () => {
  describe('UPDATE_TRANSACTIONS action', () => {
    it('should store incoming transactions and remove corresponding standby transactions', () => {
      // Note the type assertions below, this is a shortcut to shorten the test
      // data to only the properties needed for the test
      const mockStandbyTransactions = [
        {
          transactionHash: '0x1111',
          networkId: NetworkId['celo-mainnet'],
        },
        {
          networkId: NetworkId['celo-mainnet'],
        },
        {
          transactionHash: '0x1111',
          networkId: NetworkId['ethereum-mainnet'],
        },
      ] as StandbyTransaction[]
      const mockCeloTransactions = [
        {
          status: TransactionStatus.Complete,
          transactionHash: '0x1234',
          networkId: NetworkId['celo-mainnet'],
        },
        {
          status: TransactionStatus.Complete,
          transactionHash: '0xabcd',
          networkId: NetworkId['celo-mainnet'],
        },
      ] as TokenTransaction[]
      const mockEthTransactions = [
        {
          status: TransactionStatus.Complete,
          transactionHash: '0x7890',
          networkId: NetworkId['ethereum-mainnet'],
        },
        {
          status: TransactionStatus.Complete,
          transactionHash: '0xabcd',
          networkId: NetworkId['ethereum-mainnet'],
        },
      ] as TokenTransaction[]

      const state: RootState['transactions'] = {
        ..._initialState,
        standbyTransactions: mockStandbyTransactions,
        transactionsByNetworkId: {
          [NetworkId['celo-mainnet']]: mockCeloTransactions,
          [NetworkId['ethereum-mainnet']]: mockEthTransactions,
        },
      }
      const result = reducer(
        state,
        updateTransactions({
          networkId: NetworkId['ethereum-mainnet'],
          transactions: [
            {
              status: TransactionStatus.Complete,
              transactionHash: '0x1111',
              networkId: NetworkId['ethereum-mainnet'],
            },
            ...mockEthTransactions,
          ] as TokenTransaction[],
        })
      )

      expect(result).toEqual({
        ..._initialState,
        transactionsByNetworkId: {
          [NetworkId['celo-mainnet']]: mockCeloTransactions, // unchanged, since the networkId in the action is different
          [NetworkId['ethereum-mainnet']]: [
            {
              status: TransactionStatus.Complete,
              transactionHash: '0x1111',
              networkId: NetworkId['ethereum-mainnet'],
            }, // new transaction from the action is stored in the state
            ...mockEthTransactions,
          ],
        },
        standbyTransactions: mockStandbyTransactions.slice(0, 2), // the last standby transaction is removed since it matches a transaction in the action
      })
    })

    it('should update the corresponding standby transaction for a pending cross chain swap', () => {
      const state: RootState['transactions'] = {
        ..._initialState,
        standbyTransactions: [standbyCrossChainSwap],
      }
      const updatedState = reducer(
        state,
        updateTransactions({
          networkId: NetworkId['celo-mainnet'],
          transactions: [incomingCrossChainSwap],
        })
      )

      expect(updatedState).toEqual({
        ..._initialState,
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

    it('should store a pending cross chain swap that has no corresponding standby transaction', () => {
      const updatedState = reducer(
        _initialState,
        updateTransactions({
          networkId: NetworkId['celo-mainnet'],
          transactions: [incomingCrossChainSwap],
        })
      )

      expect(updatedState).toEqual({
        ..._initialState,
        transactionsByNetworkId: {
          [NetworkId['celo-mainnet']]: [incomingCrossChainSwap],
        },
        standbyTransactions: [], // the incoming pending transaction is not added to the standby transactions
      })
    })

    it('should store a completed cross chain swap and remove the corresponding standby transaction', () => {
      const state: RootState['transactions'] = {
        ..._initialState,
        standbyTransactions: [standbyCrossChainSwap],
      }
      const updatedState = reducer(
        state,
        updateTransactions({
          networkId: NetworkId['celo-mainnet'],
          transactions: [{ ...incomingCrossChainSwap, status: TransactionStatus.Complete }],
        })
      )

      expect(updatedState).toEqual({
        ..._initialState,
        transactionsByNetworkId: {
          [NetworkId['celo-mainnet']]: [
            { ...incomingCrossChainSwap, status: TransactionStatus.Complete },
          ],
        },
        standbyTransactions: [],
      })
    })
  })
})

describe('selector', () => {
  describe('pendingStandbyTransactionsSelector', () => {
    it('should return pending transactions with default values if unavailable', () => {
      jest
        .mocked(getMultichainFeatures)
        .mockReturnValue({ showApprovalTxsInHomefeed: [NetworkId['celo-mainnet']] })

      const standbyCrossChainSwap = {
        feeCurrencyId: 'celo-mainnet:native',
        inAmount: {
          tokenId: 'arbitrum-one:0xaf88d065e77c8cc2239327c5edb3a432268e5831',
          tokenAddress: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
          value: '0.099402',
        },
        context: {
          id: '0ee0b4fe-c285-44da-a6de-c0f14f84ee7f',
          tag: 'swap/saga',
          description: 'Swap/Execute',
        },
        status: TransactionStatus.Pending,
        outAmount: {
          tokenId: 'celo-mainnet:0x765de816845861e75a25fca122bb6898b8b1282a',
          tokenAddress: '0x765de816845861e75a25fca122bb6898b8b1282a',
          value: '0.0994',
        },
        fees: [
          {
            amount: {
              localAmount: {
                currencyCode: 'EUR',
                exchangeRate: '0.48180325869',
                value: '0.00158460996455442135',
              },
              value: '0.003288915',
              tokenAddress: '0x471ece3750da237f93b8e339c536989b8978a438',
              tokenId: 'celo-mainnet:native',
            },
            type: 'SECURITY_FEE',
          },
          {
            amount: {
              localAmount: {
                currencyCode: 'EUR',
                exchangeRate: '0.91760127999',
                value: '0.000550560767994',
              },
              value: '0.0006',
              tokenAddress: '0x765de816845861e75a25fca122bb6898b8b1282a',
              tokenId: 'celo-mainnet:0x765de816845861e75a25fca122bb6898b8b1282a',
            },
            type: 'APP_FEE',
          },
          {
            amount: {
              localAmount: {
                currencyCode: 'EUR',
                exchangeRate: '0.48180325869',
                value: '0.17992880266886214666758336412',
              },
              value: '0.373448704265886348',
              tokenAddress: '0x471ece3750da237f93b8e339c536989b8978a438',
              tokenId: 'celo-mainnet:native',
            },
            type: 'CROSS_CHAIN_FEE',
          },
        ],
        transactionHash: '0x60b169b86f7b54413f50e5dc77283ce2d4842119fa313658c23607eade1e41b9',
        block: '26987429',
        networkId: NetworkId['celo-mainnet'],
        type: TokenTransactionTypeV2.CrossChainSwapTransaction as const,
        timestamp: 1722609137000,
      }
      const standbyApproval = {
        status: TransactionStatus.Pending,
        networkId: NetworkId['celo-mainnet'],
        tokenId: 'celo-mainnet:0x765de816845861e75a25fca122bb6898b8b1282a',
        approvedAmount: '0.1',
        feeCurrencyId: 'celo-mainnet:native',
        transactionHash: '0x3496315e3dd31f838abc34c5eb5d0131c990393d5d23217875be69fb07335399',
        context: {
          id: 'edc8d29b-aae2-4ecf-9920-4bd94976f42f',
          tag: 'swap/saga',
          description: 'Swap/Approve',
        },
        timestamp: 1722588482000,
        type: TokenTransactionTypeV2.Approval as const,
      }

      const state: RootState = getMockStoreData({
        transactions: {
          ..._initialState,
          standbyTransactions: [standbyCrossChainSwap, standbyApproval],
        },
      })
      expect(pendingStandbyTransactionsSelector(state)).toEqual([
        standbyCrossChainSwap, // all fields returned
        { ...standbyApproval, block: '', fees: [] }, // default values for block and fees
      ])
    })
  })
})
