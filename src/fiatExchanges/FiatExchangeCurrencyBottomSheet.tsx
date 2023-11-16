import { RouteProp } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, StyleSheet } from 'react-native'
import { useDispatch } from 'react-redux'
import { FiatExchangeEvents } from 'src/analytics/Events'
import BackButton from 'src/components/BackButton'
import { BottomSheetRefType } from 'src/components/BottomSheet'
import TokenBottomSheet, { TokenPickerOrigin } from 'src/components/TokenBottomSheet'
import { CiCoCurrencyNetworkMap } from 'src/fiatExchanges/types'
import { fetchFiatConnectProviders } from 'src/fiatconnect/slice'
import i18n from 'src/i18n'
import { emptyHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import useSelector from 'src/redux/useSelector'
import { getDynamicConfigParams } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { cicoTokensSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import { resolveCICOCurrency, resolveCurrency } from 'src/utils/currencies'
import { CICOFlow, FiatExchangeFlow } from './utils'

type Props = NativeStackScreenProps<StackParamList, Screens.FiatExchangeCurrencyBottomSheet>

export const fiatExchangesBottomSheetOptionsScreenOptions = ({
  route,
}: {
  route: RouteProp<StackParamList, Screens.FiatExchangeCurrencyBottomSheet>
}) => {
  const { flow } = route.params

  const headerTitle = () => {
    switch (flow) {
      case FiatExchangeFlow.CashIn:
        return i18n.t(`fiatExchangeFlow.cashIn.selectCurrencyTitle`)
      case FiatExchangeFlow.CashOut:
        return i18n.t(`fiatExchangeFlow.cashOut.selectCurrencyTitle`)
      case FiatExchangeFlow.Spend:
        return i18n.t(`fiatExchangeFlow.spend.selectCurrencyTitle`)
    }
  }
  return {
    ...emptyHeader,
    headerLeft: () => (
      <BackButton eventName={FiatExchangeEvents.cico_currency_back} eventProperties={{ flow }} />
    ),
    headerTitle: headerTitle(),
    headerRightContainerStyle: { paddingRight: 16 },
  }
}

function FiatExchangeCurrencyBottomSheet({ route }: Props) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { flow } = route.params
  const currencyPickerBottomSheetRef = useRef<BottomSheetRefType>(null)
  const supportedNetworkIds = getDynamicConfigParams(
    DynamicConfigs[StatsigDynamicConfigs.MULTI_CHAIN_FEATURES]
  ).showCico
  const tokens = useSelector((state) => cicoTokensSelector(state, supportedNetworkIds))

  currencyPickerBottomSheetRef.current?.snapToIndex(0)

  // Fetch FiatConnect providers silently in the background early in the CICO funnel
  useEffect(() => {
    dispatch(fetchFiatConnectProviders())
  }, [])

  const onTokenSelected = ({ tokenId, symbol }: TokenBalance) => {
    currencyPickerBottomSheetRef.current?.close()
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
    <SafeAreaView style={styles.content}>
      <TokenBottomSheet
        forwardedRef={currencyPickerBottomSheetRef}
        origin={TokenPickerOrigin.Add}
        onTokenSelected={onTokenSelected}
        tokens={tokens}
        title={t('selectToken')}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  topContainer: {
    paddingHorizontal: variables.contentPadding,
    backgroundColor: colors.light,
  },
  titleContainer: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: variables.contentPadding,
  },
  selectDigitalCurrency: {
    ...fontStyles.regular,
    marginRight: 12,
  },
  currenciesContainer: {
    flexDirection: 'column',
    marginTop: 8,
  },
  currencyItemContainer: {
    flexDirection: 'row',
    padding: variables.contentPadding,
    borderWidth: 1,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  currencyItemTitle: {
    ...fontStyles.regular500,
    marginLeft: variables.contentPadding,
  },
  currencyItemBody: {
    ...fontStyles.regular500,
    color: colors.gray4,
    marginLeft: 4,
  },
  bottomContainer: {
    flexDirection: 'column',
    paddingHorizontal: variables.contentPadding,
  },
  goToProvider: {
    width: '50%',
    alignSelf: 'center',
    marginTop: 40,
    marginBottom: 24,
  },
  radioMiddle: {
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
  },
  radioBottom: {
    borderTopWidth: 0.5,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
})

export default FiatExchangeCurrencyBottomSheet
