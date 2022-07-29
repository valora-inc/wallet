import { Actions, ActionTypes } from 'src/vendors/actions'
import { Vendor } from 'src/vendors/types'

export interface State {
  vendors: { [name: string]: Vendor | null }
  loading: boolean
}

export const initialState = {
  vendors: {},
  loading: false,
}

export const reducer = (state: State | undefined = initialState, action: ActionTypes): State => {
  switch (action.type) {
    case Actions.SET_VENDORS:
      return {
        ...state,
        vendors: {
          ...action.vendors,
        },
      }
    case Actions.SET_LOADING:
      return {
        ...state,
        loading: action.loading,
      }
    default:
      return state
  }
}
