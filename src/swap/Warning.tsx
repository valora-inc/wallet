import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import AttentionIcon from 'src/icons/Attention'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

interface Props {
  title: string
  description: string
  ctaLabel?: string | null
  onPressCta?: () => void
}

export function Warning({ title, description, ctaLabel, onPressCta }: Props) {
  const { t } = useTranslation()

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <AttentionIcon color={Colors.goldDark} />
        <Text style={styles.titleText}>{title}</Text>
      </View>

      <Text style={styles.bodyText}>{description}</Text>

      {ctaLabel && onPressCta && (
        <Text style={styles.learnMoreText} onPress={onPressCta}>
          {t('swapScreen.maxSwapAmountWarning.learnMore')}
        </Text>
      )}
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

export default Warning
