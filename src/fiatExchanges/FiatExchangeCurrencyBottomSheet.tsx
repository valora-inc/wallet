import { BottomSheetScreenProps } from '@th3rdwave/react-navigation-bottom-sheet'
import React, { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import BottomSheetScrollView from 'src/components/BottomSheetScrollView'
import { fetchFiatConnectProviders } from 'src/fiatconnect/slice'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { useDispatch } from 'src/redux/hooks'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { TokenBalanceItem } from 'src/tokens/TokenBalanceItem'
import { useCashInTokens, useCashOutTokens, useSpendTokens } from 'src/tokens/hooks'
import { TokenBalance } from 'src/tokens/slice'
import { sortCicoTokens } from 'src/tokens/utils'
import { resolveCurrency } from 'src/utils/currencies'
import { CICOFlow, FiatExchangeFlow } from './utils'

type Props = BottomSheetScreenProps<StackParamList, Screens.FiatExchangeCurrencyBottomSheet>

function FiatExchangeCurrencyBottomSheet({ route }: Props) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { flow } = route.params
  const cashInTokens = useCashInTokens()
  const cashOutTokens = useCashOutTokens(true)
  const spendTokens = useSpendTokens()
  const unsortedTokenList =
    flow === FiatExchangeFlow.CashIn
      ? cashInTokens
      : flow === FiatExchangeFlow.CashOut
        ? cashOutTokens
        : spendTokens

  const tokenList = useMemo(() => unsortedTokenList.sort(sortCicoTokens), [unsortedTokenList])

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
        tokenSymbol: symbol,
      })
    }

  return (
    <BottomSheetScrollView
      isScreen
      containerStyle={{ padding: undefined }}
      testId="FiatExchangeCurrencyBottomSheet"
    >
      {/* padding undefined to prevent android ripple bug */}
      <Text style={styles.selectDigitalCurrency}>{t('sendEnterAmountScreen.selectToken')}</Text>
      {!!tokenList.length &&
        tokenList.map((tokenInfo) => {
          return (
            <React.Fragment key={`token-${tokenInfo.tokenId}`}>
              <TokenBalanceItem token={tokenInfo} onPress={onTokenPressed(tokenInfo)} />
            </React.Fragment>
          )
        })}
    </BottomSheetScrollView>
  )
}

const styles = StyleSheet.create({
  selectDigitalCurrency: {
    ...typeScale.titleSmall,
    paddingHorizontal: Spacing.Thick24,
  },
})

export default FiatExchangeCurrencyBottomSheet
