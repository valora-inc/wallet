import { type Middleware, type MiddlewareAPI, isRejectedWithValue } from '@reduxjs/toolkit'
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { Action } from 'redux-saga'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import Logger from 'src/utils/Logger'
import networkConfig from 'src/web3/networkConfig'

export const baseQuery = fetchBaseQuery({
  baseUrl: networkConfig.blockchainApiUrl,
  headers: {
    Accept: 'application/json',
  },
})

export const rtkQueryErrorLoggerMiddleware: Middleware =
  (api: MiddlewareAPI) => (next) => (action) => {
    if (isRejectedWithValue(action)) {
      const errorMessage =
        'data' in action.error
          ? (action.error.data as { message: string }).message
          : action.error.message

      Logger.error('RTK-Query', errorMessage || 'An error occured', action)
      api.dispatch(showError(ErrorMessages.FETCH_FAILED) as Action)
    }

    return next(action)
  }
