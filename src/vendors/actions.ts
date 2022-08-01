import { Vendors } from 'src/vendors/types'

export enum Actions {
  FETCH_VENDORS = 'VENDORS/FETCH_VENDORS',
  SET_VENDORS = 'VENDORS/SET_VENDORS',
  SET_LOADING = 'VENDORS/SET_LOADING',
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

export type ActionTypes = FetchVendorsAction | setVendorsAction | SetLoadingAction

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
