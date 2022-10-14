import { Actions as MapActions } from 'src/map/actions'
import { Actions, ActionTypes } from 'src/vendors/actions'
import { Vendor, Vendors } from 'src/vendors/types'

export interface State {
  allVendors: Vendors
  loading: boolean
  currentVendor: Vendor | undefined
}

export const initialState = {
  allVendors: {},
  loading: false,
  currentVendor: undefined,
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
    case Actions.SET_CURRENT_VENDOR:
      return {
        ...state,
        currentVendor: action.currentVendor,
      }
    case MapActions.SET_CURRENT_FOOD_FOREST:
      return {
        ...state,
        currentVendor: undefined,
      }
    default:
      return state
  }
}
