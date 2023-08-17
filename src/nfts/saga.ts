import { fetchNfts, fetchNftsCompleted, fetchNftsFailed } from 'src/nfts/slice'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import Logger from 'src/utils/Logger'
import { ensureError } from 'src/utils/ensureError'
import { safely } from 'src/utils/safely'
import { Actions } from 'src/web3/actions'
import networkConfig from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'
import { call, put, select, spawn, takeLeading } from 'typed-redux-saga'

const TAG = 'NftsSaga'

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

  const url = `${networkConfig.getNftsByOwnerAddressUrl}?address=${address}`

  try {
    const response = yield* call(fetch, url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })
    if (!response.ok) {
      throw new Error(`Unable to fetch NFTs: ${response.status} ${response.statusText}`)
    }
    const { result } = yield* call([response, 'json'])
    yield* put(fetchNftsCompleted(result))
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
