import { useAsyncCallback } from 'react-async-hook'
import { prepareTransactions } from '../prepareTransactions'
import { toAsyncStatus } from './toAsyncStatus'

export function usePrepareTransactions() {
  const asyncCallback = useAsyncCallback(prepareTransactions)

  return {
    status: toAsyncStatus(asyncCallback.status),
    error: asyncCallback.error,
    data: asyncCallback.result,
    prepareTransactions: asyncCallback.execute,
    reset: asyncCallback.reset,
  }
}
