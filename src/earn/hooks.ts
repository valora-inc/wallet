import { useAsync } from 'react-async-hook'
import { fetchAavePoolInfo } from 'src/earn/poolInfo'
import { Address } from 'viem'

export function useAavePoolInfo(assetAddress: Address) {
  return useAsync(async () => fetchAavePoolInfo(assetAddress), [])
}
