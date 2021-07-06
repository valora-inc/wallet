import { call, cancelled, put, spawn, take } from 'redux-saga/effects'
import { fetchRewardsSenders } from 'src/firebase/firebase'
import { rewardsSendersFetched } from 'src/recipients/reducer'
import Logger from 'src/utils/Logger'

const TAG = 'recipientsSaga'

function* fetchRewardsSendersSaga() {
  const rewardsSendersChannel = yield call(fetchRewardsSenders)
  if (!rewardsSendersChannel) {
    return
  }
  try {
    while (true) {
      const rewardsSenders: string[] = yield take(rewardsSendersChannel)
      yield put(rewardsSendersFetched(rewardsSenders))
      Logger.info(`${TAG}@fetchRewardsSendersSaga`, rewardsSenders)
    }
  } catch (error) {
    Logger.error(`${TAG}@fetchRewardsSendersSaga`, error)
  } finally {
    if (yield cancelled()) {
      rewardsSendersChannel.close()
    }
  }
}

export function* recipientsSaga() {
  yield spawn(fetchRewardsSendersSaga)
}
