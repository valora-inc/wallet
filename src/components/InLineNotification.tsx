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
  SoftInformational,
}

interface Props {
  severity: Severity
  title?: string | null
  description?: string | JSX.Element | null
  style?: StyleProp<ViewStyle>
  ctaLabel?: string | null
  onPressCta?: (event: GestureResponderEvent) => void
  ctaLabel2?: string | null
  onPressCta2?: (event: GestureResponderEvent) => void
  testID?: string
}

interface CustomColors {
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
  const severityColor = severityColors[severity]
  const renderCtaLabel = (
    label?: string | null,
    onPress?: (event: GestureResponderEvent) => void,
    color?: Colors
  ) =>
    label &&
    onPress && (
      <Text style={[styles.ctaLabel, { color }]} onPress={onPress}>
        {label}
      </Text>
    )

  return (
    <View
      style={[styles.container, { backgroundColor: severityColor.secondary }, style]}
      testID={testID}
    >
      <View style={styles.row}>
        <View style={styles.attentionIcon}>
          <AttentionIcon color={severityColor.primary} />
        </View>
        <View style={styles.contentContainer}>
          {title && <Text style={styles.titleText}>{title}</Text>}
          {<Text style={[styles.bodyText]}>{description}</Text>}
        </View>
      </View>

      {(ctaLabel || ctaLabel2) && (
        <View style={[styles.row, styles.ctaRow]}>
          {renderCtaLabel(ctaLabel, onPressCta, severityColor.primary)}
          {renderCtaLabel(ctaLabel2, onPressCta2, severityColor.primary)}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.Regular16,
    borderRadius: Spacing.Regular16,
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
    color: Colors.black,
  },
  ctaLabel: {
    ...typeScale.labelSmall,
    fontWeight: '600',
    paddingHorizontal: Spacing.Smallest8,
    paddingVertical: Spacing.Tiny4,
  },
})

const severityColors: Record<Severity, CustomColors> = {
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
  [Severity.SoftInformational]: {
    primary: Colors.black,
    secondary: Colors.gray1,
  },
}

export default InLineNotification
