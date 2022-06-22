import { PayloadAction } from '@reduxjs/toolkit'
import { call, select, spawn, takeLatest } from 'redux-saga/effects'
import { openDeepLink, openUrl } from 'src/app/actions'
import { handleDeepLink, handleOpenUrl } from 'src/app/saga'
import { dappsWebViewEnabledSelector } from 'src/dapps/selectors'
import { dappSelected, DappSelectedAction } from 'src/dapps/slice'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { isDeepLink } from 'src/utils/linking'
import { isWalletConnectEnabled } from 'src/walletConnect/saga'
import { isWalletConnectDeepLink } from 'src/walletConnect/walletConnect'

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

export function* watchDappSelected() {
  yield takeLatest(dappSelected.type, handleOpenDapp)
}

export function* dappsSaga() {
  yield spawn(watchDappSelected)
}
