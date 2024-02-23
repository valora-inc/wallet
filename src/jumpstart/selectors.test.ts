import { showJumstartError, showJumstartLoading } from 'src/jumpstart/selectors'

describe('jumpstart selectors', () => {
  it('should return the correct value for showJumpstartLoading', () => {
    const state: any = {
      jumpstart: {
        showLoading: true,
      },
    }
    expect(showJumstartLoading(state)).toEqual(true)
  })

  it('should return the correct value for showJumpstartError', () => {
    const state: any = {
      jumpstart: {
        showError: true,
      },
    }
    expect(showJumstartError(state)).toEqual(true)
  })
})
