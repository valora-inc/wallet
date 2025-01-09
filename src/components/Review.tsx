import React, { useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import SkeletonPlaceholder from 'react-native-skeleton-placeholder'
import BackButton from 'src/components/BackButton'
import ContactCircle from 'src/components/ContactCircle'
import CustomHeader from 'src/components/header/CustomHeader'
import WalletIcon from 'src/icons/navigator/Wallet'
import PhoneIcon from 'src/icons/Phone'
import UserIcon from 'src/icons/User'
import { type Recipient } from 'src/recipients/recipient'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'

export function Review(props: {
  title: string
  children: ReactNode
  headerAction?: ReactNode
  isModal?: boolean
}) {
  const insets = useSafeAreaInsets()

  return (
    <SafeAreaView style={styles.safeAreaView} edges={props.isModal ? ['top', 'bottom'] : ['top']}>
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
        <View style={{ flexShrink: 1 }}>
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
  header,
  recipient,
}: {
  header: string
  recipient: Recipient
}) {
  const { t } = useTranslation()

  const contact = useMemo(() => {
    const phone = recipient.displayNumber || recipient.e164PhoneNumber
    if (recipient.name) {
      return { title: recipient.name, subtitle: phone, icon: UserIcon }
    }

    if (phone) {
      return { title: phone, icon: PhoneIcon }
    }

    if (recipient.address) {
      return { title: recipient.address, icon: WalletIcon }
    }

    return { title: t('unknown'), icon: UserIcon }
  }, [recipient])

  return (
    <ReviewSummaryItem
      header={header}
      title={contact.title}
      subtitle={contact.subtitle}
      icon={
        <ContactCircle
          size={32}
          backgroundColor={Colors.gray2}
          foregroundColor={Colors.black}
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
  isLoading,
  testID,
}: {
  label: ReactNode
  value: ReactNode
  variant?: 'default' | 'bold'
  isLoading?: boolean
  testID?: string
}) {
  const textStyle =
    variant === 'bold' ? styles.reviewDetailsItemTextBold : styles.reviewDetailsItemText

  return (
    <View style={styles.reviewDetailsItem} testID={testID}>
      <View style={styles.reviewDetailsItemLabel}>
        <Text style={textStyle} testID={`${testID}/Label`}>
          {label}
        </Text>
        {/* TODO Add <InfoIcon /> for Earn Deposit/Withdrawal */}
      </View>
      <View>
        {isLoading ? (
          <View testID={`${testID}/Loader`} style={styles.loaderContainer}>
            <SkeletonPlaceholder
              borderRadius={100}
              backgroundColor={Colors.gray2}
              highlightColor={Colors.white}
            >
              <View style={styles.loader} />
            </SkeletonPlaceholder>
          </View>
        ) : (
          <Text style={textStyle} testID={`${testID}/Value`}>
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
    borderColor: Colors.gray2,
    borderRadius: Spacing.Small12,
    backgroundColor: Colors.gray1,
    padding: Spacing.Regular16,
    gap: Spacing.Regular16,
    flexShrink: 1,
  },
  reviewSummaryItem: {
    gap: 4,
  },
  reviewSummaryItemHeader: {
    ...typeScale.labelSmall,
    color: Colors.gray3,
  },
  reviewSummaryItemContent: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  reviewSummaryItemTitle: {
    ...typeScale.labelSemiBoldLarge,
    color: Colors.black,
  },
  reviewSummaryItemSubtitle: {
    ...typeScale.bodySmall,
    color: Colors.gray3,
  },
  reviewDetails: {
    gap: Spacing.Regular16,
    width: '100%',
  },
  reviewDetailsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.Smallest8,
  },
  reviewDetailsItemLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reviewDetailsItemText: {
    ...typeScale.bodyMedium,
    color: Colors.gray3,
  },
  reviewDetailsItemTextBold: {
    ...typeScale.labelSemiBoldMedium,
    color: Colors.black,
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
