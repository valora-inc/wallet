import { SetCurrentFoodForestAction } from 'src/map/actions'
import { Vendor, Vendors } from 'src/vendors/types'

export enum Actions {
  FETCH_VENDORS = 'VENDORS/FETCH_VENDORS',
  SET_VENDORS = 'VENDORS/SET_VENDORS',
  SET_LOADING = 'VENDORS/SET_LOADING',
  SET_CURRENT_VENDOR = 'VENDORS/SET_CURRENT_VENDOR',
}

export interface FetchVendorsAction {
  type: Actions.FETCH_VENDORS
}

export interface SetLoadingAction {
  type: Actions.SET_LOADING
  loading: boolean
}

export interface setVendorsAction {
  type: Actions.SET_VENDORS
  allVendors: Vendors
}

export interface SetCurrentVendorAction {
  type: Actions.SET_CURRENT_VENDOR
  currentVendor: Vendor | undefined
}

export const fetchVendors = (): FetchVendorsAction => ({
  type: Actions.FETCH_VENDORS,
})

export const setVendors = (allVendors: Vendors): setVendorsAction => ({
  type: Actions.SET_VENDORS,
  allVendors,
})

export const setLoading = (loading: boolean): SetLoadingAction => ({
  type: Actions.SET_LOADING,
  loading,
})
export const setCurrentVendor = (currentVendor: Vendor | undefined): SetCurrentVendorAction => ({
  type: Actions.SET_CURRENT_VENDOR,
  currentVendor,
})

export type ActionTypes =
  | FetchVendorsAction
  | setVendorsAction
  | SetLoadingAction
  | SetCurrentVendorAction
  | SetCurrentFoodForestAction
