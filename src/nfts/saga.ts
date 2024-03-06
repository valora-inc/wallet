import { PayloadAction } from '@reduxjs/toolkit'
import { celebratedNftFound } from 'src/home/actions'
import { celebratedNftSelector } from 'src/home/selectors'
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

  const { celebratedNft } = getDynamicConfigParams(
    DynamicConfigs[StatsigDynamicConfigs.NFT_CELEBRATION_CONFIG]
  )
  if (!celebratedNft || !celebratedNft.networkId || !celebratedNft.contractAddress) {
    return
  }

  const lastCelebratedNft = yield* select(celebratedNftSelector)
  if (
    !!lastCelebratedNft &&
    lastCelebratedNft.networkId === celebratedNft.networkId &&
    lastCelebratedNft.contractAddress === celebratedNft.contractAddress
  ) {
    return
  }

  const userOwnsCelebratedNft = nfts.some(
    (nft) =>
      !!nft.metadata &&
      nft.networkId === celebratedNft.networkId &&
      nft.contractAddress === celebratedNft.contractAddress
  )
  if (!userOwnsCelebratedNft) {
    return
  }

  yield* put(
    celebratedNftFound({
      networkId: celebratedNft.networkId,
      contractAddress: celebratedNft.contractAddress,
    })
  )
}

function* watchFetchNfts() {
  yield* takeLeading([fetchNfts.type, Actions.SET_ACCOUNT], safely(handleFetchNfts))
}

export function* watchFirstFetchCompleted() {
  const action = (yield* take(fetchNftsCompleted.type)) as PayloadAction<FetchNftsCompletedAction>
  yield* call(findCelebratedNft, action)
}

export function* nftsSaga() {
  yield* spawn(watchFetchNfts)
  yield* spawn(watchFirstFetchCompleted)
  yield* put(fetchNfts())
}
