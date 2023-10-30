import React from 'react'
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native'
import AttentionIcon from 'src/icons/Attention'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

interface Props {
  title: string
  description: string
  ctaLabel?: string | null
  style?: StyleProp<ViewStyle>
  onPressCta?: () => void
  testID?: string
}

export function Warning({ title, description, ctaLabel, style, onPressCta, testID }: Props) {
  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.row}>
        <AttentionIcon color={Colors.goldDark} />
        <Text style={styles.titleText}>{title}</Text>
      </View>

      <Text style={styles.bodyText}>{description}</Text>

      {ctaLabel && onPressCta && (
        <Text style={styles.learnMoreText} onPress={onPressCta}>
          {ctaLabel}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
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
