import { RootState } from 'src/redux/reducers'
import { Vendor, VendorWithLocation } from 'src/vendors/types'

export const searchQuerySelector = (state: RootState): string => state.map.searchQuery

export const filteredVendorsSelector = (state: RootState): (Vendor | VendorWithLocation)[] =>
  state.map.filteredVendors
