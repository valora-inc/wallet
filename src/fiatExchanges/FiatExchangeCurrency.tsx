import { RouteProp } from '@react-navigation/core'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native'
import { TouchableWithoutFeedback } from 'react-native-gesture-handler'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BackButton from 'src/components/BackButton'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import i18n from 'src/i18n'
import RadioButton from 'src/icons/RadioButton'
import { emptyHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { Currency } from 'src/utils/currencies'
import { CICOFlow, FiatExchangeFlow } from './utils'

type Props = StackScreenProps<StackParamList, Screens.FiatExchangeCurrency>

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
    <TouchableWithoutFeedback onPress={onSelect} disabled={!enabled}>
      <View
        pointerEvents="none"
        style={[
          styles.currencyItemContainer,
          containerStyle,
          { borderColor: selected ? colors.greenUI : colors.gray3 },
        ]}
        testID={testID}
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
  const { flow } = route.params

  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(Currency.Dollar)

  const goToProvider = () => {
    ValoraAnalytics.track(FiatExchangeEvents.cico_currency_chosen, {
      flow,
      currency: selectedCurrency,
    })
    if (flow === FiatExchangeFlow.Spend) {
      return navigate(Screens.BidaliScreen, {
        currency: selectedCurrency,
      })
    }
    navigate(Screens.FiatExchangeAmount, {
      currency: selectedCurrency,
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
            selected={selectedCurrency === Currency.Dollar}
            onSelect={() => setSelectedCurrency(Currency.Dollar)}
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
            selected={selectedCurrency === Currency.Euro}
            onSelect={() => setSelectedCurrency(Currency.Euro)}
            containerStyle={{
              borderTopWidth: 0.5,
              borderBottomWidth: 0.5,
            }}
            testID="radio/cEUR"
          />
          <CurrencyRadioItem
            title="CELO"
            selected={selectedCurrency === Currency.Celo}
            onSelect={() => setSelectedCurrency(Currency.Celo)}
            enabled={flow !== FiatExchangeFlow.Spend}
            containerStyle={{
              borderTopWidth: 0.5,
              borderBottomLeftRadius: 8,
              borderBottomRightRadius: 8,
            }}
            testID="radio/CELO"
          />
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
})

export default FiatExchangeCurrency
