import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { SwapEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { SWAP_LEARN_MORE } from 'src/config'
import DeniedIcon from 'src/icons/DeniedIcon'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

export function MaxAmountWarning() {
  const { t } = useTranslation()

  const onPressLearnMore = () => {
    ValoraAnalytics.track(SwapEvents.swap_gas_fees_learn_more)
    // TODO url
    navigate(Screens.WebViewScreen, { uri: SWAP_LEARN_MORE })
  }

  return (
    <View style={styles.container}>
      <DeniedIcon color={Colors.goldDark} />
      <View style={styles.contentContainer}>
        <Text style={styles.titleText}>{t('swapScreen.maxSwapAmountWarning.title')}</Text>
        <Text style={styles.bodyText}>{t('swapScreen.maxSwapAmountWarning.body')}</Text>
        <Text style={styles.learnMoreText} onPress={onPressLearnMore}>
          {t('swapScreen.maxSwapAmountWarning.learnMore')}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginTop: Spacing.Thick24,
    padding: Spacing.Regular16,
    backgroundColor: Colors.yellowFaint,
    borderRadius: 4,
  },
  contentContainer: {
    flex: 1,
    paddingLeft: Spacing.Small12,
  },
  titleText: {
    ...fontStyles.small600,
    marginBottom: Spacing.Smallest8,
  },
  bodyText: {
    ...fontStyles.small,
    marginBottom: Spacing.Regular16,
  },
  learnMoreText: {
    ...fontStyles.small600,
    color: Colors.goldDark,
    alignSelf: 'flex-end',
  },
})

export default MaxAmountWarning
