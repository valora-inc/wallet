import { renderHook } from '@testing-library/react-native'
import { getPublicClient } from '../getPublicClient'
import { usePublicClient } from './usePublicClient'

// Mock the getPublicClient function
jest.mock('../getPublicClient')

describe('usePublicClient', () => {
  const mockPublicClient = {} as any

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()
    // Setup the mock return value
    jest.mocked(getPublicClient).mockReturnValue(mockPublicClient)
  })

  it('should return public client for the given networkId', () => {
    const { result } = renderHook(() => usePublicClient({ networkId: 'celo-alfajores' }))

    expect(getPublicClient).toHaveBeenCalledWith({ networkId: 'celo-alfajores' })
    expect(result.current).toBe(mockPublicClient)
  })
})
