import { PayloadAction } from '@reduxjs/toolkit'
import { call, put, select, spawn, takeLatest, takeLeading } from 'redux-saga/effects'
import { openDeepLink, openUrl } from 'src/app/actions'
import { handleDeepLink, handleOpenUrl } from 'src/app/saga'
import { dappsListApiUrlSelector, dappsWebViewEnabledSelector } from 'src/dapps/selectors'
import {
  dappSelected,
  DappSelectedAction,
  fetchDappsList,
  fetchDappsListCompleted,
  fetchDappsListFailed,
} from 'src/dapps/slice'
import { DappCategory, DappV1, DappV2 } from 'src/dapps/types'
import { currentLanguageSelector } from 'src/i18n/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getExperimentParams } from 'src/statsig'
import { ExperimentConfigs } from 'src/statsig/constants'
import { StatsigExperiments } from 'src/statsig/types'
import { isDeepLink } from 'src/utils/linking'
import Logger from 'src/utils/Logger'
import { safely } from 'src/utils/safely'
import { isWalletConnectEnabled } from 'src/walletConnect/saga'
import { isWalletConnectDeepLink } from 'src/walletConnect/walletConnect'
import { Actions } from 'src/web3/actions'
import { walletAddressSelector } from 'src/web3/selectors'

const TAG = 'DappsSaga'

interface ApplicationV1 {
  description: string
  id: string
  logoUrl: string
  name: string
  url: string
  categoryId: string
}

interface ApplicationV2 {
  description: string
  id: string
  logoUrl: string
  name: string
  url: string
  categories: string[]
}

export const isApplicationV2 = (dapp: ApplicationV1 | ApplicationV2): dapp is ApplicationV2 =>
  'categories' in dapp

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
    Logger.warn(TAG, 'dappsListApiUrl not found, skipping dapps list fetch')
    return
  }

  const address = yield select(walletAddressSelector)
  if (!address) {
    // the dapplist is fetched on app start, but for a new user who has not yet
    // created or restored a wallet the request will fail.
    Logger.debug(TAG, 'Wallet address not found, skipping dapps list fetch')
    return
  }

  const language = yield select(currentLanguageSelector)
  const shortLanguage = language.split('-')[0]
  const { dappsFilterEnabled, dappsSearchEnabled } = getExperimentParams(
    ExperimentConfigs[StatsigExperiments.DAPPS_FILTERS_AND_SEARCH]
  )

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
        applications: ApplicationV1[] | ApplicationV2[]
        categories: DappCategory[]
        featured: ApplicationV1
        mostPopularDapps: string[]
      } = yield call([response, 'json'])

      const dappsList: Array<DappV1 | DappV2> = isApplicationV2(result.applications[0])
        ? (result.applications as ApplicationV2[]).map((application) => {
            return {
              id: application.id,
              categories: application.categories,
              name: application.name,
              iconUrl: application.logoUrl,
              description: application.description,
              dappUrl: application.url.replace('{{address}}', address ?? ''),
              isFeatured: application.id === result.featured.id,
            }
          })
        : (result.applications as ApplicationV1[]).map((application) => {
            return {
              id: application.id,
              categoryId: application.categoryId,
              name: application.name,
              iconUrl: application.logoUrl,
              description: application.description,
              dappUrl: application.url.replace('{{address}}', address ?? ''),
              isFeatured: application.id === result.featured.id,
            }
          })

      yield put(
        fetchDappsListCompleted({
          dapps: dappsList,
          categories: result.categories,
          mostPopularDappIds: result.mostPopularDapps,
        })
      )
    } catch (error) {
      Logger.error(TAG, 'Could not parse dapps response', error)
      yield put(fetchDappsListFailed({ error: 'Could not parse dapps' }))
    }
  } else {
    yield put(fetchDappsListFailed({ error: 'Could not fetch dapps' }))
  }
}

export function* watchDappSelected() {
  yield takeLatest(dappSelected.type, safely(handleOpenDapp))
}

export function* watchFetchDappsList() {
  yield takeLeading([fetchDappsList.type, Actions.SET_ACCOUNT], safely(handleFetchDappsList))
}

export function* dappsSaga() {
  yield spawn(watchDappSelected)
  yield spawn(watchFetchDappsList)
  yield put(fetchDappsList())
}
