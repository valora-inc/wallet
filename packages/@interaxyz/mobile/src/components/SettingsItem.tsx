import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import ListItem from 'src/components/ListItem'
import Switch from 'src/components/Switch'
import ForwardChevron from 'src/icons/ForwardChevron'
import OpenLinkIcon from 'src/icons/OpenLinkIcon'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

interface WrapperProps {
  testID?: string
  onPress?: () => void
  children: React.ReactNode
  borderless?: boolean
}

function Wrapper({ testID, onPress, borderless, children }: WrapperProps) {
  return (
    <ListItem testID={testID} onPress={onPress} borderless={borderless}>
      {children}
    </ListItem>
  )
}

function Title({ value }: { value: string }) {
  return <View style={[styles.left]}>{<Text style={styles.title}>{value}</Text>}</View>
}

type BaseProps = {
  title: string
  icon?: React.ReactNode
} & Omit<WrapperProps, 'children'>

type SettingsItemTextValueProps = {
  value?: string | null
  showChevron?: boolean
  isValueActionable?: boolean
  isExternalLink?: boolean
} & BaseProps

export function SettingsItemTextValue({
  testID,
  title,
  value,
  showChevron,
  onPress,
  isValueActionable,
  icon,
  borderless,
  isExternalLink,
}: SettingsItemTextValueProps) {
  return (
    <Wrapper borderless={borderless} testID={testID} onPress={onPress}>
      <View style={styles.container}>
        {!!icon && <View style={styles.iconContainer}>{icon}</View>}
        <Title value={title} />
        <View style={styles.right}>
          {!!value && (
            <Text
              testID={testID ? `${testID}/value` : `${title}/value`}
              style={isValueActionable ? styles.valueActionable : styles.value}
            >
              {value}
            </Text>
          )}
          {(!!value || showChevron) && (
            <ForwardChevron
              height={12}
              color={isValueActionable ? colors.accent : colors.contentSecondary}
            />
          )}
          {isExternalLink && <OpenLinkIcon size={16} color={colors.contentPrimary} />}
        </View>
      </View>
    </Wrapper>
  )
}

type SettingsItemSwitchProps = {
  value: boolean
  onValueChange: (value: boolean) => void
  details?: string | null
} & Omit<BaseProps, 'onPress'>

export function SettingsItemSwitch({
  testID,
  title,
  onValueChange,
  value,
  details,
}: SettingsItemSwitchProps) {
  return (
    <Wrapper>
      <View style={styles.container}>
        <Title value={title} />
        <Switch testID={testID} value={value} onValueChange={onValueChange} />
      </View>
      {!!details && (
        <View>
          <Text style={styles.details}>{details}</Text>
        </View>
      )}
    </Wrapper>
  )
}

type SettingsExpandedItemProps = {
  details?: string | null
} & BaseProps

export function SettingsExpandedItem({
  testID,
  title,
  details,
  onPress,
  borderless,
  icon,
}: SettingsExpandedItemProps) {
  return (
    <Wrapper testID={testID} onPress={onPress} borderless={borderless}>
      <View style={styles.container}>
        {!!icon && <View style={styles.iconContainer}>{icon}</View>}
        <Title value={title} />
      </View>
      {!!details && (
        <View>
          <Text style={styles.details}>{details}</Text>
        </View>
      )}
    </Wrapper>
  )
}

type SettingsItemCtaProps = {
  cta: JSX.Element
  showChevron?: boolean
} & BaseProps

export function SettingsItemCta({
  testID,
  showChevron,
  title,
  cta,
  onPress,
}: SettingsItemCtaProps) {
  return (
    <Wrapper testID={testID} onPress={onPress}>
      <View style={styles.container}>
        <Title value={title} />
        <View style={styles.right}>{cta}</View>
        {showChevron && <ForwardChevron height={12} color={colors.contentSecondary} />}
      </View>
    </Wrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    justifyContent: 'center',
    flex: 1,
  },
  title: {
    ...typeScale.bodyMedium,
  },
  value: {
    ...typeScale.bodyMedium,
    color: colors.contentSecondary,
    marginRight: 8,
  },
  valueActionable: {
    ...typeScale.bodyMedium,
    color: colors.accent,
    marginRight: 8,
  },
  details: {
    ...typeScale.bodySmall,
    color: colors.contentSecondary,
    paddingTop: 16,
    paddingRight: 16,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    paddingRight: Spacing.Smallest8,
  },
})
