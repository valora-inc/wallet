import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { FiatExchangeEvents } from 'src/analytics/Events'
import Touchable from 'src/components/Touchable'
import { FiatExchangeFlow } from 'src/fiatExchanges/types'
import CircledIcon from 'src/icons/CircledIcon'
import EarnCoins from 'src/icons/EarnCoins'
import ExploreTokens from 'src/icons/ExploreTokens'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

function EarnItem() {
  const { t } = useTranslation()

  return (
    <Item
      icon={
        <CircledIcon radius={32} backgroundColor={colors.successLight}>
          <EarnCoins color={colors.successDark} />
        </CircledIcon>
      }
      title={t('earnFlow.entrypoint.title')}
      body={t('earnFlow.entrypoint.description')}
    />
  )
}

export default function GetStarted() {
  const { t } = useTranslation()

  const goToAddFunds = () => {
    AppAnalytics.track(FiatExchangeEvents.cico_add_get_started_selected)
    navigate(Screens.FiatExchangeCurrencyBottomSheet, { flow: FiatExchangeFlow.CashIn })
  }

  useEffect(() => {
    AppAnalytics.track(FiatExchangeEvents.cico_add_get_started_impression)
  }, [])

  return (
    <View testID="GetStarted" style={styles.container}>
      <Text style={styles.title}>{t('getStarted')}</Text>
      <Touchable
        borderRadius={8}
        style={styles.touchable}
        onPress={goToAddFunds}
        testID="GetStarted/Touchable"
      >
        <View style={styles.touchableView}>
          <Text style={styles.cardTitle}>{t('getStartedHome.titleV1_86')}</Text>
          <EarnItem />
          <Item
            icon={<ExploreTokens />}
            title={t('getStartedHome.exploreTokens')}
            body={t('getStartedHome.exploreTokensBody')}
          />
        </View>
      </Touchable>
    </View>
  )
}

function Item({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <View style={styles.row}>
      {icon}
      <View style={styles.itemTextContainer}>
        <Text style={styles.itemTitle}>{title}</Text>
        <Text style={styles.itemBody}>{body}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  cardTitle: {
    ...typeScale.labelSemiBoldMedium,
    color: colors.black,
  },
  container: {
    gap: 18,
    margin: Spacing.Regular16,
  },
  title: {
    ...typeScale.labelSemiBoldSmall,
    color: colors.gray4,
  },
  touchable: {
    padding: Spacing.Regular16,
    borderColor: colors.gray2,
    borderWidth: 1,
    borderRadius: 8,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.Smallest8,
  },
  itemTitle: {
    ...typeScale.labelSemiBoldXSmall,
    color: colors.black,
  },
  itemBody: {
    ...typeScale.bodyXSmall,
    color: colors.gray4,
  },
  touchableView: {
    gap: Spacing.Thick24,
  },
  itemTextContainer: {
    flex: 1,
  },
})
