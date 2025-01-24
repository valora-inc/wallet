import { REHYDRATE, RehydrateAction } from 'redux-persist'
import { ActionTypes, Actions } from 'src/networkInfo/actions'
import { UserLocationData } from 'src/networkInfo/saga'

interface State {
  connected: boolean // True if the phone thinks it has a data connection (cellular/Wi-Fi), false otherwise.
  rehydrated: boolean
  userLocationData: UserLocationData
}

const initialState = {
  connected: false,
  rehydrated: false,
  userLocationData: {
    countryCodeAlpha2: null,
    region: null,
    ipAddress: null,
  },
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
    case Actions.UPDATE_USER_LOCATION_DATA:
      return {
        ...state,
        userLocationData: action.userLocationData,
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
