import { LatLng } from 'react-native-maps'
import { MapCategory } from 'src/map/constants'
import { FoodForest, FoodForests } from 'src/map/types'
import { SetCurrentVendorAction } from 'src/vendors/actions'
import { Vendor, VendorWithLocation } from 'src/vendors/types'

export enum Actions {
  SET_USER_LOCATION = 'MAP/SET_USER_LOCATION',
  SET_CATEGORY = 'MAP/SET_CATEGORY',
  REMOVE_CATEGORY = 'MAP/REMOVE_CATEGORY',
  SET_FILTERED_VENDORS = 'MAP/SET_FILTERED_VENDORS',
  SET_SEARCH_QUERY = 'MAP/SET_SEARCH_QUERY',
  SET_FOOD_FORESTS = 'MAP/SET_FOOD_FORESTS',
  SET_CURRENT_FOOD_FOREST = 'MAP/SET_CURRENT_FOOD_FOREST',
  SET_LOCATION_ERROR = 'MAP/SET_LOCATION_ERROR',
}

export interface InitializeUserLocationAction {
  type: Actions.SET_USER_LOCATION
  location: LatLng | {}
}

export interface LocationErrorAction {
  type: Actions.SET_LOCATION_ERROR
  error: string
}

export interface SetMapCategoryAction {
  type: Actions.SET_CATEGORY
  category: MapCategory
}

export interface RemoveMapCategoryAction {
  type: Actions.REMOVE_CATEGORY
  category: MapCategory
}

export interface SetSearchQueryAction {
  type: Actions.SET_SEARCH_QUERY
  searchQuery: string
}

export interface SetFoodForestsAction {
  type: Actions.SET_FOOD_FORESTS
  foodForests: FoodForests
}

export interface SetCurrentFoodForestAction {
  type: Actions.SET_CURRENT_FOOD_FOREST
  foodForest: FoodForest | undefined
}

export interface SetFilteredVendorsAction {
  type: Actions.SET_FILTERED_VENDORS
  filteredVendors: (Vendor | VendorWithLocation)[]
}

export const setUserLocation = (location: LatLng | {}) => ({
  type: Actions.SET_USER_LOCATION,
  location,
})

export const setLocationError = (error: string) => ({
  type: Actions.SET_LOCATION_ERROR,
  error,
})

export const setMapCategory = (category: MapCategory) => ({
  type: Actions.SET_CATEGORY,
  category,
})

export const removeMapCategory = (category: MapCategory) => ({
  type: Actions.REMOVE_CATEGORY,
  category,
})

export const setSearchQuery = (searchQuery: string): SetSearchQueryAction => ({
  type: Actions.SET_SEARCH_QUERY,
  searchQuery,
})

export const setFilteredVendors = (
  filteredVendors: (Vendor | VendorWithLocation)[]
): SetFilteredVendorsAction => ({
  type: Actions.SET_FILTERED_VENDORS,
  filteredVendors,
})

export const setFoodForests = (foodForests: FoodForests): SetFoodForestsAction => ({
  type: Actions.SET_FOOD_FORESTS,
  foodForests,
})

export const setFoodForest = (foodForest: FoodForest | undefined): SetCurrentFoodForestAction => ({
  type: Actions.SET_CURRENT_FOOD_FOREST,
  foodForest,
})

export type ActionTypes =
  | SetFilteredVendorsAction
  | SetSearchQueryAction
  | SetMapCategoryAction
  | SetFoodForestsAction
  | SetCurrentFoodForestAction
  | SetCurrentVendorAction
  | RemoveMapCategoryAction
  | InitializeUserLocationAction
  | LocationErrorAction
