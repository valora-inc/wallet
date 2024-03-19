import React from 'react'
import { GestureResponderEvent, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native'
import AttentionIcon from 'src/icons/Attention'
import Warning from 'src/icons/Warning'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

export enum NotificationVariant {
  Info,
  Success,
  Warning,
  Error,
}

export interface InLineNotificationProps {
  variant: NotificationVariant
  withBorder?: boolean
  hideIcon?: boolean
  customIcon?: JSX.Element | null
  title?: string | null
  description: string | JSX.Element | null
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
  variant,
  withBorder,
  hideIcon,
  customIcon,
  title,
  description,
  style,
  ctaLabel,
  onPressCta,
  ctaLabel2,
  onPressCta2,
  testID,
}: InLineNotificationProps) {
  const variantColor = variantColors[variant]
  const renderCtaLabel = (
    label?: string | null,
    onPress?: (event: GestureResponderEvent) => void,
    color?: Colors
  ) =>
    label &&
    onPress && (
      <Text testID={`${testID}/${label}`} style={[styles.ctaLabel, { color }]} onPress={onPress}>
        {label}
      </Text>
    )
  const Icon = variantIcons[variant]

  const backgroundStyle = { backgroundColor: variantColor.secondary }
  const borderStyle = withBorder && {
    borderWidth: 1,
    borderColor: `${variantColor.primary}80`, // primary color with 50% opacity
  }

  return (
    <View style={[styles.container, backgroundStyle, borderStyle, style]} testID={testID}>
      <View style={styles.row}>
        {!hideIcon && (
          <View style={styles.iconContainer}>
            {customIcon ?? (
              <Icon color={variantColor.primary} size={20} testId="InLineNotification/Icon" />
            )}
          </View>
        )}
        <View style={styles.contentContainer}>
          {title && <Text style={styles.titleText}>{title}</Text>}
          <Text style={[styles.bodyText]}>{description}</Text>
        </View>
      </View>

      {(ctaLabel || ctaLabel2) && (
        <View style={[styles.row, styles.ctaRow]}>
          {renderCtaLabel(ctaLabel, onPressCta, variantColor.primary)}
          {renderCtaLabel(ctaLabel2, onPressCta2, variantColor.primary)}
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
    justifyContent: 'flex-end',
    gap: Spacing.Smallest8,
  },
  iconContainer: {
    paddingTop: Spacing.Tiny4,
    paddingRight: Spacing.Smallest8,
  },
  titleText: {
    ...typeScale.labelSmall,
    marginBottom: Spacing.Tiny4,
  },
  bodyText: {
    ...typeScale.bodyXSmall,
    color: Colors.black,
  },
  ctaLabel: {
    ...typeScale.labelSmall,
    fontWeight: '600',
    paddingVertical: Spacing.Tiny4,
    paddingHorizontal: Spacing.Smallest8,
  },
})

const variantColors: Record<NotificationVariant, CustomColors> = {
  [NotificationVariant.Info]: {
    primary: Colors.black,
    secondary: Colors.gray1,
  },
  [NotificationVariant.Success]: {
    primary: Colors.successDark,
    secondary: Colors.successLight,
  },
  [NotificationVariant.Warning]: {
    primary: Colors.warningDark,
    secondary: Colors.warningLight,
  },
  [NotificationVariant.Error]: {
    primary: Colors.errorDark,
    secondary: Colors.errorLight,
  },
}

const variantIcons: Record<NotificationVariant, (args: any) => JSX.Element> = {
  [NotificationVariant.Info]: AttentionIcon,
  [NotificationVariant.Success]: AttentionIcon,
  [NotificationVariant.Warning]: Warning,
  [NotificationVariant.Error]: Warning,
}

export default InLineNotification
