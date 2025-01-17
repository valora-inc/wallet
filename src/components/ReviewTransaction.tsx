import React, { type ReactNode, useMemo } from 'react'
import { ScrollView, type StyleProp, StyleSheet, Text, type TextStyle, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import SkeletonPlaceholder from 'react-native-skeleton-placeholder'
import BackButton from 'src/components/BackButton'
import ContactCircle from 'src/components/ContactCircle'
import CustomHeader from 'src/components/header/CustomHeader'
import Touchable from 'src/components/Touchable'
import InfoIcon from 'src/icons/InfoIcon'
import WalletIcon from 'src/icons/navigator/Wallet'
import PhoneIcon from 'src/icons/Phone'
import UserIcon from 'src/icons/User'
import { type Recipient } from 'src/recipients/recipient'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import Logger from 'src/utils/Logger'

export function ReviewTransaction(props: {
  title: string
  children: ReactNode
  headerAction?: ReactNode
  testID?: string
}) {
  const insets = useSafeAreaInsets()

  return (
    <SafeAreaView style={styles.safeAreaView} edges={['top']} testID={props.testID}>
      <CustomHeader
        style={styles.header}
        left={props.headerAction ?? <BackButton />}
        title={props.title}
      />
      <ScrollView
        contentContainerStyle={{
          flex: 1,
          paddingBottom: Math.max(insets.bottom, Spacing.Thick24),
        }}
      >
        <View style={styles.reviewContainer}>{props.children}</View>
      </ScrollView>
    </SafeAreaView>
  )
}

export function ReviewContent(props: { children: ReactNode }) {
  return <View style={styles.reviewContent}>{props.children}</View>
}

export function ReviewSummary(props: { children: ReactNode }) {
  return <View style={styles.reviewSummary}>{props.children}</View>
}

export function ReviewSummaryItem(props: {
  header: string
  icon: ReactNode
  title: string
  subtitle?: string
  testID?: string
}) {
  return (
    <View style={styles.reviewSummaryItem} testID={props.testID}>
      <Text style={styles.reviewSummaryItemHeader} testID={`${props.testID}/Header`}>
        {props.header}
      </Text>
      <View style={styles.reviewSummaryItemContent}>
        {props.icon}
        <View style={styles.reviewSummaryItemTitlesWrapper}>
          <Text style={styles.reviewSummaryItemTitle} testID={`${props.testID}/Title`}>
            {props.title}
          </Text>
          {!!props.subtitle && (
            <Text style={styles.reviewSummaryItemSubtitle} testID={`${props.testID}/Subtitle`}>
              {props.subtitle}
            </Text>
          )}
        </View>
      </View>
    </View>
  )
}

export function ReviewSummaryItemContact({
  testID,
  header,
  recipient,
}: {
  testID?: string
  header: string
  recipient: Recipient
}) {
  const contact = useMemo(() => {
    const phone = recipient.displayNumber || recipient.e164PhoneNumber
    if (recipient.name) {
      return { title: recipient.name, subtitle: phone, icon: UserIcon, testID: 'Name' }
    }

    if (phone) {
      return { title: phone, icon: PhoneIcon, testID: 'Phone' }
    }

    if (recipient.address) {
      return { title: recipient.address, icon: WalletIcon, testID: 'Address' }
    }
  }, [recipient])

  // Should never happen
  if (!contact) {
    Logger.error(
      'ReviewSummaryItemContact',
      `Transaction review could not render a contact item for recipient header: ${header}`
    )
    return null
  }

  return (
    <ReviewSummaryItem
      testID={`${testID}/${contact.testID}`}
      header={header}
      title={contact.title}
      subtitle={contact.subtitle}
      icon={
        <ContactCircle
          size={32}
          backgroundColor={Colors.gray2}
          foregroundColor={Colors.backgroundInverse}
          recipient={recipient}
          DefaultIcon={contact.icon}
        />
      }
    />
  )
}

export function ReviewDetails(props: { children: ReactNode }) {
  return <View style={styles.reviewDetails}>{props.children}</View>
}

export function ReviewDetailsItem({
  label,
  value,
  variant = 'default',
  size = 'normal',
  color = Colors.textPrimary,
  isLoading,
  testID,
  onInfoPress,
}: {
  label: ReactNode
  value: ReactNode
  variant?: 'default' | 'bold'
  size?: 'small' | 'normal'
  color?: Colors
  isLoading?: boolean
  testID?: string
  onInfoPress?: () => void
}) {
  const textFont = useMemo((): StyleProp<TextStyle> => {
    if (size === 'small') {
      return variant === 'bold' ? typeScale.labelSemiBoldSmall : typeScale.bodySmall
    }
    return variant === 'bold' ? typeScale.labelSemiBoldMedium : typeScale.bodyMedium
  }, [variant, size])

  return (
    <View style={styles.reviewDetailsItem} testID={testID}>
      <Touchable
        style={styles.reviewDetailsItemLabel}
        onPress={onInfoPress}
        disabled={!onInfoPress || isLoading}
      >
        <>
          <Text style={[textFont, { color }]} testID={`${testID}/Label`}>
            {label}
          </Text>
          {onInfoPress && <InfoIcon testID={`${testID}/InfoIcon`} />}
        </>
      </Touchable>
      <View style={styles.reviewDetailsItemValue}>
        {isLoading ? (
          <View testID={`${testID}/Loader`} style={styles.loaderContainer}>
            <SkeletonPlaceholder
              borderRadius={100}
              backgroundColor={Colors.gray2}
              highlightColor={Colors.background}
            >
              <View style={styles.loader} />
            </SkeletonPlaceholder>
          </View>
        ) : (
          <Text
            style={[styles.reviewDetailsItemValueText, textFont, { color }]}
            testID={`${testID}/Value`}
          >
            {value}
          </Text>
        )}
      </View>
    </View>
  )
}

export function ReviewFooter(props: { children: ReactNode }) {
  return <View style={styles.reviewFooter}>{props.children}</View>
}

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: variables.contentPadding,
  },
  reviewContainer: {
    margin: Spacing.Regular16,
    gap: Spacing.Thick24,
    flex: 1,
    justifyContent: 'space-between',
  },
  reviewContent: {
    gap: Spacing.Thick24,
  },
  reviewSummary: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.Small12,
    backgroundColor: Colors.backgroundSecondary,
    padding: Spacing.Regular16,
    gap: Spacing.Regular16,
    flexShrink: 1,
  },
  reviewSummaryItem: {
    gap: Spacing.Tiny4,
  },
  reviewSummaryItemHeader: {
    ...typeScale.labelSmall,
    color: Colors.textSecondary,
  },
  reviewSummaryItemContent: {
    flexDirection: 'row',
    gap: Spacing.Smallest8,
    alignItems: 'center',
  },
  reviewSummaryItemTitlesWrapper: {
    flexShrink: 1,
  },
  reviewSummaryItemTitle: {
    ...typeScale.labelSemiBoldLarge,
  },
  reviewSummaryItemSubtitle: {
    ...typeScale.bodySmall,
    color: Colors.textSecondary,
  },
  reviewDetails: {
    gap: Spacing.Regular16,
    width: '100%',
  },
  reviewDetailsItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.Smallest8,
  },
  reviewDetailsItemLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.Tiny4,
  },
  reviewDetailsItemValue: {
    flexShrink: 1,
    alignItems: 'flex-end',
  },
  reviewDetailsItemValueText: {
    textAlign: 'right',
  },
  reviewFooter: {
    gap: Spacing.Regular16,
  },
  loaderContainer: {
    height: 20,
    width: 96,
  },
  loader: {
    height: '100%',
    width: '100%',
  },
})
