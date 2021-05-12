import { REHYDRATE, RehydrateAction } from 'redux-persist'
import { Actions, ActionTypes } from 'src/networkInfo/actions'

export interface State {
  connected: boolean // True if the phone thinks it has a data connection (cellular/Wi-Fi), false otherwise.
  rehydrated: boolean
  networkCountry: string | null
}

const initialState = {
  connected: false,
  rehydrated: false,
  networkCountry: null,
}

export const reducer = (
  state: State | undefined = initialState,
  action: ActionTypes | RehydrateAction
): State => {
  switch (action.type) {
    case Actions.SET_CONNECTED:
      return {
        ...state,
        connected: action.connected,
      }
    case Actions.SET_NETWORK_COUNTRY:
      return {
        ...state,
        networkCountry: action.country,
      }
    case REHYDRATE:
      return {
        ...state,
        rehydrated: true,
      }
    default:
      return state
  }
}
