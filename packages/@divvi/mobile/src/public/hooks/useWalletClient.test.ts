import { renderHook, waitFor } from '@testing-library/react-native'
import { getWalletClient } from '../getWalletClient'
import { useWalletClient } from './useWalletClient'

jest.mock('../getWalletClient')
const mockGetWalletClient = jest.mocked(getWalletClient)

// This test focuses on the key integration points of the hook, avoiding testing react-async-hook which is already tested
describe('useWalletClient', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetWalletClient.mockReset()
  })

  it('should get wallet client and expose result', async () => {
    const mockWalletClient = {} as any
    mockGetWalletClient.mockResolvedValueOnce(mockWalletClient)

    const { result } = renderHook(() => useWalletClient({ networkId: 'celo-alfajores' }))

    await waitFor(() => expect(result.current.data).toEqual(mockWalletClient))
    expect(mockGetWalletClient).toHaveBeenCalledTimes(1)
    expect(result.current.status).toEqual('success')
  })

  it('should expose errors when getting wallet client fails', async () => {
    const mockError = new Error('Failed to get wallet client')
    mockGetWalletClient.mockRejectedValueOnce(mockError)

    const { result } = renderHook(() => useWalletClient({ networkId: 'celo-alfajores' }))

    await waitFor(() => expect(result.current.error).toBe(mockError))
    expect(result.current.status).toEqual('error')
  })
})
