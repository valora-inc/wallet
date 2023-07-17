import { spawn } from 'typed-redux-saga'
import { Actions } from 'src/stableToken/actions'
import { tokenTransferFactory } from 'src/tokens/saga'

const tag = 'stableToken/saga'

export const stableTokenTransferLegacy = tokenTransferFactory({
  actionName: Actions.TRANSFER,
  tag,
})

export function* stableTokenSaga() {
  yield* spawn(stableTokenTransferLegacy)
}
