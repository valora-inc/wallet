import { put } from 'redux-saga-test-plan/matchers'
import { call, spawn, takeEvery } from 'redux-saga/effects'
import { Actions, setBalance } from 'src/goldToken/actions'
import { fetchToken, tokenTransferFactory } from 'src/tokens/saga'
import { Currency } from 'src/utils/currencies'

const tag = 'goldToken/saga'

function* fetchCeloBalance() {
  const balance: string | undefined = yield call(fetchToken, Currency.Celo, tag)
  if (balance) {
    yield put(setBalance(balance))
  }
}

function* watchFetchCeloBalance() {
  yield takeEvery(Actions.FETCH_BALANCE, fetchCeloBalance)
}

export const goldTransfer = tokenTransferFactory({
  actionName: Actions.TRANSFER,
  tag,
})

export function* goldTokenSaga() {
  yield spawn(watchFetchCeloBalance)
  yield spawn(goldTransfer)
}
