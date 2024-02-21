import { useTranslation } from 'react-i18next'
import { FilterChip } from 'src/components/FilterChipsCarousel'
import { TOKEN_MIN_AMOUNT } from 'src/config'
import useSelector from 'src/redux/useSelector'
import { NETWORK_NAMES } from 'src/shared/conts'
import { getDynamicConfigParams, getFeatureGate } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs, StatsigFeatureGates } from 'src/statsig/types'
import { lastSwappedSelector } from 'src/swap/selectors'
import { Field } from 'src/swap/types'
import { useTokensWithTokenBalance } from 'src/tokens/hooks'
import { TokenBalance } from 'src/tokens/slice'
import { getSupportedNetworkIdsForSwap } from 'src/tokens/utils'
import { NetworkId } from 'src/transactions/types'

export default function useFilterChip(selectingField: Field | null): FilterChip<TokenBalance>[] {
  const { t } = useTranslation()
  const showSwapTokenFilters = getFeatureGate(StatsigFeatureGates.SHOW_SWAP_TOKEN_FILTERS)
  const recentlySwappedTokens = useSelector(lastSwappedSelector)
  const tokensWithBalance = useTokensWithTokenBalance()
  const popularTokenIds: string[] = getDynamicConfigParams(
    DynamicConfigs[StatsigDynamicConfigs.SWAP_CONFIG]
  ).popularTokenIds
  const supportedNetworkIds = getSupportedNetworkIdsForSwap()

  const networkIdFilters =
    supportedNetworkIds.length > 1
      ? supportedNetworkIds.map((networkId: NetworkId) => {
          return {
            id: networkId,
            name: t('tokenBottomSheet.filters.network', {
              networkName: NETWORK_NAMES[networkId],
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
      isSelected: selectingField === Field.FROM && tokensWithBalance.length > 0,
    },
    {
      id: 'popular',
      name: t('tokenBottomSheet.filters.popular'),
      filterFn: (token: TokenBalance) => popularTokenIds.includes(token.tokenId),
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
