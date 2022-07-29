import { call, put, spawn, take } from 'redux-saga/effects'
import { getVendors } from 'src/api/vendors'
import { formatVendors } from 'src/utils/formatVendors'
import { Actions, setLoading, setVendors } from 'src/vendors/actions'

export function* watchFetchVendors(): any {
  while (true) {
    yield take(Actions.FETCH_VENDORS)
    yield put(setLoading(true))
    const vendors: any = yield call(getVendors)

    const formattedVendorObject = formatVendors(vendors)
    yield put(setVendors(formattedVendorObject))
    yield put(setLoading(false))
  }
}

export function* vendorsSaga() {
  yield spawn(watchFetchVendors)
}
