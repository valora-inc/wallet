import { call, put, select, spawn, takeLeading } from 'redux-saga/effects'
import { fetchNfts, fetchNftsCompleted, fetchNftsFailed } from 'src/nfts/slice'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import Logger from 'src/utils/Logger'
import { safely } from 'src/utils/safely'
import { Actions } from 'src/web3/actions'
import networkConfig from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'

const TAG = 'NftsSaga'

export function* handleFetchNfts() {
  const showNftsInApp = getFeatureGate(StatsigFeatureGates.SHOW_IN_APP_NFT_GALLERY)
  if (!showNftsInApp) {
    Logger.debug(TAG, 'Feature gate not enabled, skipping NFTs list fetch')
    return
  }

  const address = yield select(walletAddressSelector)
  if (!address) {
    Logger.debug(TAG, 'Wallet address not found, skipping NFTs list fetch')
    return
  }

  const url = `${networkConfig.getNftsByOwnerAddressUrl}?address=${address}`

  try {
    const response = yield call(fetch, url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })
    if (!response.ok) yield put(fetchNftsFailed({ error: 'Could not fetch NFTs' }))
    const { result } = yield call([response, 'json'])
    yield put(fetchNftsCompleted(result))
  } catch (error) {
    Logger.error(TAG, 'Could not parse NFTs response', error)
    yield put(fetchNftsFailed({ error: 'Could not parse NFTs' }))
  }
}

export function* watchFetchNfts() {
  yield takeLeading([fetchNfts.type, Actions.SET_ACCOUNT], safely(handleFetchNfts))
}

export function* nftsSaga() {
  yield spawn(watchFetchNfts)
  yield put(fetchNfts())
}
