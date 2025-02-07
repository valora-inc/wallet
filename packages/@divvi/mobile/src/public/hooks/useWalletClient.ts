import { useAsync } from 'react-async-hook'

import { useMemo } from 'react'
import { getWalletClient } from '../getWalletClient'
import { NetworkId } from '../types'
import { toAsyncStatus } from './toAsyncStatus'

export function useWalletClient({ networkId }: { networkId: NetworkId }) {
  const params = useMemo(
    () => ({
      networkId,
    }),
    [networkId]
  )
  const asyncCallback = useAsync(getWalletClient, [params])

  return {
    status: toAsyncStatus(asyncCallback.status),
    error: asyncCallback.error,
    data: asyncCallback.result,
    refresh: asyncCallback.execute,
    reset: asyncCallback.reset,
  }
}
