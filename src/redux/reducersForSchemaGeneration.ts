import { combineReducers } from 'redux'
import { PersistState } from 'redux-persist'
import { reducersList } from 'src/redux/reducersList'

const reducerForSchemaGeneration = combineReducers(reducersList)
export type RootStateForSchemaGeneration = ReturnType<typeof reducerForSchemaGeneration> & {
  _persist: PersistState
}
