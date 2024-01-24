import reducer, {
  State,
  swapCancel,
  swapError,
  swapStart,
  swapSuccess,
  updateLastSwappedTokens,
} from 'src/swap/slice'
import { SwapInfo } from 'src/swap/types'
import { mockCeloTokenId, mockCeurTokenId } from 'test/values'

describe('updateLastSwappedTokens', () => {
  it('should add new tokens to the end of current tokens list', () => {
    const tokenIds = ['token1', 'token2']
    const newTokenIds = ['token3', 'token4']

    updateLastSwappedTokens(tokenIds, newTokenIds)

    expect(tokenIds).toEqual(['token1', 'token2', 'token3', 'token4'])
  })

  it('should not add duplicated new tokens more than once', () => {
    const tokenIds = ['token1', 'token2']
    const newTokenIds = ['token3', 'token3', 'token3']

    updateLastSwappedTokens(tokenIds, newTokenIds)

    expect(tokenIds).toEqual(['token1', 'token2', 'token3'])
  })

  it('should not add duplicate tokens, but move them to the end', () => {
    const tokenIds = ['token1', 'token2', 'token3', 'token4', 'token5']
    const newTokenIds = ['token2', 'token3']

    updateLastSwappedTokens(tokenIds, newTokenIds)

    expect(tokenIds).toEqual(['token1', 'token4', 'token5', 'token2', 'token3'])
  })

  it('should limit the number of tokens to MAX_TOKEN_COUNT', () => {
    const tokenIds = [
      'token1',
      'token2',
      'token3',
      'token4',
      'token5',
      'token6',
      'token7',
      'token8',
      'token9',
      'token10',
    ]
    const newTokenIds = ['token11', 'token12']

    updateLastSwappedTokens(tokenIds, newTokenIds)

    expect(tokenIds).toEqual([
      'token3',
      'token4',
      'token5',
      'token6',
      'token7',
      'token8',
      'token9',
      'token10',
      'token11',
      'token12',
    ])
  })
})

describe('reducer', () => {
  it('should handle swapStart', () => {
    const initialState = {
      currentSwap: null,
    } as unknown as State

    const action = swapStart({ swapId: 'test-swap-id' } as SwapInfo)

    const resultState = reducer(initialState, action) as State
    expect(resultState).toEqual({
      currentSwap: { id: 'test-swap-id', status: 'started' },
    })
  })

  it('should handle swapSuccess', () => {
    const initialState = {
      currentSwap: { id: 'test-swap-id', status: 'started' },
      lastSwapped: [],
    } as unknown as State

    const action = swapSuccess({
      swapId: 'test-swap-id',
      fromTokenId: mockCeurTokenId,
      toTokenId: mockCeloTokenId,
    })

    const resultState = reducer(initialState, action) as State
    expect(resultState).toEqual({
      currentSwap: { id: 'test-swap-id', status: 'success' },
      lastSwapped: [mockCeurTokenId, mockCeloTokenId],
    })
  })

  it('should handle swapError', () => {
    const initialState = {
      currentSwap: { id: 'test-swap-id', status: 'started' },
    } as unknown as State

    const action = swapError('test-swap-id')

    const resultState = reducer(initialState, action) as State
    expect(resultState).toEqual({
      currentSwap: { id: 'test-swap-id', status: 'error' },
    })
  })

  it('should handle swapCancel', () => {
    const initialState = {
      currentSwap: { id: 'test-swap-id', status: 'started' },
    } as unknown as State

    const action = swapCancel('test-swap-id')

    const resultState = reducer(initialState, action) as State
    expect(resultState).toEqual({
      currentSwap: { id: 'test-swap-id', status: 'idle' },
    })
  })
})
