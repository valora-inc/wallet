import { BottomSheetScreenProps } from '@th3rdwave/react-navigation-bottom-sheet'
import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import BottomSheetScrollView from 'src/components/BottomSheetScrollView'
import { TokenBalanceItemOption } from 'src/components/TokenBottomSheet'
import { CiCoCurrencyNetworkMap } from 'src/fiatExchanges/types'
import { fetchFiatConnectProviders } from 'src/fiatconnect/slice'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import useSelector from 'src/redux/useSelector'
import { getDynamicConfigParams } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import { cicoTokensSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import { resolveCICOCurrency, resolveCurrency } from 'src/utils/currencies'
import { CICOFlow, FiatExchangeFlow } from './utils'

type Props = BottomSheetScreenProps<StackParamList, Screens.FiatExchangeCurrencyBottomSheet>

function FiatExchangeCurrencyBottomSheet({ route }: Props) {
  const dispatch = useDispatch()
  const { flow } = route.params
  const supportedNetworkIds = getDynamicConfigParams(
    DynamicConfigs[StatsigDynamicConfigs.MULTI_CHAIN_FEATURES]
  ).showCico
  const tokenList = useSelector((state) => cicoTokensSelector(state, supportedNetworkIds, flow))

  // Fetch FiatConnect providers silently in the background early in the CICO funnel
  useEffect(() => {
    dispatch(fetchFiatConnectProviders())
  }, [])

  const onTokenPressed =
    ({ tokenId, symbol }: TokenBalance) =>
    () => {
      if (flow === FiatExchangeFlow.Spend) {
        return navigate(Screens.BidaliScreen, {
          // ResolveCurrency is okay to use here since Bidali only
          // supports cEUR and cUSD
          currency: resolveCurrency(symbol),
        })
      }
      navigate(Screens.FiatExchangeAmount, {
        currency: resolveCICOCurrency(symbol),
        tokenId: tokenId,
        flow: flow === FiatExchangeFlow.CashIn ? CICOFlow.CashIn : CICOFlow.CashOut,
        network: CiCoCurrencyNetworkMap[resolveCICOCurrency(symbol)],
      })
    }

  return (
    <BottomSheetScrollView>
      {tokenList.length == 0
        ? null
        : tokenList.map((tokenInfo, index) => {
            return (
              <React.Fragment key={`token-${tokenInfo.tokenId ?? index}`}>
                <TokenBalanceItemOption
                  tokenInfo={tokenInfo}
                  onPress={onTokenPressed(tokenInfo)}
                  index={index}
                />
              </React.Fragment>
            )
          })}
    </BottomSheetScrollView>
  )
}

export default FiatExchangeCurrencyBottomSheet
