import { Action, combineReducers } from '@reduxjs/toolkit'
import { PersistState } from 'redux-persist'
import { Actions, ClearStoredAccountAction } from 'src/account/actions'
import { reducer as account } from 'src/account/reducer'
import { reducer as alert } from 'src/alert/reducer'
import { appReducer as app } from 'src/app/reducers'
import superchargeReducer from 'src/consumerIncentives/slice'
import dappsReducer from 'src/dapps/slice'
import earnReducer from 'src/earn/slice'
import { escrowReducer as escrow } from 'src/escrow/reducer'
import { reducer as fees } from 'src/fees/reducer'
import { reducer as fiatExchanges } from 'src/fiatExchanges/reducer'
import fiatConnectReducer from 'src/fiatconnect/slice'
import { homeReducer as home } from 'src/home/reducers'
import i18nReducer from 'src/i18n/slice'
import { reducer as identity } from 'src/identity/reducer'
import { reducer as imports } from 'src/import/reducer'
import jumpstartReducer from 'src/jumpstart/slice'
import keylessBackupReducer from 'src/keylessBackup/slice'
import { reducer as localCurrency } from 'src/localCurrency/reducer'
import { reducer as networkInfo } from 'src/networkInfo/reducer'
import nftsReducer from 'src/nfts/slice'
import pointsReducer from 'src/points/slice'
import positionsReducer from 'src/positions/slice'
import priceHistoryReducer from 'src/priceHistory/slice'
import { recipientsReducer as recipients } from 'src/recipients/reducer'
import { sendReducer as send } from 'src/send/reducers'
import swapReducer from 'src/swap/slice'
import tokenReducer from 'src/tokens/slice'
import { reducer as transactions } from 'src/transactions/reducer'
import { reducer as walletConnect } from 'src/walletConnect/reducer'
import { reducer as web3 } from 'src/web3/reducer'

const appReducer = combineReducers({
  app,
  i18n: i18nReducer,
  networkInfo,
  alert,
  send,
  home,
  transactions,
  web3,
  identity,
  account,
  escrow,
  fees,
  recipients,
  localCurrency,
  imports,
  fiatExchanges,
  walletConnect,
  tokens: tokenReducer,
  supercharge: superchargeReducer,
  dapps: dappsReducer,
  fiatConnect: fiatConnectReducer,
  swap: swapReducer,
  positions: positionsReducer,
  keylessBackup: keylessBackupReducer,
  nfts: nftsReducer,
  priceHistory: priceHistoryReducer,
  jumpstart: jumpstartReducer,
  points: pointsReducer,
  earn: earnReducer,
})

const rootReducer = (state: RootState | undefined, action: Action): RootState => {
  if (action.type === Actions.CLEAR_STORED_ACCOUNT && state) {
    // Generate an initial state but keep the information not specific to the account
    // that we want to save.
    const initialState = appReducer(undefined, action)
    return {
      ...initialState,
      // We keep the chosen currency since it's unlikely the user wants to change that.
      localCurrency: state.localCurrency,
      // We keep phone number mappings since there's a cost to fetch them and they are
      // likely to be the same on the same device.
      identity: identity(state.identity, action as ClearStoredAccountAction),
    } as RootState
  }
  return appReducer(state, action) as RootState
}

export default rootReducer

export type RootState = ReturnType<typeof appReducer> & { _persist: PersistState }
