import BigNumber from 'bignumber.js'
import React, { useMemo, type ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import BackButton from 'src/components/BackButton'
import ContactCircle from 'src/components/ContactCircle'
import CustomHeader from 'src/components/header/CustomHeader'
import SkeletonPlaceholder from 'src/components/SkeletonPlaceholder'
import { formatValueToDisplay } from 'src/components/TokenDisplay'
import WalletIcon from 'src/icons/navigator/Wallet'
import PhoneIcon from 'src/icons/Phone'
import UserIcon from 'src/icons/User'
import { LocalCurrencySymbol } from 'src/localCurrency/consts'
import { type Recipient } from 'src/recipients/recipient'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import { TokenBalance } from 'src/tokens/slice'
import Logger from 'src/utils/Logger'

export function ReviewTransaction(props: {
  title: string
  children: ReactNode
  headerLeftButton?: ReactNode
  testID?: string
}) {
  const insets = useSafeAreaInsets()

  return (
    <SafeAreaView style={styles.safeAreaView} edges={['top']} testID={props.testID}>
      <CustomHeader
        style={styles.header}
        left={props.headerLeftButton ?? <BackButton />}
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
  label: string
  icon: ReactNode
  primaryValue: string
  secondaryValue?: string
  testID?: string
}) {
  return (
    <View style={styles.reviewSummaryItem} testID={props.testID}>
      <Text style={styles.reviewSummaryItemLabel} testID={`${props.testID}/Label`}>
        {props.label}
      </Text>
      <View style={styles.reviewSummaryItemContent}>
        {props.icon}
        <View style={styles.reviewSummaryItemValuesWrapper}>
          <Text
            style={styles.reviewSummaryItemPrimaryValue}
            testID={`${props.testID}/PrimaryValue`}
          >
            {props.primaryValue}
          </Text>
          {!!props.secondaryValue && (
            <Text
              style={styles.reviewSummaryItemSecondaryValue}
              testID={`${props.testID}/SecondaryValue`}
            >
              {props.secondaryValue}
            </Text>
          )}
        </View>
      </View>
    </View>
  )
}

export function ReviewSummaryItemContact({
  testID,
  recipient,
}: {
  testID?: string
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
  }, [recipient])

  // This should never happen
  if (!contact) {
    Logger.error(
      'ReviewSummaryItemContact',
      `Transaction review could not render a contact item for recipient`
    )
    return null
  }

  return (
    <ReviewSummaryItem
      testID={testID}
      label={t('to')}
      primaryValue={contact.title}
      secondaryValue={contact.subtitle}
      icon={
        <ContactCircle
          size={32}
          backgroundColor={Colors.backgroundTertiary}
          foregroundColor={Colors.contentPrimary}
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
            <SkeletonPlaceholder>
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

export function ReviewTotalValue({
  tokenInfo,
  feeTokenInfo,
  tokenAmount,
  localAmount,
  feeTokenAmount,
  feeLocalAmount,
  localCurrencySymbol,
}: {
  tokenInfo: TokenBalance | undefined
  feeTokenInfo: TokenBalance | undefined
  tokenAmount: BigNumber | null
  localAmount: BigNumber | null
  feeTokenAmount: BigNumber | undefined
  feeLocalAmount: BigNumber | null
  localCurrencySymbol: LocalCurrencySymbol
}) {
  const { t } = useTranslation()

  // if there are not token info or token amount then it should not even be possible to get to the review screen
  if (!tokenInfo || !tokenAmount) {
    return null
  }

  // if there are no fees then just format token amount
  if (!feeTokenInfo || !feeTokenAmount) {
    if (localAmount) {
      return (
        <Trans
          i18nKey={'tokenAndLocalAmountApprox'}
          tOptions={{
            tokenAmount: formatValueToDisplay(tokenAmount),
            localAmount: formatValueToDisplay(localAmount),
            tokenSymbol: tokenInfo.symbol,
            localCurrencySymbol,
          }}
        >
          <Text style={styles.totalPlusFeesLocalAmount} />
        </Trans>
      )
    }

    return t('tokenAmountApprox', {
      tokenAmount: formatValueToDisplay(tokenAmount),
      tokenSymbol: tokenInfo.symbol,
    })
  }

  const sameToken = tokenInfo.tokenId === feeTokenInfo.tokenId
  const haveLocalPrice = !!localAmount && !!feeLocalAmount

  // if single token and have local price - return token and local amounts
  if (sameToken && haveLocalPrice) {
    return (
      <Trans
        i18nKey={'tokenAndLocalAmountApprox'}
        tOptions={{
          tokenAmount: formatValueToDisplay(tokenAmount.plus(feeTokenAmount)),
          localAmount: formatValueToDisplay(localAmount.plus(feeLocalAmount)),
          tokenSymbol: tokenInfo.symbol,
          localCurrencySymbol,
        }}
      >
        <Text style={styles.totalPlusFeesLocalAmount} />
      </Trans>
    )
  }

  // if single token but no local price - return token amount
  if (sameToken && !haveLocalPrice) {
    return t('tokenAmountApprox', {
      tokenAmount: formatValueToDisplay(tokenAmount.plus(feeTokenAmount)),
      tokenSymbol: tokenInfo.symbol,
    })
  }

  // if multiple tokens and have local price - return local amount
  if (!sameToken && haveLocalPrice) {
    return t('localAmountApprox', {
      localAmount: formatValueToDisplay(localAmount.plus(feeLocalAmount)),
      localCurrencySymbol,
    })
  }

  // otherwise there are multiple tokens with no local prices so return multiple token amounts
  return t('reviewTransaction.multipleTokensWithPlusSign', {
    amount1: formatValueToDisplay(tokenAmount),
    symbol1: tokenInfo.symbol,
    amount2: formatValueToDisplay(feeTokenAmount),
    symbol2: feeTokenInfo.symbol,
  })
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
    borderColor: Colors.borderPrimary,
    borderRadius: Spacing.Small12,
    backgroundColor: Colors.backgroundSecondary,
    padding: Spacing.Regular16,
    gap: Spacing.Regular16,
    flexShrink: 1,
  },
  reviewSummaryItem: {
    gap: Spacing.Tiny4,
  },
  reviewSummaryItemLabel: {
    ...typeScale.labelSmall,
    color: Colors.contentSecondary,
  },
  reviewSummaryItemContent: {
    flexDirection: 'row',
    gap: Spacing.Smallest8,
    alignItems: 'center',
  },
  reviewSummaryItemValuesWrapper: {
    flexShrink: 1,
  },
  reviewSummaryItemPrimaryValue: {
    ...typeScale.labelSemiBoldLarge,
  },
  reviewSummaryItemSecondaryValue: {
    ...typeScale.bodySmall,
    color: Colors.contentSecondary,
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
    gap: Spacing.Tiny4,
  },
  reviewDetailsItemText: {
    ...typeScale.bodyMedium,
    color: Colors.contentSecondary,
  },
  reviewDetailsItemTextBold: {
    ...typeScale.labelSemiBoldMedium,
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
  totalPlusFeesLocalAmount: {
    color: Colors.contentSecondary,
  },
})
