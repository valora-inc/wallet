import { put, select, takeEvery, takeLatest } from 'redux-saga/effects'
import { Actions as AppActions } from 'src/app/actions'
import { Actions, setFilteredVendors, setSearchQuery } from 'src/map/actions'
import { filterVendors } from 'src/map/utils'
import { vendorsSelector } from 'src/vendors/selector'

function* watchMapFilter(action: any): any {
  const vendors = yield select(vendorsSelector)
  const filteredVendors = filterVendors(action.searchQuery, vendors)
  yield put(setFilteredVendors(filteredVendors))
}

function* resetMapFilter(): any {
  yield put(setSearchQuery(''))
}

export function* mapSaga() {
  yield takeEvery(Actions.SET_SEARCH_QUERY, watchMapFilter)
  yield takeLatest(AppActions.ACTIVE_SCREEN_CHANGED, resetMapFilter)
}
