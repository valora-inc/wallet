import { act, renderHook } from '@testing-library/react-native'
import type { PreparedTransactionsPossible } from '../prepareTransactions'
import { sendTransactions } from '../sendTransactions'
import { useSendTransactions } from './useSendTransactions'

jest.mock('../sendTransactions')
const mockSendPreparedTransactions = jest.mocked(sendTransactions)

const mockPreparedTransactions = { type: 'possible' } as PreparedTransactionsPossible

// This test focuses on the key integration points of the hook, avoiding testing react-async-hook which is already tested
describe('usePrepareTransactions', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockSendPreparedTransactions.mockReset()
  })

  it('should provide sending functionality and expose results', async () => {
    const mockResult = ['0x123' as `0x${string}`]
    mockSendPreparedTransactions.mockResolvedValueOnce(mockResult)

    const { result } = renderHook(() => useSendTransactions())

    await act(async () => {
      await result.current.sendTransactions(mockPreparedTransactions)
    })

    expect(mockSendPreparedTransactions).toHaveBeenCalledTimes(1)
    expect(result.current.data).toEqual(mockResult)
    expect(result.current.status).toEqual('success')
  })

  it('should expose errors when sending fails', async () => {
    const mockError = new Error('Sending failed')
    mockSendPreparedTransactions.mockRejectedValueOnce(mockError)

    const { result } = renderHook(() => useSendTransactions())

    await act(async () => {
      await expect(result.current.sendTransactions(mockPreparedTransactions)).rejects.toThrow(
        mockError
      )
    })

    expect(result.current.error).toBe(mockError)
    expect(result.current.status).toEqual('error')
  })
})
