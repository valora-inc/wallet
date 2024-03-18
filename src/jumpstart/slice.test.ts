import reducer, {
  jumpstartClaimErrorDismissed,
  jumpstartClaimFailed,
  jumpstartClaimLoadingDismissed,
  jumpstartClaimStarted,
  jumpstartClaimSucceeded,
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
    const updatedState = reducer(undefined, jumpstartClaimLoadingDismissed())

    expect(updatedState).toHaveProperty('claimStatus', 'idle')
  })

  it('should handle jumpstart error dismiss', () => {
    const updatedState = reducer(undefined, jumpstartClaimErrorDismissed())

    expect(updatedState).toHaveProperty('claimStatus', 'idle')
  })
})
