import { combineReducers } from 'redux'
import { reducer as reducerV1, State as stateV1 } from 'src/walletConnect/v1/reducer'

export interface State {
  v1: stateV1
}

export const reducer = combineReducers({ v1: reducerV1 })
