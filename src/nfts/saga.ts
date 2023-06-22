import { call, put, select, spawn, takeLeading } from 'redux-saga/effects'
import { fetchMyNfts, fetchMyNftsCompleted, fetchMyNftsFailed } from 'src/nfts/slice'
import Logger from 'src/utils/Logger'
import { safely } from 'src/utils/safely'
import { Actions } from 'src/web3/actions'
import networkConfig from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'

const TAG = 'NftsSaga'

export function* handleFetchMyNfts() {
  const address = yield select(walletAddressSelector)
  if (!address) {
    Logger.debug(TAG, 'Wallet address not found, skipping my Nfts list fetch')
    return
  }

  const url = `${networkConfig.getNftsByOwnerAddressUrl}?address=${address}`

  const response = yield call(fetch, url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  })

  if (response.ok) {
    try {
      const { result } = yield call([response, 'json'])
      console.log('result', result)
      yield put(fetchMyNftsCompleted(result))
    } catch (error) {
      Logger.error(TAG, 'Could not parse nfts response', error)
      yield put(fetchMyNftsFailed({ error: 'Could not parse nfts' }))
    }
  } else {
    yield put(fetchMyNftsFailed({ error: 'Could not fetch nfts' }))
  }
}

export function* watchFetchMyNfts() {
  yield takeLeading([fetchMyNfts.type, Actions.SET_ACCOUNT], safely(handleFetchMyNfts))
}

export function* nftsSaga() {
  yield spawn(watchFetchMyNfts)
  yield put(fetchMyNfts())
}
