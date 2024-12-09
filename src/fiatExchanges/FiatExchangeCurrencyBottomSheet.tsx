import { BottomSheetScreenProps } from '@th3rdwave/react-navigation-bottom-sheet'
import React, { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FilterChip } from 'src/components/FilterChipsCarousel'
import TokenBottomSheet, { TokenPickerOrigin } from 'src/components/TokenBottomSheet'
import { fetchFiatConnectProviders } from 'src/fiatconnect/slice'
import { CICOFlow, FiatExchangeFlow } from 'src/fiatExchanges/types'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { getDynamicConfigParams, getFeatureGate, getMultichainFeatures } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs, StatsigFeatureGates } from 'src/statsig/types'
import { useCashInTokens, useCashOutTokens, useSpendTokens } from 'src/tokens/hooks'
import { allFeeCurrenciesSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import { sortCicoTokens } from 'src/tokens/utils'
import { NetworkId } from 'src/transactions/types'
import { resolveCurrency } from 'src/utils/currencies'

type Props = BottomSheetScreenProps<StackParamList, Screens.FiatExchangeCurrencyBottomSheet>

function useFilterChips(
  flow: FiatExchangeFlow,
  preselectedNetworkId?: NetworkId
): FilterChip<TokenBalance>[] {
  const { t } = useTranslation()
  const feeCurrencies = useSelector(allFeeCurrenciesSelector)
  const feeTokenIds = useMemo(
    () => new Set(feeCurrencies.map((currency) => currency.tokenId)),
    [feeCurrencies]
  )

  const showUKCompliantVariant = getFeatureGate(StatsigFeatureGates.SHOW_UK_COMPLIANT_VARIANT)

  if (flow !== FiatExchangeFlow.CashIn) {
    return []
  }
  const supportedNetworkIds = getMultichainFeatures().showCico
  // reuse the same popular tokens as for swap
  const popularTokenIds: string[] = getDynamicConfigParams(
    DynamicConfigs[StatsigDynamicConfigs.SWAP_CONFIG]
  ).popularTokenIds

  return [
    ...(showUKCompliantVariant
      ? []
      : [
          {
            id: 'popular',
            name: t('tokenBottomSheet.filters.popular'),
            filterFn: (token: TokenBalance) => popularTokenIds.includes(token.tokenId),
            isSelected: false,
          },
        ]),
    {
      id: 'stablecoins',
      name: t('tokenBottomSheet.filters.stablecoins'),
      filterFn: (token: TokenBalance) => !!token.isStableCoin,
      isSelected: false,
    },
    {
      id: 'gas-tokens',
      name: t('tokenBottomSheet.filters.gasTokens'),
      filterFn: (token: TokenBalance) => feeTokenIds.has(token.tokenId),
      isSelected: false,
    },
    {
      id: 'network-ids',
      name: t('tokenBottomSheet.filters.selectNetwork'),
      filterFn: (token: TokenBalance, selected?: NetworkId[]) => {
        return !!selected && selected.includes(token.networkId)
      },
      isSelected: !!preselectedNetworkId,
      allNetworkIds: supportedNetworkIds,
      selectedNetworkIds: preselectedNetworkId ? [preselectedNetworkId] : supportedNetworkIds,
    },
  ]
}

function FiatExchangeCurrencyBottomSheet({ route }: Props) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { flow, networkId } = route.params
  const cashInTokens = useCashInTokens()
  const cashOutTokens = useCashOutTokens(true)
  const spendTokens = useSpendTokens()
  const unsortedTokenList =
    flow === FiatExchangeFlow.CashIn
      ? cashInTokens
      : flow === FiatExchangeFlow.CashOut
        ? cashOutTokens
        : spendTokens

  const tokenList = useMemo(() => [...unsortedTokenList].sort(sortCicoTokens), [unsortedTokenList])
  const filterChips = useFilterChips(flow, networkId)

  // Fetch FiatConnect providers silently in the background early in the CICO funnel
  useEffect(() => {
    dispatch(fetchFiatConnectProviders())
  }, [])

  const onTokenPressed = ({ tokenId, symbol }: TokenBalance) => {
    if (flow === FiatExchangeFlow.Spend) {
      return navigate(Screens.BidaliScreen, {
        // ResolveCurrency is okay to use here since Bidali only
        // supports cEUR and cUSD
        currency: resolveCurrency(symbol),
      })
    }
    navigate(Screens.FiatExchangeAmount, {
      tokenId: tokenId,
      flow: flow === FiatExchangeFlow.CashIn ? CICOFlow.CashIn : CICOFlow.CashOut,
      tokenSymbol: symbol,
    })
  }

  return (
    <TokenBottomSheet
      isScreen
      tokens={tokenList}
      onTokenSelected={onTokenPressed}
      title={t('sendEnterAmountScreen.selectToken')}
      origin={
        flow === FiatExchangeFlow.CashIn
          ? TokenPickerOrigin.CashIn
          : flow === FiatExchangeFlow.CashOut
            ? TokenPickerOrigin.CashOut
            : TokenPickerOrigin.Spend
      }
      filterChips={filterChips}
    />
  )
}

export default FiatExchangeCurrencyBottomSheet
