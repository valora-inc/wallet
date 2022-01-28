import AsyncStorage from '@react-native-async-storage/async-storage'
import { applyMiddleware, compose, createStore } from 'redux'
import { getStoredState, PersistConfig, persistReducer, persistStore } from 'redux-persist'
import FSStorage from 'redux-persist-fs-storage'
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2'
import createSagaMiddleware from 'redux-saga'
import { PerformanceEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import createMigrate from 'src/redux/createMigrate'
import { migrations } from 'src/redux/migrations'
import rootReducer, { RootState } from 'src/redux/reducers'
import { rootSaga } from 'src/redux/sagas'
import { resetStateOnInvalidStoredAccount } from 'src/utils/accountChecker'
import Logger from 'src/utils/Logger'
import { ONE_DAY_IN_MILLIS } from 'src/utils/time'

const timeBetweenStoreSizeEvents = ONE_DAY_IN_MILLIS
let lastEventTime = Date.now()

const persistConfig: PersistConfig<RootState> = {
  key: 'root',
  version: 31, // default is -1, increment as we make migrations
  keyPrefix: `reduxStore-`, // the redux-persist default is `persist:` which doesn't work with some file systems.
  storage: FSStorage(),
  blacklist: ['geth', 'networkInfo', 'alert', 'imports'],
  stateReconciler: autoMergeLevel2,
  migrate: async (...args) => {
    const migrate = createMigrate(migrations)
    const state: any = await migrate(...args)

    // Do this check here once migrations have occurred, to ensure we have a RootState
    return resetStateOnInvalidStoredAccount(state) as any
  },
  // @ts-ignore the types are currently wrong
  serialize: (data: any) => {
    // We're using this to send the size of the store to analytics while using the default implementation of JSON.stringify.
    const stringifiedData = JSON.stringify(data)
    // if data._persist or any other key is present the whole state is present (the content of the keys are
    // sometimes serialized independently).
    if (data._persist && Date.now() > lastEventTime + timeBetweenStoreSizeEvents) {
      lastEventTime = Date.now()
      ValoraAnalytics.track(PerformanceEvents.redux_store_size, {
        size: stringifiedData.length,
      })
    }
    return stringifiedData
  },
  deserialize: (data: string) => {
    // This is the default implementation, but overriding to maintain compatibility with the serialize function
    // in case the library changes.
    return JSON.parse(data)
  },
  // @ts-ignore
  timeout: null,
}

// We used to use AsyncStorage to save the state, but moved to file system storage because of problems with Android
// maximum size limits. To keep backwards compatibility, we first try to read from the file system but if nothing is found
// it means it's an old version so we read the state from AsyncStorage.
// @ts-ignore
persistConfig.getStoredState = async (config: any) => {
  Logger.info('redux/store', 'persistConfig.getStoredState')
  try {
    // throw new Error("testing exception in getStoredState")
    const state = await getStoredState(config)
    if (state) {
      return state
    }

    const oldState = await getStoredState({
      ...config,
      storage: AsyncStorage,
      keyPrefix: 'persist:',
    })
    if (oldState) {
      return oldState
    }

    return null
  } catch (error) {
    Logger.error('redux/store', 'Failed to retrieve redux state.', error)
  }
}

// For testing only!
export const _persistConfig = persistConfig

const persistedReducer = persistReducer(persistConfig, rootReducer)

// eslint-disable-next-line no-var
declare var window: any

export const configureStore = (initialState = {}) => {
  const sagaMiddleware = createSagaMiddleware()
  const middlewares = [sagaMiddleware]

  if (__DEV__) {
    const createDebugger = require('redux-flipper').default
    // Sending the whole state makes the redux debugger in flipper super slow!!
    // I suspect it's the exchange rates causing this!
    // For now exclude the `exchange` reducer.
    middlewares.push(
      createDebugger({
        stateWhitelist: [
          'app',
          'i18n',
          'networkInfo',
          'alert',
          'goldToken',
          'stableToken',
          'send',
          'home',
          // "exchange",
          'transactions',
          'web3',
          'identity',
          'account',
          'invite',
          'geth',
          'escrow',
          'fees',
          'recipients',
          'localCurrency',
          'imports',
          'paymentRequest',
          'verify',
        ],
      })
    )
  }

  const enhancers = [applyMiddleware(...middlewares)]

  if (__DEV__) {
    const Reactotron = require('src/reactotronConfig').default
    enhancers.push(Reactotron.createEnhancer())
  }

  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose
  // @ts-ignore
  const createdStore = createStore(persistedReducer, initialState, composeEnhancers(...enhancers))

  const createdPersistor = persistStore(createdStore)
  sagaMiddleware.run(rootSaga)
  return { store: createdStore, persistor: createdPersistor }
}

const { store, persistor } = configureStore()
export { store, persistor }
