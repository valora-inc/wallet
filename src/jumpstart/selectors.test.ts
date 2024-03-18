import { showJumstartClaimError, showJumstartClaimLoading } from 'src/jumpstart/selectors'

describe('jumpstart selectors', () => {
  it('should return the correct value for showJumpstartLoading', () => {
    const state: any = {
      jumpstart: {
        claimStatus: 'loading',
      },
    }
    expect(showJumstartClaimLoading(state)).toEqual(true)
  })

  it('should return the correct value for showJumpstartError', () => {
    const state: any = {
      jumpstart: {
        claimStatus: 'error',
      },
    }
    expect(showJumstartClaimError(state)).toEqual(true)
  })
})
