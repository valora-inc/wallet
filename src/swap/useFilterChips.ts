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
import { NetworkId } from 'src/transactions/types'
import { networkIdToNetwork } from 'src/web3/networkConfig'

export default function useFilterChip(selectingField: Field | null): FilterChip<TokenBalance>[] {
  const { t } = useTranslation()
  const showSwapTokenFilters = getFeatureGate(StatsigFeatureGates.SHOW_SWAP_TOKEN_FILTERS)
  const recentlySwappedTokens = useSelector(lastSwappedSelector)
  const popularTokens: string[] = [] // TODO
  const supportedNetworkIds = getSupportedNetworkIdsForSwap()

  const networkIdFilters =
    supportedNetworkIds.length > 1
      ? supportedNetworkIds.map((networkId: NetworkId) => {
          const networkName = networkIdToNetwork[networkId]
          return {
            id: networkId,
            name: t('tokenBottomSheet.filters.network', {
              // title cased network name (always english)
              networkName: `${networkName.charAt(0).toUpperCase()}${networkName.slice(1)}`,
            }),
            filterFn: (token: TokenBalance) => token.networkId === networkId,
            isSelected: false,
          }
        })
      : []

  if (!showSwapTokenFilters) {
    return []
  }

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
    ...networkIdFilters,
  ]
}
