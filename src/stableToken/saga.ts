import { all, call, spawn, take, select } from 'redux-saga/effects'
import { Actions, setBalance } from 'src/stableToken/actions'
import { fetchToken, tokenTransferFactory } from 'src/tokens/saga'
import { Currency } from 'src/utils/currencies'
import { TokenBalance } from 'src/tokens/reducer'
import { tokensByUsdBalanceSelector } from 'src/tokens/selectors'
const tag = 'stableToken/saga'

export function* watchFetchStableBalances() {
  while (true) {
    yield take(Actions.FETCH_BALANCE)
    const [cUsdBalance, cEurBalance]: [string | undefined, string | undefined] = yield all([
      call(fetchToken, Currency.Dollar, tag),
      call(fetchToken, Currency.Euro, tag),
    ])
    const tokens: TokenBalance[] = yield select(tokensByUsdBalanceSelector)
    const cRealBalance = tokens.filter((token) => token.symbol === 'CREAL')[0].balance.toString() //TODO check CREAL or CBRL
    yield setBalance({
      [Currency.Dollar]: cUsdBalance ?? null,
      [Currency.Euro]: cEurBalance ?? null,
      [Currency.Real]: cRealBalance ?? null,
    })
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
