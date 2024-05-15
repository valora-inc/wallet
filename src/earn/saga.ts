import { PayloadAction } from '@reduxjs/toolkit'
import { depositStart, depositSuccess } from 'src/earn/slice'
import { DepositInfo } from 'src/earn/types'
import { navigateHome } from 'src/navigator/NavigationService'
import { safely } from 'src/utils/safely'
import { put, takeLeading } from 'typed-redux-saga'

export function* depositSubmitSaga(action: PayloadAction<DepositInfo>) {
  // todo(act-1178): submit the tx
  yield* put(depositSuccess())
  navigateHome()
}

export function* earnSaga() {
  yield* takeLeading(depositStart.type, safely(depositSubmitSaga))
}
