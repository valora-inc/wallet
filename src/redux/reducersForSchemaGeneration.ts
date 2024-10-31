import { combineReducers } from 'redux'
import { PersistState } from 'redux-persist'
import { reducersList } from 'src/redux/reducersList'

/**
 * All the reducers up to this point were always manually maintained/changed by us.
 * For this purpose, we have Redux migrations which are covered with tests to ensure
 * compatibility between different versions of Redux state. With introduction of RTK-Query
 * we introduce library-managed api reducers, which must not be manually tweaked as library
 * can change how it stores its structure (api reducer is the cache for API endpoint).
 *
 * For this purpose, it is mandatory to omit api reducers completely from the flow of
 * typescript-json-schema generation. This file only includes existing non-api reducers
 * necessary for schema generation. Trying to generate the schema with api reducers throws
 * an error of unsupported type from @reduxjs/tookit/query/react.
 */
const reducerForSchemaGeneration = combineReducers(reducersList)
export type RootStateForSchemaGeneration = ReturnType<typeof reducerForSchemaGeneration> & {
  _persist: PersistState
}
