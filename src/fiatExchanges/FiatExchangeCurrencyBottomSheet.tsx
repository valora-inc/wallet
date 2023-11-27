import { BottomSheetScreenProps } from '@th3rdwave/react-navigation-bottom-sheet'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import { useDispatch } from 'react-redux'
import BottomSheetScrollView from 'src/components/BottomSheetScrollView'
import { TokenBalanceItemOption } from 'src/components/TokenBottomSheet'
import { CiCoCurrencyNetworkMap } from 'src/fiatExchanges/types'
import { fetchFiatConnectProviders } from 'src/fiatconnect/slice'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { typeScale } from 'src/styles/fonts'
import { useCashInTokens, useCashOutTokens, useSpendTokens } from 'src/tokens/hooks'
import { TokenBalance } from 'src/tokens/slice'
import { resolveCICOCurrency, resolveCurrency } from 'src/utils/currencies'
import { CICOFlow, FiatExchangeFlow } from './utils'

type Props = BottomSheetScreenProps<StackParamList, Screens.FiatExchangeCurrencyBottomSheet>

function FiatExchangeCurrencyBottomSheet({ route }: Props) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { flow } = route.params
  const cashInTokens = useCashInTokens()
  const cashOutTokens = useCashOutTokens()
  const spendTokens = useSpendTokens()
  const tokenList =
    flow === FiatExchangeFlow.CashIn
      ? cashInTokens
      : flow === FiatExchangeFlow.CashOut
      ? cashOutTokens
      : spendTokens

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
        tokenId: tokenId,
        flow: flow === FiatExchangeFlow.CashIn ? CICOFlow.CashIn : CICOFlow.CashOut,
        // TODO: Remove after merging other refactor PR
        currency: resolveCICOCurrency(symbol),
        network: CiCoCurrencyNetworkMap[resolveCICOCurrency(symbol)],
      })
    }

  return (
    <BottomSheetScrollView>
      <Text style={styles.selectDigitalCurrency}>{t('sendEnterAmountScreen.selectToken')}</Text>
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

const styles = StyleSheet.create({
  selectDigitalCurrency: {
    ...typeScale.titleSmall,
    marginRight: 12,
  },
})

export default FiatExchangeCurrencyBottomSheet
