import Geolocation from '@react-native-community/geolocation'
import { map } from 'lodash'
import { LatLng } from 'react-native-maps'
import { fork, put, select, spawn, takeEvery, takeLatest } from 'redux-saga/effects'
import { Actions as AppActions } from 'src/app/actions'
import { activeScreenSelector } from 'src/app/selectors'
import {
  Actions,
  setFilteredVendors,
  setFoodForests,
  setLocationError,
  setSearchQuery,
  setUserLocation,
} from 'src/map/actions'
import { FoodForest } from 'src/map/constants'
import { FoodForests } from 'src/map/types'
import { filterVendors } from 'src/map/utils'
import { Screens } from 'src/navigator/Screens'
import { watchFetchVendors } from 'src/vendors/saga'
import { vendorsSelector } from 'src/vendors/selector'

function* watchMapFilter(action: any): any {
  const vendors = yield select(vendorsSelector)
  const filteredVendors = filterVendors(action.searchQuery, vendors)
  yield put(setFilteredVendors(filteredVendors))
}

function* resetMapFilter(): any {
  yield put(setSearchQuery(''))
}

export function* watchFetchFoodForests() {
  const foodForests: FoodForests = Object.assign(
    {},
    ...map(FoodForest, (forest: any) => {
      return {
        [forest.data.name]: {
          ...forest,
          title: forest.data.name.replace(/_/g, ' '),
        },
      }
    })
  )

  yield put(setFoodForests(foodForests))
}

export function* mapServiceSaga() {
  yield fork(watchFetchVendors)
  yield fork(watchFetchFoodForests)
}

export function* mapSearchSaga() {
  yield takeEvery(Actions.SET_SEARCH_QUERY, watchMapFilter)
  yield takeLatest(AppActions.ACTIVE_SCREEN_CHANGED, resetMapFilter)
}

export function* findUserLocation(): any {
  const activeScreen = yield select(activeScreenSelector)
  if (activeScreen !== Screens.Map) return

  let error: any
  let coordinates: LatLng | undefined = undefined
  Geolocation.getCurrentPosition(
    (position) => {
      coordinates = position.coords as LatLng
    },
    (_error) => {
      error = _error
    },
    {
      enableHighAccuracy: true,
    }
  )
  if (error && !coordinates) yield put(setLocationError(JSON.stringify(error)))
  yield put(setUserLocation(coordinates || {}))
}

export function* mapSaga() {
  yield spawn(mapServiceSaga)
  yield spawn(mapSearchSaga)
  yield takeLatest(AppActions.ACTIVE_SCREEN_CHANGED, findUserLocation)
}
