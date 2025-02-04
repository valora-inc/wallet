import { type Action, combineReducers } from '@reduxjs/toolkit'
import { type PersistState } from 'redux-persist'
import { Actions, type ClearStoredAccountAction } from 'src/account/actions'
import { reducer as identity } from 'src/identity/reducer'
import { apiReducersList } from 'src/redux/apiReducersList'
import { reducersList } from 'src/redux/reducersList'

const appReducer = combineReducers({ ...reducersList, ...apiReducersList })

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
