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
    ...(supportedNetworkIds.length > 1
      ? [
          {
            id: 'celo-network',
            name: t('tokenBottomSheet.filters.celo'),
            filterFn: (token: TokenBalance) => networkIdToNetwork[token.networkId] === Network.Celo,
            isSelected: false,
          },
        ]
      : []),
    ...(supportedNetworkIds.includes(NetworkId['ethereum-mainnet']) ||
    supportedNetworkIds.includes(NetworkId['ethereum-sepolia'])
      ? [
          {
            id: 'ethereum-network',
            name: t('tokenBottomSheet.filters.ethereum'),
            filterFn: (token: TokenBalance) =>
              networkIdToNetwork[token.networkId] === Network.Ethereum,
            isSelected: false,
          },
        ]
      : []),
  ]
}
