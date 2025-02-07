import { useAsyncCallback } from 'react-async-hook'
import { sendTransactions } from '../sendTransactions'
import { toAsyncStatus } from './toAsyncStatus'

export function useSendTransactions() {
  const asyncCallback = useAsyncCallback(sendTransactions)

  return {
    status: toAsyncStatus(asyncCallback.status),
    error: asyncCallback.error,
    data: asyncCallback.result,
    sendTransactions: asyncCallback.execute,
    reset: asyncCallback.reset,
  }
}
