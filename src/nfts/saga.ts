import { call, spawn, take } from 'redux-saga/effects'
import { onSave, onShare } from 'src/nfts/utils'
import Logger from 'src/utils/Logger'
import { Actions, SaveNftAction, ShareNftAction } from './actions'

const TAG = 'NFTSaga'

export function* watchNftShare() {
  while (true) {
    const action: ShareNftAction = yield take(Actions.NFT_SHARE)
    try {
      const result = yield call(onShare, action.nft)
      // Note: when user cancels the share sheet, result contains {"dismissedAction":true}
      Logger.info(TAG, 'Share done', result)
    } catch (error) {
      Logger.error(TAG, 'Error sharing', error)
    }
  }
}

export function* watchNftSave() {
  while (true) {
    const action: SaveNftAction = yield take(Actions.NFT_SAVE)
    try {
      const result = yield call(onSave, action.nft)
      // Note: when user cancels the share sheet, result contains {"dismissedAction":true}
      Logger.info(TAG, 'Save done', result)
    } catch (error) {
      Logger.error(TAG, 'Error saving', error)
    }
  }
}

export function* nftsSaga() {
  yield spawn(watchNftShare)
  yield spawn(watchNftSave)
}
