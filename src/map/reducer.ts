import { Actions, ActionTypes } from 'src/map/actions'
import { Vendor, VendorWithLocation } from 'src/vendors/types'

export interface State {
  filteredVendors: (Vendor | VendorWithLocation)[]
  searchQuery: string
}

export const initialState = {
  filteredVendors: [],
  searchQuery: '',
}

export const reducer = (state: State | undefined = initialState, action: ActionTypes): State => {
  switch (action.type) {
    case Actions.SET_FILTERED_VENDORS:
      return {
        ...state,
        filteredVendors: {
          ...action.filteredVendors,
        },
      }
    case Actions.SET_SEARCH_QUERY:
      return {
        ...state,
        searchQuery: action.searchQuery,
      }
    default:
      return state
  }
}
