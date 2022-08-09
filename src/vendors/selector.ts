import { filter } from 'lodash'
import { createSelector } from 'reselect'
import { RootState } from 'src/redux/reducers'
import { Vendor, Vendors, VendorWithLocation } from 'src/vendors/types'
import { hasValidLocation } from 'src/vendors/utils'

export const vendorsSelector = (state: RootState): Vendors => state.vendors.allVendors

export const vendorLoadingSelector = (state: RootState): boolean => state.vendors.loading

export const currentVendorSelector = (state: RootState): Vendor | undefined =>
  state.vendors.currentVendor

export const vendorsWithLocationSelector = createSelector([vendorsSelector], (vendors: Vendors) => {
  return filter(vendors, (vendor: Vendor) =>
    hasValidLocation(vendor as VendorWithLocation)
  ) as VendorWithLocation[]
})
