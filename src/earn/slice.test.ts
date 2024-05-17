import reducer, { depositCancel, depositError, depositStart, depositSuccess } from './slice'

describe('Earn Slice', () => {
  it('should handle deposit start', () => {
    const updatedState = reducer(
      undefined,
      depositStart({ amount: '100', tokenId: 'tokenId', preparedTransactions: [] })
    )

    expect(updatedState).toHaveProperty('depositStatus', 'started')
  })

  it('should handle deposit success', () => {
    const updatedState = reducer(undefined, depositSuccess())

    expect(updatedState).toHaveProperty('depositStatus', 'success')
  })

  it('should handle deposit error', () => {
    const updatedState = reducer(undefined, depositError())

    expect(updatedState).toHaveProperty('depositStatus', 'error')
  })

  it('should handle deposit cancel', () => {
    const updatedState = reducer(undefined, depositCancel())

    expect(updatedState).toHaveProperty('depositStatus', 'idle')
  })
})
