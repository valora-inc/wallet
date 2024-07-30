import { RootState } from 'src/redux/store'
import { Actions } from 'src/transactions/actions'
import { _initialState, reducer } from 'src/transactions/reducer'
import {
  NetworkId,
  StandbyTransaction,
  TokenTransaction,
  TransactionStatus,
} from 'src/transactions/types'

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
      const result = reducer(state, {
        type: Actions.UPDATE_TRANSACTIONS,
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
  })
})
