import React from 'react'
import { GestureResponderEvent, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native'
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
  title?: string | null
  description: string
  style?: StyleProp<ViewStyle>
  ctaLabel?: string | null
  onPressCta?: () => void
  ctaLabel2?: string | null
  onPressCta2?: () => void
  testID?: string
}

interface CustomStyles {
  primary: Colors
  secondary: Colors
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
  const renderCtaLabel = (
    label?: string | null,
    onPress?: (event: GestureResponderEvent) => void,
    color?: Colors
  ) =>
    label &&
    onPress && (
      <Text style={[defaultStyles.ctaLabel, { color }]} onPress={onPress}>
        {label}
      </Text>
    )

  return (
    <View
      style={[defaultStyles.container, { backgroundColor: severityStyle.secondary }, style]}
      testID={testID}
    >
      <View style={[defaultStyles.row, title ? null : defaultStyles.bodyRow]}>
        <View style={defaultStyles.attentionIcon}>
          <AttentionIcon color={severityStyle.primary} />
        </View>
        {title ? (
          <Text style={defaultStyles.titleText}>{title}</Text>
        ) : (
          <Text style={defaultStyles.bodyText}>{description}</Text>
        )}
      </View>

      {title && (
        <Text style={[defaultStyles.row, defaultStyles.iconLessRow, defaultStyles.bodyText]}>
          {description}
        </Text>
      )}

      {(ctaLabel || ctaLabel2) && (
        <View style={[defaultStyles.row, defaultStyles.ctaRow]}>
          {renderCtaLabel(ctaLabel, onPressCta, severityStyle.primary)}
          {renderCtaLabel(ctaLabel2, onPressCta2, severityStyle.primary)}
        </View>
      )}
    </View>
  )
}

const defaultStyles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.Regular16,
    paddingVertical: Spacing.Regular16,
    borderRadius: Spacing.Regular16,
    width: '100%',
    gap: Spacing.Tiny4,
  },
  ctaContainer: {
    paddingBottom: Spacing.Small12,
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
    paddingTop: Spacing.Smallest8,
    paddingHorizontal: Spacing.Smallest8,
    justifyContent: 'flex-end',
  },
  iconLessRow: {
    paddingLeft: Spacing.Large32,
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
    alignItems: 'flex-start',
  },
  ctaLabel: {
    ...fontStyles.small600,
    paddingHorizontal: Spacing.Smallest8,
    paddingVertical: Spacing.Tiny4,
  },
})

const severityStyles: Record<Severity, CustomStyles> = {
  [Severity.Informational]: {
    primary: Colors.informationDark,
    secondary: Colors.informationLight,
  },
  [Severity.Warning]: {
    primary: Colors.warningDark,
    secondary: Colors.warningLight,
  },
  [Severity.Error]: {
    primary: Colors.errorDark,
    secondary: Colors.errorLight,
  },
}

export default InLineNotification
