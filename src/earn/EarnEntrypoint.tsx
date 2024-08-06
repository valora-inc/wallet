import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { EarnEvents } from 'src/analytics/Events'
import AppAnalytics from 'src/analytics/AppAnalytics'
import Touchable from 'src/components/Touchable'
import CircledIcon from 'src/icons/CircledIcon'
import EarnCoins from 'src/icons/EarnCoins'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

export default function EarnEntrypoint() {
  const { t } = useTranslation()

  return (
    <View style={styles.container}>
      <Touchable
        borderRadius={8}
        style={styles.touchable}
        onPress={() => {
          AppAnalytics.track(EarnEvents.earn_entrypoint_press)
          navigate(Screens.EarnInfoScreen)
        }}
        testID="EarnEntrypoint"
      >
        <>
          <Text style={styles.title}>{t('earnFlow.entrypoint.title')}</Text>
          <View style={styles.row}>
            <CircledIcon radius={32} backgroundColor={Colors.successLight}>
              <EarnCoins size={20} color={Colors.successDark} />
            </CircledIcon>
            <View style={styles.subtitleContainer}>
              <Text style={styles.subtitle}>{t('earnFlow.entrypoint.subtitle')}</Text>
              <Text style={styles.description}>{t('earnFlow.entrypoint.description')}</Text>
            </View>
          </View>
        </>
      </Touchable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.Thick24,
  },
  touchable: {
    padding: Spacing.Regular16,
    borderColor: Colors.gray2,
    borderWidth: 1,
    borderRadius: 8,
  },
  title: {
    ...typeScale.labelSemiBoldMedium,
    color: Colors.black,
  },
  row: {
    flexDirection: 'row',
    marginTop: Spacing.Regular16,
    gap: Spacing.Smallest8,
  },
  subtitleContainer: {
    flex: 1,
  },
  subtitle: {
    ...typeScale.labelSemiBoldSmall,
    color: Colors.black,
  },
  description: {
    ...typeScale.bodySmall,
    color: Colors.gray4,
  },
})
