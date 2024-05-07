import { useAsync } from 'react-async-hook'
import { fetchAavePoolInfo, fetchAavePoolUserBalance } from 'src/earn/poolInfo'
import { Address } from 'viem'

export function useAavePoolInfo(assetAddress: Address) {
  return useAsync(async () => fetchAavePoolInfo(assetAddress), [])
}

export function useAavePoolUserBalance({
  assetAddress,
  walletAddress,
}: {
  assetAddress: Address
  walletAddress: Address
}) {
  return useAsync(
    async () =>
      fetchAavePoolUserBalance({
        assetAddress,
        walletAddress,
      }),
    []
  )
}
