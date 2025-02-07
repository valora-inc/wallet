import { getPublicClient } from '../getPublicClient'
import { NetworkId } from '../types'

export function usePublicClient({ networkId }: { networkId: NetworkId }) {
  const publicClient = getPublicClient({ networkId })
  return publicClient
}
