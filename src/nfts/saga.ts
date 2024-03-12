import { PayloadAction } from '@reduxjs/toolkit'
import { isPast, isToday } from 'date-fns'
import { celebratedNftFound, nftRewardReadyToDisplay } from 'src/home/actions'
import { isSameNftContract } from 'src/home/celebration/utils'
import { NftCelebrationStatus } from 'src/home/reducers'
import { nftCelebrationSelector } from 'src/home/selectors'
import {
  FetchNftsCompletedAction,
  fetchNfts,
  fetchNftsCompleted,
  fetchNftsFailed,
} from 'src/nfts/slice'
import { Nft, NftWithNetworkId } from 'src/nfts/types'
import { getDynamicConfigParams, getFeatureGate } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs, StatsigFeatureGates } from 'src/statsig/types'
import Logger from 'src/utils/Logger'
import { ensureError } from 'src/utils/ensureError'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import { safely } from 'src/utils/safely'
import { Actions } from 'src/web3/actions'
import networkConfig from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'
import { call, put, select, spawn, take, takeLeading } from 'typed-redux-saga'

const TAG = 'NftsSaga'

async function fetchNftsForSupportedNetworks(address: string): Promise<NftWithNetworkId[]> {
  const supportedNetworkIds = getDynamicConfigParams(
    DynamicConfigs[StatsigDynamicConfigs.MULTI_CHAIN_FEATURES]
  ).showNfts
  const nfts = await Promise.all(
    supportedNetworkIds.map(async (networkId) => {
      const response = await fetchWithTimeout(
        `${networkConfig.getNftsByOwnerAddressUrl}?address=${address}&networkId=${networkId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(
          `Unable to fetch NFTs for ${networkId}: ${response.status} ${await response.text()}`
        )
      }

      const { result }: { result: Nft[] } = await response.json()
      return result.map((nft) => ({ ...nft, networkId }))
    })
  )

  return nfts.reduce((acc, nftsByNetwork) => acc.concat(nftsByNetwork), [])
}

export function* handleFetchNfts() {
  const address = yield* select(walletAddressSelector)
  if (!address) {
    Logger.debug(TAG, 'Wallet address not found, skipping NFTs list fetch')
    return
  }

  try {
    const nfts = yield* call(fetchNftsForSupportedNetworks, address)
    yield* put(fetchNftsCompleted({ nfts }))
  } catch (err) {
    const error = ensureError(err)
    Logger.error(TAG, '@handleFetchNfts', error)
    yield* put(fetchNftsFailed({ error: error.message }))
  }
}

export function* findCelebratedNft({ payload: { nfts } }: PayloadAction<FetchNftsCompletedAction>) {
  const featureGateEnabled = getFeatureGate(StatsigFeatureGates.SHOW_NFT_CELEBRATION)
  if (!featureGateEnabled) {
    return
  }

  const {
    celebratedNft,
    rewardExpirationDate: rewardExpirationDateString,
    rewardReminderDate: rewardReminderDateString,
    deepLink,
  } = getDynamicConfigParams(DynamicConfigs[StatsigDynamicConfigs.NFT_CELEBRATION_CONFIG])

  if (!celebratedNft || !celebratedNft.networkId || !celebratedNft.contractAddress) {
    return
  }

  const lastCelebratedNft = yield* select(nftCelebrationSelector)
  if (isSameNftContract(lastCelebratedNft, celebratedNft)) {
    return
  }

  const userOwnsCelebratedNft = nfts.some(
    (nft) => isSameNftContract(nft, celebratedNft) && !!nft.metadata
  )
  if (!userOwnsCelebratedNft) {
    return
  }

  yield* put(
    celebratedNftFound({
      networkId: celebratedNft.networkId,
      contractAddress: celebratedNft.contractAddress,
      rewardExpirationDate: rewardExpirationDateString,
      rewardReminderDate: rewardReminderDateString,
      deepLink,
    })
  )
}

export function* findNftReward({ payload: { nfts } }: PayloadAction<FetchNftsCompletedAction>) {
  const featureGateEnabled = getFeatureGate(StatsigFeatureGates.SHOW_NFT_REWARD)
  if (!featureGateEnabled) {
    return
  }

  const {
    celebratedNft,
    rewardExpirationDate: rewardExpirationDateString,
    rewardReminderDate: rewardReminderDateString,
    deepLink,
  } = getDynamicConfigParams(DynamicConfigs[StatsigDynamicConfigs.NFT_CELEBRATION_CONFIG])

  if (
    !celebratedNft ||
    !celebratedNft.networkId ||
    !celebratedNft.contractAddress ||
    !rewardExpirationDateString ||
    !rewardReminderDateString ||
    !deepLink
  ) {
    return
  }

  const expirationDate = Date.parse(rewardExpirationDateString)
  const rewardReminderDate = Date.parse(rewardReminderDateString)

  if (Number.isNaN(expirationDate)) {
    Logger.error(TAG, 'Invalid expiration date in remote config')
    return
  }

  if (Number.isNaN(rewardReminderDate)) {
    Logger.error(TAG, 'Invalid reminder date in remote config')
    return
  }

  const lastNftCelebration = yield* select(nftCelebrationSelector)
  if (!isSameNftContract(lastNftCelebration, celebratedNft)) {
    return
  }

  // sync values in the redux state with remote config
  const valuesToSync = {
    rewardExpirationDate: rewardExpirationDateString,
    rewardReminderDate: rewardReminderDateString,
    deepLink,
  }

  const showReminder = isToday(rewardReminderDate) || isPast(rewardReminderDate)

  switch (lastNftCelebration?.status) {
    case NftCelebrationStatus.celebrationDisplayed:
    case NftCelebrationStatus.rewardReadyToDisplay:
      yield* put(nftRewardReadyToDisplay({ showReminder, valuesToSync }))
      return
    case NftCelebrationStatus.rewardDisplayed:
    case NftCelebrationStatus.reminderReadyToDisplay:
      if (showReminder) {
        yield* put(nftRewardReadyToDisplay({ showReminder, valuesToSync }))
      }
      return
  }
}

function* watchFetchNfts() {
  yield* takeLeading([fetchNfts.type, Actions.SET_ACCOUNT], safely(handleFetchNfts))
}

export function* watchFirstFetchCompleted() {
  const action = (yield* take(fetchNftsCompleted.type)) as PayloadAction<FetchNftsCompletedAction>
  yield* call(findCelebratedNft, action)
  yield* call(findNftReward, action)
}

export function* nftsSaga() {
  yield* spawn(watchFetchNfts)
  yield* spawn(watchFirstFetchCompleted)
  yield* put(fetchNfts())
}
