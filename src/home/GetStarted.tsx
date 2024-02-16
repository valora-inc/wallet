import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Button from 'src/components/Button'
import { FiatExchangeFlow } from 'src/fiatExchanges/utils'
import Bird from 'src/icons/Bird'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import useSelector from 'src/redux/useSelector'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

export default function GetStarted() {
  const { t } = useTranslation()
  const { superchargeApy } = useSelector((state) => state.app)
  const goToAddFunds = () => {
    ValoraAnalytics.track(FiatExchangeEvents.cico_add_get_started_selected)
    navigate(Screens.FiatExchangeCurrencyBottomSheet, { flow: FiatExchangeFlow.CashIn })
  }

  useEffect(() => {
    ValoraAnalytics.track(FiatExchangeEvents.cico_add_get_started_impression)
  }, [])

  return (
    <View testID="GetStarted" style={styles.container}>
      <Text style={styles.title}>{t('getStarted')}</Text>
      <View style={styles.card}>
        <Bird viewStyle={styles.icon} />
        <Text style={styles.cardTitle}>{t('getStartedHome.title')}</Text>
        <Text style={styles.cardBody}>{t('getStartedHome.body', { apy: superchargeApy })}</Text>
        <Button style={styles.button} text={t('addFunds')} onPress={goToAddFunds} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'column',
    width: '100%',
  },
  card: {
    alignItems: 'flex-start',
    borderRadius: 10,
    backgroundColor: colors.gray1,
    flex: 1,
    gap: Spacing.Regular16,
    justifyContent: 'center',
    padding: Spacing.Thick24,
  },
  cardTitle: {
    ...typeScale.labelMedium,
    color: colors.gray5,
  },
  cardBody: {
    ...typeScale.bodySmall,
    color: colors.gray3,
  },
  container: {
    gap: 18,
    margin: Spacing.Thick24,
  },
  icon: {
    marginBottom: Spacing.Regular16,
    marginLeft: Spacing.Thick24,
    ...typeScale.labelSemiBoldMedium,
  },
  title: {
    ...typeScale.bodySmall,
    color: colors.gray4,
  },
})
