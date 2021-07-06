import { Actions } from 'src/stableToken/actions'
import { initialState, reducer } from 'src/stableToken/reducer'
import { Currency } from 'src/utils/currencies'

describe('stableToken reducer', () => {
  it('should return the initial state', () => {
    // @ts-ignore
    expect(reducer(undefined, {})).toEqual(initialState)
  })

  it('should set the current balance', () => {
    expect(
      reducer(undefined, {
        type: Actions.SET_BALANCE,
        balances: { [Currency.Dollar]: '10', [Currency.Euro]: null },
      })
    ).toEqual({
      ...initialState,
      balances: { [Currency.Dollar]: '10', [Currency.Euro]: null },
      lastFetch: expect.any(Number),
    })
  })

  it('should set education completed', () => {
    expect(
      reducer(undefined, {
        type: Actions.SET_EDUCATION_COMPLETED,
        educationCompleted: true,
      })
    ).toEqual({
      ...initialState,
      educationCompleted: true,
    })
  })
})
