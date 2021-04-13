import { Actions } from 'src/account/actions'
import { initialState, reducer } from 'src/account/reducer'
import { DEFAULT_DAILY_PAYMENT_LIMIT_CUSD } from 'src/config'

const UPDATE_OVER_LIMIT = DEFAULT_DAILY_PAYMENT_LIMIT_CUSD + 1
const UPDATE_BELOW_LIMIT = DEFAULT_DAILY_PAYMENT_LIMIT_CUSD - 1

describe('account reducer', () => {
  it('should return the initial state', () => {
    // @ts-ignore
    expect(reducer(undefined, {})).toEqual(initialState)
  })

  it('should update the daily limit if greater than daily limit', () => {
    expect(
      reducer(initialState, {
        type: Actions.UPDATE_DAILY_LIMIT,
        newLimit: UPDATE_OVER_LIMIT,
      })
    ).toEqual({
      ...initialState,
      dailyLimitCusd: UPDATE_OVER_LIMIT,
    })
  })

  it('should set the daily limit to default if lower than daily limit', () => {
    expect(
      reducer(initialState, {
        type: Actions.UPDATE_DAILY_LIMIT,
        newLimit: UPDATE_BELOW_LIMIT,
      })
    ).toEqual({
      ...initialState,
      dailyLimitCusd: DEFAULT_DAILY_PAYMENT_LIMIT_CUSD,
    })
  })
})
