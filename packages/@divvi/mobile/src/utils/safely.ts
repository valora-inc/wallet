import Logger from 'src/utils/Logger'

/**
 * Helper to wrap sagas and ensure unhandled errors don't bubble up any further.
 * This is especially useful for sagas called by takeEvery/takeLatest/takeLeading
 * to avoid unhandled exceptions from cancelling them.
 * See more details: https://github.com/valora-inc/wallet/tree/main/WALLET.md#redux-saga-pitfalls
 *
 * Example usage: yield takeEvery('SOME_ACTION', safely(someHandler))
 *
 * @param saga The saga to wrap
 */
export function safely<Fn extends (...args: any[]) => any>(saga: Fn) {
  return function* (...args: Parameters<Fn>) {
    try {
      yield saga(...args)
    } catch (err) {
      try {
        Logger.error('utils/safely', 'Unhandled error in wrapped saga', err)
      } catch (err2) {
        try {
          // eslint-disable-next-line no-console
          console.error('Something is broken, this should never happen', err, err2)
        } catch {
          // Nothing else we can do here
        }
      }
    }
  }
}
