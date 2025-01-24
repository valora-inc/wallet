import { initializeSentryUserContext } from 'src/sentry/Sentry'
import { Actions } from 'src/sentry/actions'
import { call, take } from 'typed-redux-saga'

export function* sentrySaga() {
  yield* take(Actions.INITIALIZE_SENTRY_USER_CONTEXT)
  yield* call(initializeSentryUserContext)
}
