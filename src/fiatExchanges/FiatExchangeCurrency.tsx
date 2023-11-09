import { RouteProp } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native'
import { useDispatch } from 'react-redux'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BackButton from 'src/components/BackButton'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { fetchFiatConnectProviders } from 'src/fiatconnect/slice'
import i18n from 'src/i18n'
import RadioButton from 'src/icons/RadioButton'
import { emptyHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { getDynamicConfigParams } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { Network } from 'src/transactions/types'
import { CiCoCurrency, currencyForAnalytics, resolveCurrency } from 'src/utils/currencies'
import networkConfig from 'src/web3/networkConfig'
import { CICOFlow, FiatExchangeFlow } from './utils'

type Props = NativeStackScreenProps<StackParamList, Screens.FiatExchangeCurrency>

export const fiatExchangesOptionsScreenOptions = ({
  route,
}: {
  route: RouteProp<StackParamList, Screens.FiatExchangeCurrency>
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

// pointerEvents="none" added for disabled testing - https://github.com/wix/Detox/issues/2821
function CurrencyRadioItem({
  selected,
  onSelect,
  enabled = true,
  title,
  body,
  containerStyle,
  testID,
}: {
  selected: boolean
  onSelect: () => void
  enabled?: boolean
  title: string
  body?: string
  containerStyle: ViewStyle
  testID?: string
}) {
  return (
    <TouchableWithoutFeedback testID={testID} onPress={onSelect} disabled={!enabled}>
      <View
        style={[
          styles.currencyItemContainer,
          containerStyle,
          { borderColor: selected ? colors.greenUI : colors.gray3 },
        ]}
      >
        <RadioButton selected={selected} disabled={!enabled} />
        <Text style={[styles.currencyItemTitle, enabled ? {} : { color: colors.gray3 }]}>
          {title}
        </Text>
        {body && <Text style={styles.currencyItemBody}>{body}</Text>}
      </View>
    </TouchableWithoutFeedback>
  )
}

function FiatExchangeCurrency({ route, navigation }: Props) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { flow } = route.params

  const [selectedCurrency, setSelectedCurrency] = useState<CiCoCurrency>(CiCoCurrency.cUSD)
  // TODO: Update this to actually respect all possible networkIds correctly
  const showEth = getDynamicConfigParams(
    DynamicConfigs[StatsigDynamicConfigs.MULTI_CHAIN_FEATURES]
  ).showCico.includes(networkConfig.networkToNetworkId[Network.Ethereum])

  // Fetch FiatConnect providers silently in the background early in the CICO funnel
  useEffect(() => {
    dispatch(fetchFiatConnectProviders())
  }, [])

  const goToProvider = () => {
    ValoraAnalytics.track(FiatExchangeEvents.cico_currency_chosen, {
      flow,
      currency: currencyForAnalytics[selectedCurrency],
    })
    if (flow === FiatExchangeFlow.Spend) {
      return navigate(Screens.BidaliScreen, {
        // ResolveCurrency is okay to use here since Bidali only
        // supports cEUR and cUSD
        currency: resolveCurrency(selectedCurrency),
      })
    }
    navigate(Screens.FiatExchangeAmount, {
      tokenId: networkConfig.currencyToTokenId[selectedCurrency],
      flow: flow === FiatExchangeFlow.CashIn ? CICOFlow.CashIn : CICOFlow.CashOut,
    })
  }

  return (
    <SafeAreaView style={styles.content}>
      <ScrollView style={styles.topContainer}>
        <View style={styles.titleContainer}>
          <Text style={styles.selectDigitalCurrency}>{t('selectDigitalCurrency')}</Text>
        </View>
        <View style={styles.currenciesContainer}>
          <CurrencyRadioItem
            title={t('celoDollar')}
            body="(cUSD)"
            selected={selectedCurrency === CiCoCurrency.cUSD}
            onSelect={() => setSelectedCurrency(CiCoCurrency.cUSD)}
            containerStyle={{
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
              borderBottomWidth: 0.5,
            }}
            testID="radio/cUSD"
          />
          <CurrencyRadioItem
            title={t('celoEuro')}
            body="(cEUR)"
            selected={selectedCurrency === CiCoCurrency.cEUR}
            onSelect={() => setSelectedCurrency(CiCoCurrency.cEUR)}
            containerStyle={styles.radioMiddle}
            testID="radio/cEUR"
          />
          <CurrencyRadioItem
            title="CELO"
            selected={selectedCurrency === CiCoCurrency.CELO}
            onSelect={() => setSelectedCurrency(CiCoCurrency.CELO)}
            enabled={flow !== FiatExchangeFlow.Spend}
            containerStyle={styles.radioMiddle}
            testID="radio/CELO"
          />
          <CurrencyRadioItem
            title={t('celoReal')}
            body="(cREAL)"
            selected={selectedCurrency === CiCoCurrency.cREAL}
            onSelect={() => setSelectedCurrency(CiCoCurrency.cREAL)}
            enabled={flow === FiatExchangeFlow.CashIn}
            containerStyle={showEth ? styles.radioMiddle : styles.radioBottom}
            testID="radio/cREAL"
          />
          {showEth && (
            <CurrencyRadioItem
              title={t('ether')}
              body="(ETH)"
              selected={selectedCurrency === CiCoCurrency.ETH}
              onSelect={() => setSelectedCurrency(CiCoCurrency.ETH)}
              enabled={flow === FiatExchangeFlow.CashIn}
              containerStyle={styles.radioBottom}
              testID="radio/ETH"
            />
          )}
        </View>
      </ScrollView>
      <View style={styles.bottomContainer}>
        <Button
          style={styles.goToProvider}
          type={BtnTypes.PRIMARY}
          size={BtnSizes.FULL}
          text={t('next')}
          onPress={goToProvider}
          testID={'GoToProviderButton'}
        />
      </View>
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

export default FiatExchangeCurrency
