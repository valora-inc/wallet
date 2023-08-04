import { keylessBackupStarted } from 'src/keylessBackup/slice'
import { spawn, takeLeading } from 'typed-redux-saga'

export function* handleKeylessBackupStarted({ payload }: ReturnType<typeof keylessBackupStarted>) {
  // TODO(ACT-684?): Implement backup/restore flow
}

function* watchKeylessBackupStarted() {
  yield* takeLeading(keylessBackupStarted.type, handleKeylessBackupStarted)
}

export function* keylessBackupSaga() {
  yield* spawn(watchKeylessBackupStarted)
}
