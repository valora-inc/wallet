import { map } from 'lodash'
import { fork, put, select, spawn, takeEvery, takeLatest } from 'redux-saga/effects'
import { Actions as AppActions } from 'src/app/actions'
import { Actions, setFilteredVendors, setFoodForests, setSearchQuery } from 'src/map/actions'
import { FoodForest } from 'src/map/constants'
import { FoodForests } from 'src/map/types'
import { filterVendors } from 'src/map/utils'
import { watchFetchVendors } from 'src/vendors/saga'
import { vendorsSelector } from 'src/vendors/selector'

const TAG = 'map/saga'

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

export function* mapSaga() {
  yield spawn(mapServiceSaga)
  yield spawn(mapSearchSaga)
}
