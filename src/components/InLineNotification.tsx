import React from 'react'
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native'
import AttentionIcon from 'src/icons/Attention'
import Colors from 'src/styles/colors'
import fontStyles, { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

export enum Severity {
  Informational,
  Warning,
  Error,
}

interface Props {
  severity: Severity
  title?: string
  description: string
  style?: StyleProp<ViewStyle>
  ctaLabel?: string
  onPressCta?: () => void
  ctaLabel2?: string
  onPressCta2?: () => void
  testID?: string
}

interface CustomStyles {
  container: ViewStyle
  attentionIcon: Record<'color', Colors>
  ctaLabel: TextStyle
  ctaLabel2: TextStyle
}

export function InLineNotification({
  severity,
  title,
  description,
  style,
  ctaLabel,
  onPressCta,
  ctaLabel2,
  onPressCta2,
  testID,
}: Props) {
  const severityStyle = severityStyles[severity]
  return (
    <View style={[defaultStyles.container, style]} testID={testID}>
      {title && (
        <View style={defaultStyles.row}>
          <View style={defaultStyles.attentionIcon}>
            <AttentionIcon color={severityStyle.attentionIcon.color} />
          </View>
          <Text style={defaultStyles.titleText}>{title}</Text>
        </View>
      )}

      <View style={defaultStyles.bodyContainer}>
        <View style={[defaultStyles.row, defaultStyles.bodyRow]}>
          <View style={defaultStyles.attentionIcon}>
            {!title && <AttentionIcon color={severityStyle.attentionIcon.color} />}
          </View>
          <Text style={defaultStyles.bodyText}>{description}</Text>
        </View>

        {(ctaLabel || ctaLabel2) && (
          <View style={[defaultStyles.row, defaultStyles.ctaRow]}>
            {ctaLabel && onPressCta && (
              <Text style={[defaultStyles.ctaLabel, severityStyle.ctaLabel]} onPress={onPressCta}>
                {ctaLabel}
              </Text>
            )}
            {ctaLabel2 && onPressCta2 && (
              <Text
                style={[defaultStyles.ctaLabel2, severityStyle.ctaLabel2]}
                onPress={onPressCta2}
              >
                {ctaLabel2}
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  )
}

const defaultStyles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.Regular16,
    paddingTop: Spacing.Regular16,
    paddingBottom: Spacing.Small12,
    borderRadius: Spacing.Regular16,
    width: '100%',
    gap: Spacing.Tiny4,
  },
  bodyContainer: {
    gap: Spacing.Smallest8,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.Smallest8,
    alignItems: 'center',
  },
  bodyRow: {
    alignItems: 'flex-start',
  },
  ctaRow: {
    paddingVertical: Spacing.Tiny4,
    paddingHorizontal: Spacing.Smallest8,
    justifyContent: 'flex-end',
  },
  attentionIcon: {
    padding: Spacing.Tiny4,
    width: Spacing.Thick24,
    height: Spacing.Thick24,
  },
  titleText: {
    ...fontStyles.small600,
  },
  bodyText: {
    ...typeScale.bodyXSmall,
    lineHeight: 18,
    color: Colors.dark,
    flexShrink: 1,
  },
  ctaLabel: {
    ...fontStyles.small600,
    paddingHorizontal: Spacing.Smallest8,
    paddingVertical: Spacing.Tiny4,
  },
  ctaLabel2: {
    ...fontStyles.small600,
    paddingHorizontal: Spacing.Smallest8,
    paddingVertical: Spacing.Tiny4,
  },
})

const severityStyles: Record<Severity, CustomStyles> = {
  [Severity.Informational]: {
    container: { backgroundColor: Colors.informationFaint },
    attentionIcon: { color: Colors.informationDark },
    ctaLabel: { color: Colors.informationDark },
    ctaLabel2: { color: Colors.informationDark },
  },
  [Severity.Warning]: {
    container: { backgroundColor: Colors.warningLight },
    attentionIcon: { color: Colors.warningDark },
    ctaLabel: { color: Colors.warningDark },
    ctaLabel2: { color: Colors.warningDark },
  },
  [Severity.Error]: {
    container: { backgroundColor: Colors.errorLight },
    attentionIcon: { color: Colors.errorDark },
    ctaLabel: { color: Colors.errorDark },
    ctaLabel2: { color: Colors.errorDark },
  },
}

export default InLineNotification
