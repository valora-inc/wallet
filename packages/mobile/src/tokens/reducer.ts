import { RehydrateAction } from 'redux-persist'
import { getRehydratePayload, REHYDRATE } from 'src/redux/persist-helper'
import { Actions, ActionTypes } from 'src/tokens/actions'

export interface Token {
  address: string
  decimals: number
  imageUrl: string
  name: string
  symbol: string
}

export interface TokenBalance extends Token {
  balance: number
}

export interface TokenBalances {
  [address: string]: TokenBalance
}

export interface State {
  tokenBalances: TokenBalances
}

export const initialState = {
  tokenBalances: {},
}

export const reducer = (state: State = initialState, action: ActionTypes | RehydrateAction) => {
  switch (action.type) {
    case REHYDRATE: {
      return {
        ...state,
        ...getRehydratePayload(action, 'tokens'),
      }
    }
    case Actions.SET_TOKEN_BALANCES:
      return {
        ...state,
        tokenBalances: action.balances,
      }
    default:
      return state
  }
}
