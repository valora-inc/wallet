import {
  fetchCoinbasePaySenders,
  fetchInviteRewardsSenders,
  fetchRewardsSenders,
} from 'src/firebase/firebase'
import {
  coinbasePaySendersFetched,
  inviteRewardsSendersFetched,
  rewardsSendersFetched,
} from 'src/recipients/reducer'
import Logger from 'src/utils/Logger'
import { call, cancelled, put, spawn, take } from 'typed-redux-saga'

const TAG = 'recipientsSaga'

function* fetchRewardsSendersSaga() {
  const rewardsSendersChannel = yield* call(fetchRewardsSenders)
  if (!rewardsSendersChannel) {
    return
  }
  try {
    while (true) {
      const rewardsSenders = (yield* take(rewardsSendersChannel)) as string[]
      yield* put(rewardsSendersFetched(rewardsSenders))
    }
  } catch (error) {
    Logger.error(`${TAG}@fetchRewardsSendersSaga`, 'Failed to fetch rewards senders', error)
  } finally {
    if (yield* cancelled()) {
      rewardsSendersChannel.close()
    }
  }
}

function* fetchInviteRewardsSendersSaga() {
  const rewardsSendersChannel = yield* call(fetchInviteRewardsSenders)
  if (!rewardsSendersChannel) {
    return
  }
  try {
    while (true) {
      const rewardsSenders = (yield* take(rewardsSendersChannel)) as string[]
      yield* put(inviteRewardsSendersFetched(rewardsSenders))
      Logger.info(`${TAG}@fetchInviteRewardsSendersSaga`, rewardsSenders)
    }
  } catch (error) {
    Logger.error(
      `${TAG}@fetchInviteRewardsSendersSaga`,
      'Failed to fetch invite rewards senders',
      error
    )
  } finally {
    if (yield* cancelled()) {
      rewardsSendersChannel.close()
    }
  }
}

function* fetchCoinbasePaySendersSaga() {
  const coinbasePaySendersChannel = yield* call(fetchCoinbasePaySenders)
  if (!coinbasePaySendersChannel) {
    return
  }
  try {
    while (true) {
      const coinbasePaySenders = (yield* take(coinbasePaySendersChannel)) as string[]
      yield* put(coinbasePaySendersFetched(coinbasePaySenders))
      Logger.info(`${TAG}@fetchCoinbasePaySendersSaga`, coinbasePaySenders)
    }
  } catch (error) {
    Logger.error(
      `${TAG}@fetchCoinbasePaySendersSaga`,
      'Failed to fetch coinbase pay senders',
      error
    )
  } finally {
    if (yield* cancelled()) {
      coinbasePaySendersChannel.close()
    }
  }
}

export function* recipientsSaga() {
  yield* spawn(fetchRewardsSendersSaga)
  yield* spawn(fetchInviteRewardsSendersSaga)
  yield* spawn(fetchCoinbasePaySendersSaga)
}
