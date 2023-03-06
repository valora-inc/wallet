import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { SwapEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { TRANSACTION_FEES_LEARN_MORE } from 'src/config'
import AttentionIcon from 'src/icons/Attention'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

export function MaxAmountWarning() {
  const { t } = useTranslation()

  const onPressLearnMore = () => {
    ValoraAnalytics.track(SwapEvents.swap_gas_fees_learn_more)
    navigate(Screens.WebViewScreen, { uri: TRANSACTION_FEES_LEARN_MORE })
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <AttentionIcon color={Colors.goldDark} />
        <Text style={styles.titleText}>{t('swapScreen.maxSwapAmountWarning.title')}</Text>
      </View>

      <Text style={styles.bodyText}>{t('swapScreen.maxSwapAmountWarning.body')}</Text>
      <Text style={styles.learnMoreText} onPress={onPressLearnMore}>
        {t('swapScreen.maxSwapAmountWarning.learnMore')}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.Thick24,
    paddingHorizontal: Spacing.Thick24,
    paddingVertical: Spacing.Regular16,
    backgroundColor: Colors.yellowFaint,
    borderRadius: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.Smallest8,
  },
  titleText: {
    ...fontStyles.small600,
    marginLeft: Spacing.Small12,
  },
  bodyText: {
    ...fontStyles.small,
    marginBottom: Spacing.Regular16,
    marginLeft: 28,
  },
  learnMoreText: {
    ...fontStyles.small600,
    color: Colors.goldDark,
    alignSelf: 'flex-end',
  },
})

export default MaxAmountWarning
