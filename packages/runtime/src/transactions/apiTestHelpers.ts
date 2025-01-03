import type { EnhancedStore, Middleware, Reducer, UnknownAction } from '@reduxjs/toolkit'
import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { ApiReducersKeys } from 'src/redux/apiReducersList'
import { RootState } from 'src/redux/reducers'
import { getMockStoreData, RecursivePartial } from 'test/utils'

/**
 * This function is taken from the Redux team. It creates a testable store that is compatible
 * with RTK-Query. It is slightly modified to also include the preloaded state.
 * https://github.com/reduxjs/redux-toolkit/blob/e7540a5594b0d880037f2ff41a83a32c629d3117/packages/toolkit/src/tests/utils/helpers.tsx#L186
 *
 * For more info on why this is needed and how it works - here's an article that answers some of the questions:
 * https://medium.com/@johnmcdowell0801/testing-rtk-query-with-jest-cdfa5aaf3dc1
 */
export function setupApiStore<
  A extends {
    reducer: Reducer<any, any>
    reducerPath: string
    middleware: Middleware
  },
  Preloaded extends RecursivePartial<Omit<RootState, ApiReducersKeys>>,
  R extends Record<string, Reducer<any, any>> = Record<never, never>,
>(api: A, preloadedState: Preloaded, extraReducers?: R) {
  // destructure _persist from the preloaded state as it is an unexpected key in
  // the mocked store and logs an error during test execution
  const { _persist, ...mockStoreData } = getMockStoreData(preloadedState)
  const getStore = () =>
    configureStore({
      preloadedState: mockStoreData,
      reducer: combineReducers({
        [api.reducerPath]: api.reducer,
        ...extraReducers,
      }),
      middleware: (getDefaultMiddleware) => {
        return getDefaultMiddleware({
          serializableCheck: false,
          immutableCheck: false,
        }).concat(api.middleware)
      },
    })

  type Store = { api: ReturnType<A['reducer']> } & { [K in keyof R]: ReturnType<R[K]> }
  type StoreType = EnhancedStore<
    Store,
    UnknownAction,
    ReturnType<typeof getStore> extends EnhancedStore<any, any, infer M> ? M : never
  >

  const initialStore = getStore() as StoreType
  const refObj = { api, store: initialStore }
  const store = getStore() as StoreType
  refObj.store = store

  return refObj
}
