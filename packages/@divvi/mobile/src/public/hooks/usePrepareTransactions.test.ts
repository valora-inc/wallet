import { act, renderHook } from '@testing-library/react-native'
import { mockAccount } from 'test/values'
import { PreparedTransactionsPossible, prepareTransactions } from '../prepareTransactions'
import { usePrepareTransactions } from './usePrepareTransactions'

jest.mock('../prepareTransactions')
const mockPrepareTransactions = jest.mocked(prepareTransactions)

// This test focuses on the key integration points of the hook, avoiding testing react-async-hook which is already tested
describe('usePrepareTransactions', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockPrepareTransactions.mockReset()
  })

  it('should provide preparation functionality and expose results', async () => {
    const mockResult = { type: 'possible' } as PreparedTransactionsPossible
    mockPrepareTransactions.mockResolvedValueOnce(mockResult)

    const { result } = renderHook(() => usePrepareTransactions())

    await act(async () => {
      await result.current.prepareTransactions({
        networkId: 'celo-mainnet',
        transactionRequests: [
          {
            to: mockAccount,
            value: BigInt(1),
          },
        ],
      })
    })

    expect(mockPrepareTransactions).toHaveBeenCalledTimes(1)
    expect(result.current.data).toEqual(mockResult)
    expect(result.current.status).toEqual('success')
  })

  it('should expose errors when preparation fails', async () => {
    const mockError = new Error('Preparation failed')
    mockPrepareTransactions.mockRejectedValueOnce(mockError)

    const { result } = renderHook(() => usePrepareTransactions())

    await act(async () => {
      await expect(
        result.current.prepareTransactions({
          networkId: 'celo-mainnet',
          transactionRequests: [
            {
              to: mockAccount,
              value: BigInt(1),
            },
          ],
        })
      ).rejects.toThrow(mockError)
    })

    expect(result.current.error).toBe(mockError)
    expect(result.current.status).toEqual('error')
  })
})
