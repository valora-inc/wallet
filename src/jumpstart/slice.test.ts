import reducer, {
  jumpstartClaimFailed,
  jumpstartClaimStarted,
  jumpstartClaimSucceeded,
  jumpstartErrorDismissed,
  jumpstartLoadingDismissed,
} from 'src/jumpstart/slice'

describe('Wallet Jumpstart', () => {
  it('should handle jumpstart claim start', () => {
    const updatedState = reducer(undefined, jumpstartClaimStarted())

    expect(updatedState).toHaveProperty('claimStatus', 'loading')
  })

  it('should handle jumpstart claim success', () => {
    const updatedState = reducer(undefined, jumpstartClaimSucceeded())

    expect(updatedState).toHaveProperty('claimStatus', 'idle')
  })

  it('should handle jumpstart claim failure', () => {
    const updatedState = reducer(undefined, jumpstartClaimFailed())

    expect(updatedState).toHaveProperty('claimStatus', 'error')
  })

  it('should handle jumpstart loading dismiss', () => {
    const updatedState = reducer(undefined, jumpstartLoadingDismissed())

    expect(updatedState).toHaveProperty('claimStatus', 'idle')
  })

  it('should handle jumpstart error dismiss', () => {
    const updatedState = reducer(undefined, jumpstartErrorDismissed())

    expect(updatedState).toHaveProperty('claimStatus', 'idle')
  })
})
