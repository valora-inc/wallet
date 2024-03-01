import { Action, combineReducers } from 'redux'
import { PersistState } from 'redux-persist'
import { Actions } from 'src/account/actions'
import { State as AccountState, reducer as account } from 'src/account/reducer'
import { State as AlertState, reducer as alert } from 'src/alert/reducer'
import { State as AppState, appReducer as app } from 'src/app/reducers'
import superchargeReducer, { State as SuperchargeState } from 'src/consumerIncentives/slice'
import dappsReducer, { State as DappsState } from 'src/dapps/slice'
import { State as EscrowState, escrowReducer as escrow } from 'src/escrow/reducer'
import { State as ExchangeState, reducer as exchange } from 'src/exchange/reducer'
import { State as FeesState, reducer as fees } from 'src/fees/reducer'
import { State as FiatExchangesState, reducer as fiatExchanges } from 'src/fiatExchanges/reducer'
import fiatConnectReducer, { State as FiatConnectState } from 'src/fiatconnect/slice'
import { State as HomeState, homeReducer as home } from 'src/home/reducers'
import i18nReducer, { State as I18nState } from 'src/i18n/slice'
import { State as IdentityState, reducer as identity } from 'src/identity/reducer'
import { State as ImportState, reducer as imports } from 'src/import/reducer'
import jumpstartReducer, { State as JumpstartState } from 'src/jumpstart/slice'
import keylessBackupReducer, { State as KeylessBackupState } from 'src/keylessBackup/slice'
import { State as LocalCurrencyState, reducer as localCurrency } from 'src/localCurrency/reducer'
import { State as NetworkInfoState, reducer as networkInfo } from 'src/networkInfo/reducer'
import nftsReducer, { State as NFTsState } from 'src/nfts/slice'
import positionsReducer, { State as PositionsState } from 'src/positions/slice'
import priceHistoryReducer, { State as priceHistoryState } from 'src/priceHistory/slice'
import { State as RecipientsState, recipientsReducer as recipients } from 'src/recipients/reducer'
import { State as SendState, sendReducer as send } from 'src/send/reducers'
import swapReducer, { State as SwapState } from 'src/swap/slice'
import tokenReducer, { State as TokensState } from 'src/tokens/slice'
import { State as TransactionsState, reducer as transactions } from 'src/transactions/reducer'
import { State as WalletConnectState, reducer as walletConnect } from 'src/walletConnect/reducer'
import { State as Web3State, reducer as web3 } from 'src/web3/reducer'

const appReducer = combineReducers({
  app,
  i18n: i18nReducer,
  networkInfo,
  alert,
  send,
  home,
  exchange,
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
}) as (state: RootState | undefined, action: Action) => RootState

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
      identity: identity(state.identity, action),
    }
  }
  return appReducer(state, action)
}

export default rootReducer

export interface RootState {
  _persist: PersistState
  app: AppState
  i18n: I18nState
  networkInfo: NetworkInfoState
  alert: AlertState
  send: SendState
  home: HomeState
  exchange: ExchangeState
  transactions: TransactionsState
  web3: Web3State
  identity: IdentityState
  account: AccountState
  escrow: EscrowState
  fees: FeesState
  recipients: RecipientsState
  localCurrency: LocalCurrencyState
  imports: ImportState
  fiatExchanges: FiatExchangesState
  walletConnect: WalletConnectState
  tokens: TokensState
  supercharge: SuperchargeState
  dapps: DappsState
  fiatConnect: FiatConnectState
  swap: SwapState
  positions: PositionsState
  keylessBackup: KeylessBackupState
  nfts: NFTsState
  priceHistory: priceHistoryState
  jumpstart: JumpstartState
}

export interface PersistedRootState {
  _persist: PersistState
  app: AppState
  i18n: I18nState
  send: SendState
  home: HomeState
  transactions: TransactionsState
  web3: Web3State
  identity: IdentityState
  account: AccountState
  escrow: EscrowState
  localCurrency: LocalCurrencyState
  recipients: RecipientsState
  fiatExchanges: FiatExchangesState
}
