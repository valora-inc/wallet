import { Actions, ActionTypes } from 'src/stableToken/actions'
import { Currency, StableCurrency } from 'src/utils/currencies'

export type StableBalances = {
  [currency in StableCurrency]: string | null
}
export interface State {
  balances: StableBalances
  lastFetch: number | null
  educationCompleted: boolean
}

export const initialState = {
  balances: {
    [Currency.Dollar]: null,
    [Currency.Euro]: null,
  },
  lastFetch: null,
  educationCompleted: false,
}

export const reducer = (state: State | undefined = initialState, action: ActionTypes): State => {
  switch (action.type) {
    case Actions.SET_BALANCE:
      return {
        ...state,
        balances: {
          ...state.balances,
          ...action.balances,
        },
        lastFetch: Date.now(),
      }
    case Actions.SET_EDUCATION_COMPLETED:
      return {
        ...state,
        educationCompleted: action.educationCompleted,
      }
    default:
      return state
  }
}
