import React from 'react'
import { GestureResponderEvent, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native'
import AttentionIcon from 'src/icons/Attention'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
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
      <View style={defaultStyles.row}>
        <View style={defaultStyles.attentionIcon}>
          <AttentionIcon color={severityStyle.primary} />
        </View>
        <View style={defaultStyles.contentContainer}>
          {title && <Text style={defaultStyles.titleText}>{title}</Text>}
          <Text style={[defaultStyles.bodyText]}>{description}</Text>
        </View>
      </View>

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
    padding: Spacing.Regular16,
    borderRadius: Spacing.Regular16,
    width: '100%',
  },
  contentContainer: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
  },
  ctaRow: {
    paddingTop: Spacing.Smallest8,
    paddingHorizontal: Spacing.Smallest8,
    justifyContent: 'flex-end',
  },
  attentionIcon: {
    paddingTop: Spacing.Tiny4,
    paddingRight: Spacing.Smallest8,
  },
  titleText: {
    ...typeScale.labelSmall,
    marginBottom: Spacing.Tiny4,
  },
  bodyText: {
    ...typeScale.bodyXSmall,
    lineHeight: 18,
    color: Colors.dark,
  },
  ctaLabel: {
    ...typeScale.labelSmall,
    fontWeight: '600',
    paddingHorizontal: Spacing.Smallest8,
    paddingVertical: Spacing.Tiny4,
  },
})

const severityStyles: Record<Severity, CustomStyles> = {
  [Severity.Informational]: {
    primary: Colors.infoDark,
    secondary: Colors.infoLight,
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
