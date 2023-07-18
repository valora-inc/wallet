import { Actions } from 'src/stableToken/actions'
import { tokenTransferFactory } from 'src/tokens/saga'
import { spawn } from 'typed-redux-saga/macro'

const tag = 'stableToken/saga'

export const stableTokenTransferLegacy = tokenTransferFactory({
  actionName: Actions.TRANSFER,
  tag,
})

export function* stableTokenSaga() {
  yield* spawn(stableTokenTransferLegacy)
}
