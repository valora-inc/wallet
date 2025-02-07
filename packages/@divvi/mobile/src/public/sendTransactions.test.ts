import { mockAccount, mockCeloTokenBalance } from '../../test/values'
import { getSerializablePreparedTransactions } from '../viem/preparedTransactionSerialization'
import { sendPreparedTransactions as sendPreparedTransactionsSaga } from '../viem/saga'
import type { PreparedTransactionsPossible } from './prepareTransactions'
import { sendTransactions } from './sendTransactions'

jest.mock('../viem/saga')

describe('sendTransactions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(sendPreparedTransactionsSaga).mockReset()
  })

  it('should correctly send prepared transactions', async () => {
    const mockTxHashes = ['0x123', '0x456']
    const mockPrepared = {
      type: 'possible',
      transactions: [
        { to: mockAccount, value: BigInt(1000) },
        { to: mockAccount, value: BigInt(1000) },
      ],
      feeCurrency: mockCeloTokenBalance,
    } as PreparedTransactionsPossible

    jest.mocked(sendPreparedTransactionsSaga).mockReturnValue(mockTxHashes as any)

    const result = await sendTransactions(mockPrepared as any)

    expect(result).toEqual(mockTxHashes)
    expect(sendPreparedTransactionsSaga).toHaveBeenCalledWith(
      getSerializablePreparedTransactions(mockPrepared.transactions),
      'celo-alfajores',
      expect.any(Array)
    )
  })
})
