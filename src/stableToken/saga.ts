import { stableTokenTransferLegacySaga } from 'src/tokens/saga'
import { spawn } from 'typed-redux-saga'

export function* stableTokenSaga() {
  yield* spawn(stableTokenTransferLegacySaga)
}
