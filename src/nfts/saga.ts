import { fetchNfts, fetchNftsCompleted, fetchNftsFailed } from 'src/nfts/slice'
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
import { call, put, select, spawn, takeLeading } from 'typed-redux-saga'

const TAG = 'NftsSaga'

export async function fetchNftsForSupportedNetworks(address: string): Promise<NftWithNetworkId[]> {
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
  const showNftsInApp = getFeatureGate(StatsigFeatureGates.SHOW_IN_APP_NFT_GALLERY)
  if (!showNftsInApp) {
    Logger.debug(TAG, 'Feature gate not enabled, skipping NFTs list fetch')
    return
  }

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

export function* watchFetchNfts() {
  yield* takeLeading([fetchNfts.type, Actions.SET_ACCOUNT], safely(handleFetchNfts))
}

export function* nftsSaga() {
  yield* spawn(watchFetchNfts)
  yield* put(fetchNfts())
}
