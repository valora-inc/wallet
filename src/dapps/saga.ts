import { PayloadAction } from '@reduxjs/toolkit'
import { call, put, select, spawn, takeLatest, takeLeading } from 'redux-saga/effects'
import { openDeepLink, openUrl } from 'src/app/actions'
import { handleDeepLink, handleOpenUrl } from 'src/app/saga'
import {
  dappsFilterEnabledSelector,
  dappsListApiUrlSelector,
  dappsSearchEnabledSelector,
  dappsWebViewEnabledSelector,
} from 'src/dapps/selectors'
import {
  dappSelected,
  DappSelectedAction,
  fetchDappsList,
  fetchDappsListCompleted,
  fetchDappsListFailed,
} from 'src/dapps/slice'
import { Dapp, DappCategory } from 'src/dapps/types'
import { currentLanguageSelector } from 'src/i18n/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { isDeepLink } from 'src/utils/linking'
import Logger from 'src/utils/Logger'
import { isWalletConnectEnabled } from 'src/walletConnect/saga'
import { isWalletConnectDeepLink } from 'src/walletConnect/walletConnect'
import { Actions } from 'src/web3/actions'
import { walletAddressSelector } from 'src/web3/selectors'

const TAG = 'DappsSaga'

// XOR for categoryId and categories
type Application = {
  description: string
  id: string
  logoUrl: string
  name: string
  url: string
} & ({ categoryId: string; categories?: never } | { categoryId?: never; categories: string[] })

export function* handleOpenDapp(action: PayloadAction<DappSelectedAction>) {
  const { dappUrl } = action.payload.dapp
  const dappsWebViewEnabled = yield select(dappsWebViewEnabledSelector)

  if (dappsWebViewEnabled) {
    const walletConnectEnabled: boolean = yield call(isWalletConnectEnabled, dappUrl)
    if (isDeepLink(dappUrl) || (walletConnectEnabled && isWalletConnectDeepLink(dappUrl))) {
      yield call(handleDeepLink, openDeepLink(dappUrl, true))
    } else {
      navigate(Screens.WebViewScreen, { uri: dappUrl })
    }
  } else {
    yield call(handleOpenUrl, openUrl(dappUrl, true, true))
  }
}

export function* handleFetchDappsList() {
  const dappsListApiUrl = yield select(dappsListApiUrlSelector)
  if (!dappsListApiUrl) {
    Logger.warn(TAG, 'dappsListApiUrl not found')
    return
  }

  const address = yield select(walletAddressSelector)
  const language = yield select(currentLanguageSelector)
  const shortLanguage = language.split('-')[0]
  const dappsFilterEnabled = yield select(dappsFilterEnabledSelector)
  const dappsSearchEnabled = yield select(dappsSearchEnabledSelector)
  const dappsListVersion = dappsFilterEnabled || dappsSearchEnabled ? '2' : '1'
  const url = `${dappsListApiUrl}?language=${shortLanguage}&address=${address}&version=${dappsListVersion}`

  const response = yield call(fetch, url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  })

  if (response.ok) {
    try {
      const result: {
        applications: Application[]
        categories: DappCategory[]
        featured: Application
      } = yield call([response, 'json'])

      const dappsList: Dapp[] = result.applications.map((application) => {
        return application.categoryId !== undefined
          ? {
              id: application.id,
              categoryId: application.categoryId,
              name: application.name,
              iconUrl: application.logoUrl,
              description: application.description,
              dappUrl: application.url.replace('{{address}}', address ?? ''),
              isFeatured: application.id === result.featured.id,
            }
          : {
              id: application.id,
              categories: application.categories,
              name: application.name,
              iconUrl: application.logoUrl,
              description: application.description,
              dappUrl: application.url.replace('{{address}}', address ?? ''),
              isFeatured: application.id === result.featured.id,
            }
      })

      yield put(fetchDappsListCompleted({ dapps: dappsList, categories: result.categories }))
    } catch (error) {
      Logger.error(TAG, 'Could not parse dapps response', error)
      yield put(fetchDappsListFailed({ error: 'Could not parse dapps' }))
    }
  } else {
    yield put(fetchDappsListFailed({ error: 'Could not fetch dapps' }))
  }
}

export function* watchDappSelected() {
  yield takeLatest(dappSelected.type, handleOpenDapp)
}

export function* watchFetchDappsList() {
  yield takeLeading([fetchDappsList.type, Actions.SET_ACCOUNT], handleFetchDappsList)
}

export function* dappsSaga() {
  yield spawn(watchDappSelected)
  yield spawn(watchFetchDappsList)
  yield put(fetchDappsList())
}
