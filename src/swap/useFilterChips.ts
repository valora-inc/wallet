import { useTranslation } from 'react-i18next'
import { FilterChip } from 'src/components/FilterChipsCarousel'
import { TOKEN_MIN_AMOUNT } from 'src/config'
import useSelector from 'src/redux/useSelector'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import { lastSwappedSelector } from 'src/swap/selectors'
import { Field } from 'src/swap/types'
import { TokenBalance } from 'src/tokens/slice'
import { getSupportedNetworkIdsForSwap } from 'src/tokens/utils'
import { Network, NetworkId } from 'src/transactions/types'
import { networkIdToNetwork } from 'src/web3/networkConfig'

export default function useFilterChip(selectingField: Field | null): FilterChip<TokenBalance>[] {
  const { t } = useTranslation()
  const showSwapTokenFilters = getFeatureGate(StatsigFeatureGates.SHOW_SWAP_TOKEN_FILTERS)
  const recentlySwappedTokens = useSelector(lastSwappedSelector)
  const popularTokens: string[] = [] // TODO
  const supportedNetworkIds = getSupportedNetworkIdsForSwap()

  if (!showSwapTokenFilters) {
    return []
  }

  const networkToFilterName: Record<Network, string> = {
    [Network.Celo]: t('tokenBottomSheet.filters.celo'),
    [Network.Ethereum]: t('tokenBottomSheet.filters.ethereum'),
    [Network.Arbitrum]: t('tokenBottomSheet.filters.arbitrum'), // TODO add to base.json
    [Network.Optimism]: t('tokenBottomSheet.filters.optimism'), // TODO add to base.json
  }

  const networkIdChip = supportedNetworkIds.map((networkId: NetworkId) => ({
    id: networkId,
    name: networkToFilterName[networkIdToNetwork[networkId]],
    filterFn: (token: TokenBalance) =>
      networkIdToNetwork[token.networkId] === networkIdToNetwork[networkId],
    isSelected: false,
  }))

  return [
    {
      id: 'my-tokens',
      name: t('tokenBottomSheet.filters.myTokens'),
      filterFn: (token: TokenBalance) => token.balance.gte(TOKEN_MIN_AMOUNT),
      isSelected: true,
    },
    {
      id: 'popular',
      name: t('tokenBottomSheet.filters.popular'),
      filterFn: (token: TokenBalance) => popularTokens.includes(token.tokenId),
      isSelected: selectingField === Field.TO,
    },
    {
      id: 'recently-swapped',
      name: t('tokenBottomSheet.filters.recentlySwapped'),
      filterFn: (token: TokenBalance) => recentlySwappedTokens.includes(token.tokenId),
      isSelected: false,
    },
    ...networkIdChip,
  ]
}
