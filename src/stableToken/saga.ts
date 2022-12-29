import { all, call, put, spawn, take } from 'redux-saga/effects'
import { Actions, setBalance } from 'src/stableToken/actions'
import { fetchToken, tokenTransferFactory } from 'src/tokens/saga'
import { Currency } from 'src/utils/currencies'

const tag = 'stableToken/saga'

export function* watchFetchStableBalances() {
  while (true) {
    yield take(Actions.FETCH_BALANCE)
    const [cUsdBalance, cEurBalance, cRealBalance]: [
      string | undefined,
      string | undefined,
      string | undefined
    ] = yield all([
      call(fetchToken, Currency.Dollar, tag),
      call(fetchToken, Currency.Euro, tag),
      call(fetchToken, Currency.Real, tag),
    ])
    yield put(
      setBalance({
        [Currency.Dollar]: cUsdBalance ?? null,
        [Currency.Euro]: cEurBalance ?? null,
        [Currency.Real]: cRealBalance ?? null,
      })
    )
  }
}

export const stableTokenTransfer = tokenTransferFactory({
  actionName: Actions.TRANSFER,
  tag,
})

export function* stableTokenSaga() {
  yield spawn(watchFetchStableBalances)
  yield spawn(stableTokenTransfer)
}
