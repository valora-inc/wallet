import { Actions, ActionTypes } from 'src/vendors/actions'
import { Vendors } from 'src/vendors/types'

export interface State {
  allVendors: Vendors
  loading: boolean
}

export const initialState = {
  allVendors: {},
  loading: false,
}

export const reducer = (state: State | undefined = initialState, action: ActionTypes): State => {
  switch (action.type) {
    case Actions.SET_VENDORS:
      return {
        ...state,
        allVendors: {
          ...action.allVendors,
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
