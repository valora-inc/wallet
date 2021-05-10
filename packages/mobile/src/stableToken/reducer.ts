import { Actions, ActionTypes } from 'src/stableToken/actions'

export interface State {
  balance: string | null // For legacy reasons, balance alone is cUsdBalance
  cEurBalance: string | null
  lastFetch: number | null
  educationCompleted: boolean
}

export const initialState = {
  balance: null,
  cEurBalance: null,
  lastFetch: null,
  educationCompleted: false,
}

export const reducer = (state: State | undefined = initialState, action: ActionTypes): State => {
  switch (action.type) {
    case Actions.SET_BALANCE:
      return {
        ...state,
        balance: action.cUsdBalance ?? state.balance,
        cEurBalance: action.cEurBalance ?? state.cEurBalance,
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
