import { spawn, takeEvery } from 'redux-saga/effects'
import { Actions, StartFCTransferOutAction } from 'src/fiatconnect/actions'

function* startFiatConnectTransferOut({
  fiatConnectQuote,
  quoteId,
  fiatAccountId,
}: StartFCTransferOutAction) {}

function* watchFiatConnectTransactions() {
  yield takeEvery(Actions.START_FC_TRANSFER_OUT, startFiatConnectTransferOut)
}
export function* fiatConnectSaga() {
  yield spawn(watchFiatConnectTransactions)
}
