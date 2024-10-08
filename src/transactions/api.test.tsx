import { type FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { renderHook, waitFor } from '@testing-library/react-native'
import fetchMock from 'jest-fetch-mock'
import React from 'react'
import { Provider } from 'react-redux'
import { reducersList } from 'src/redux/reducersList'
import {
  transactionFeedV2Api,
  TransactionFeedV2Response,
  useTransactionFeedV2Query,
} from 'src/transactions/api'
import { setupApiStore } from 'src/transactions/apiTestHelpers'
import { type TokenTransaction } from 'src/transactions/types'
import networkConfig from 'src/web3/networkConfig'

function wrapper({ children }: { children: React.ReactNode }) {
  const storeRef = setupApiStore(transactionFeedV2Api, {}, reducersList)
  return <Provider store={storeRef.store}>{children}</Provider>
}

beforeEach(() => {
  fetchMock.resetMocks()
})

describe('API Slice of Transactions Feed V2', () => {
  describe('endpoint', () => {
    it('request is correct', async () => {
      const storeRef = setupApiStore(transactionFeedV2Api, {}, reducersList)

      const address = '0x00'
      const endCursor = 0
      await storeRef.store.dispatch(
        transactionFeedV2Api.endpoints.transactionFeedV2.initiate({ address, endCursor })
      )

      const { method, headers, url } = fetchMock.mock.calls[0][0] as Request
      const fullUrl = `${networkConfig.blockchainApiUrl}/wallet/${address}/transactions?endCursor=${endCursor}`
      const accept = headers.get('Accept')
      expect(fetchMock).toBeCalledTimes(1)
      expect(method).toBe('GET')
      expect(url).toBe(fullUrl)
      expect(accept).toBe('application/json')
    })

    it('successful response', async () => {
      const storeRef = setupApiStore(transactionFeedV2Api, {}, reducersList)
      const responseData: TransactionFeedV2Response = {
        transactions: [{ transactionHash: '0x00' } as TokenTransaction],
        pageInfo: { hasNextPage: false },
      }
      fetchMock.mockResponse(JSON.stringify(responseData))

      const address = '0x00'
      const endCursor = 0
      const { data, status, isSuccess } = await storeRef.store.dispatch(
        transactionFeedV2Api.endpoints.transactionFeedV2.initiate({ address, endCursor })
      )

      expect(status).toBe('fulfilled')
      expect(isSuccess).toBe(true)
      expect(data).toStrictEqual(responseData)
      expect(fetchMock).toBeCalledTimes(1)
    })

    it('unsuccessful response', async () => {
      const storeRef = setupApiStore(transactionFeedV2Api, {}, reducersList)
      fetchMock.mockReject(new Error('Internal Server Error'))

      const address = '0x00'
      const endCursor = 0
      const { error, isError, status } = await storeRef.store.dispatch(
        transactionFeedV2Api.endpoints.transactionFeedV2.initiate({ address, endCursor })
      )
      const typedError = error as FetchBaseQueryError

      expect(status).toBe('rejected')
      expect(isError).toBe(true)
      expect(typedError.status).toBe('FETCH_ERROR')
      expect(typedError.status === 'FETCH_ERROR' && typedError.error).toBe(
        'Error: Internal Server Error'
      )
    })
  })

  describe('generated hooks', () => {
    describe('useTransactionFeedV2Query', () => {
      it('request successful', async () => {
        const responseData: TransactionFeedV2Response = {
          transactions: [{ transactionHash: '0x00' } as TokenTransaction],
          pageInfo: { hasNextPage: false },
        }
        fetchMock.mockResponse(JSON.stringify(responseData))

        const address = '0x00'
        const endCursor = 0
        const { result } = renderHook(() => useTransactionFeedV2Query({ address, endCursor }), {
          wrapper,
        })

        // Response started and is ongoing
        const initialResponse = result.current
        expect(initialResponse.data).toBeUndefined()
        expect(initialResponse.isLoading).toBe(true)
        expect(initialResponse.isFetching).toBe(true)

        // Response finished successfully
        await waitFor(() => {
          const nextResponse = result.current
          expect(nextResponse.data).not.toBeUndefined()
          expect(nextResponse.isLoading).toBe(false)
          expect(nextResponse.isFetching).toBe(false)
          expect(nextResponse.isSuccess).toBe(true)
        })
      })

      it('request failed', async () => {
        fetchMock.mockReject(new Error('Internal Server Error'))

        const address = '0x00'
        const endCursor = 0
        const { result } = renderHook(() => useTransactionFeedV2Query({ address, endCursor }), {
          wrapper,
        })

        // Response started and is ongoing
        const initialResponse = result.current
        expect(initialResponse.data).toBeUndefined()
        expect(initialResponse.isLoading).toBe(true)
        expect(initialResponse.isFetching).toBe(true)

        // Response failed
        await waitFor(() => {
          const nextResponse = result.current
          const error = nextResponse.error as FetchBaseQueryError
          expect(nextResponse.data).toBeUndefined()
          expect(nextResponse.isLoading).toBe(false)
          expect(nextResponse.isFetching).toBe(false)
          expect(nextResponse.isSuccess).toBe(false)
          expect(nextResponse.isError).toBe(true)
          expect(error.status === 'FETCH_ERROR' && error.error).toBe('Error: Internal Server Error')
        })
      })

      it('using hook twice only fires a single request', async () => {
        const storeRef = setupApiStore(transactionFeedV2Api, {}, reducersList)
        const responseData: TransactionFeedV2Response = {
          transactions: [{ transactionHash: '0x00' } as TokenTransaction],
          pageInfo: { hasNextPage: false },
        }
        fetchMock.mockResponse(JSON.stringify(responseData))

        const address = '0x00'
        const endCursor = 0

        // First call fetches the data and stores it in cache
        const { result } = renderHook(
          () => storeRef.api.useTransactionFeedV2Query({ address, endCursor }),
          { wrapper }
        )

        const initialResponse = result.current
        expect(initialResponse.isLoading).toBe(true)

        await waitFor(() => {
          const nextResponse = result.current
          expect(nextResponse.data).not.toBeUndefined()
        })

        // Usage of hook with the same args returns data from cache and doesn't trigger another request
        renderHook(() => storeRef.api.useTransactionFeedV2Query({ address, endCursor }), {
          wrapper,
        })
        renderHook(() => storeRef.api.useTransactionFeedV2Query({ address, endCursor }), {
          wrapper,
        })

        expect(fetchMock).toBeCalledTimes(1)
      })
    })
  })
})
