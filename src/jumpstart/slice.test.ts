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

    expect(updatedState).toEqual({
      showLoading: true,
      showError: false,
    })
  })

  it('should handle jumpstart claim success', () => {
    const updatedState = reducer(undefined, jumpstartClaimSucceeded())

    expect(updatedState).toEqual({
      showLoading: false,
      showError: false,
    })
  })

  it('should handle jumpstart claim failure', () => {
    const updatedState = reducer(undefined, jumpstartClaimFailed())

    expect(updatedState).toEqual({
      showLoading: false,
      showError: true,
    })
  })

  it('should handle jumpstart loading dismiss', () => {
    const updatedState = reducer(undefined, jumpstartLoadingDismissed())

    expect(updatedState).toHaveProperty('showLoading', false)
  })

  it('should handle jumpstart error dismiss', () => {
    const updatedState = reducer(undefined, jumpstartErrorDismissed())

    expect(updatedState).toHaveProperty('showError', false)
  })
})
