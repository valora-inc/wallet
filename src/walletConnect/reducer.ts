import { combineReducers } from 'redux'
import { reducer as reducerV1, State as stateV1 } from 'src/walletConnect/v1/reducer'
import { reducer as reducerV2, State as stateV2 } from 'src/walletConnect/v2/reducer'

export interface State {
  v1: stateV1
  v2: stateV2
}

export const reducer = combineReducers({ v1: reducerV1, v2: reducerV2 })
