import { Action, combineReducers } from 'redux'
import { PersistState } from 'redux-persist'
import { Actions } from 'src/account/actions'
import { reducer as account, State as AccountState } from 'src/account/reducer'
import { reducer as alert, State as AlertState } from 'src/alert/reducer'
import { appReducer as app, State as AppState } from 'src/app/reducers'
import superchargeReducer, { State as SuperchargeState } from 'src/consumerIncentives/slice'
import dappsReducer, { State as DappsState } from 'src/dapps/slice'
import { escrowReducer as escrow, State as EscrowState } from 'src/escrow/reducer'
import { reducer as exchange, State as ExchangeState } from 'src/exchange/reducer'
import { reducer as fees, State as FeesState } from 'src/fees/reducer'
import fiatConnectReducer, { State as FiatConnectState } from 'src/fiatconnect/slice'
import { reducer as fiatExchanges, State as FiatExchangesState } from 'src/fiatExchanges/reducer'
import { homeReducer as home, State as HomeState } from 'src/home/reducers'
import i18nReducer, { State as I18nState } from 'src/i18n/slice'
import { reducer as identity, State as IdentityState } from 'src/identity/reducer'
import { reducer as imports, State as ImportState } from 'src/import/reducer'
import keylessBackupReducer, { State as KeylessBackupState } from 'src/keylessBackup/slice'
import { reducer as localCurrency, State as LocalCurrencyState } from 'src/localCurrency/reducer'
import { reducer as networkInfo, State as NetworkInfoState } from 'src/networkInfo/reducer'
import nftsReducer, { State as NFTsState } from 'src/nfts/slice'
import positionsReducer, { State as PositionsState } from 'src/positions/slice'
import { recipientsReducer as recipients, State as RecipientsState } from 'src/recipients/reducer'
import { sendReducer as send, State as SendState } from 'src/send/reducers'
import swapReducer, { State as SwapState } from 'src/swap/slice'
import tokenReducer, { State as TokensState } from 'src/tokens/slice'
import { reducer as transactions, State as TransactionsState } from 'src/transactions/reducer'
import { reducer as walletConnect, State as WalletConnectState } from 'src/walletConnect/reducer'
import { reducer as web3, State as Web3State } from 'src/web3/reducer'

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
