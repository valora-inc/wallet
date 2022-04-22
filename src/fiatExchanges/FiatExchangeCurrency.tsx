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

type RouteProps = StackScreenProps<StackParamList, Screens.FiatExchangeCurrency>
type Props = RouteProps

export const fiatExchangesOptionsScreenOptions = ({
  route,
}: {
  route: RouteProp<StackParamList, Screens.FiatExchangeCurrency>
}) => {
  const { flow } = route.params
  return {
    ...emptyHeader,
    headerLeft: () => (
      <BackButton
        eventName={FiatExchangeEvents.cico_select_currency_back}
        eventProperties={{ flow }}
      />
    ),
    headerTitle: i18n.t(`fiatExchangeFlow.${route.params.flow}.selectCurrencyTitle`),
    headerRightContainerStyle: { paddingRight: 16 },
  }
}

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
    ValoraAnalytics.track(FiatExchangeEvents.cico_option_chosen, {
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

  const onSelectCurrency = (currency: Currency) => () => setSelectedCurrency(currency)

  // TODO(jwaterman): https://github.com/valora-inc/wallet/issues/2394

  // const [isEducationDialogVisible, setEducationDialogVisible] = useState(false)
  // const onPressInfoIcon = () => {
  //   setEducationDialogVisible(true)
  //   // ValoraAnalytics.track(
  //   //   isCashIn ? FiatExchangeEvents.cico_add_funds_info : FiatExchangeEvents.cico_cash_out_info
  //   // )
  // }

  // const onPressDismissEducationDialog = () => {
  //   setEducationDialogVisible(false)
  //   ValoraAnalytics.track(
  //     isCashIn
  //       ? FiatExchangeEvents.cico_add_funds_info_cancel
  //       : FiatExchangeEvents.cico_cash_out_info_cancel
  //   )
  // }

  return (
    <SafeAreaView style={styles.content}>
      <ScrollView style={styles.topContainer}>
        <View style={styles.titleContainer}>
          <Text style={styles.selectDigitalCurrency}>{t('selectDigitalCurrency')}</Text>
          {
            // TODO(jwaterman): https://github.com/valora-inc/wallet/issues/2394
            // <Touchable onPress={onPressInfoIcon} hitSlop={variables.iconHitslop}>
            //   <InfoIcon size={14} color={colors.gray3} />
            // </Touchable>
          }
        </View>
        <View style={styles.currenciesContainer}>
          <CurrencyRadioItem
            title={t('celoDollar')}
            body="(cUSD)"
            selected={selectedCurrency === Currency.Dollar}
            onSelect={onSelectCurrency(Currency.Dollar)}
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
            onSelect={onSelectCurrency(Currency.Euro)}
            containerStyle={{
              borderTopWidth: 0.5,
              borderBottomWidth: 0.5,
            }}
            testID="radio/cEUR"
          />
          <CurrencyRadioItem
            title="CELO"
            selected={selectedCurrency === Currency.Celo}
            onSelect={onSelectCurrency(Currency.Celo)}
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
      {
        // TODO(jwaterman): https://github.com/valora-inc/wallet/issues/2394
        // <FundingEducationDialog
        //   isVisible={isEducationDialogVisible}
        //   onPressDismiss={onPressDismissEducationDialog}
        //   isCashIn={true}
        // />
      }
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    backgroundColor: colors.gray1,
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
