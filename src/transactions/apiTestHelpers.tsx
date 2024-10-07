import type { EnhancedStore, Middleware, Reducer, UnknownAction } from '@reduxjs/toolkit'
import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { ApiReducersKeys } from 'src/redux/apiReducersList'
import { RootState } from 'src/redux/reducers'
import { RecursivePartial } from 'test/utils'

// https://medium.com/@johnmcdowell0801/testing-rtk-query-with-jest-cdfa5aaf3dc1
export function setupApiStore<
  A extends {
    reducer: Reducer<any, any>
    reducerPath: string
    middleware: Middleware
    util: { resetApiState(): any }
  },
  Preloaded extends RecursivePartial<Omit<RootState, ApiReducersKeys>>,
  R extends Record<string, Reducer<any, any>> = Record<never, never>,
>(api: A, preloadedState: Preloaded, extraReducers?: R) {
  const getStore = () =>
    configureStore({
      preloadedState,
      reducer: combineReducers({
        [api.reducerPath]: api.reducer,
        ...extraReducers,
      }),
      middleware: (gdm) =>
        gdm({ serializableCheck: false, immutableCheck: false }).concat(api.middleware),
    })

  type StoreType = EnhancedStore<
    {
      api: ReturnType<A['reducer']>
    } & {
      [K in keyof R]: ReturnType<R[K]>
    },
    UnknownAction,
    ReturnType<typeof getStore> extends EnhancedStore<any, any, infer M> ? M : never
  >

  const initialStore = getStore() as StoreType
  const refObj = { api, store: initialStore }
  const store = getStore() as StoreType
  refObj.store = store

  return refObj
}
