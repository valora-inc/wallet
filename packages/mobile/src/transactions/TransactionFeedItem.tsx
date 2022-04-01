import BigNumber from 'bignumber.js'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { MoneyAmount, TokenTransactionType } from 'src/apollo/types'
import CurrencyDisplay, { FormatType } from 'src/components/CurrencyDisplay'
import Touchable from 'src/components/Touchable'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { TransactionStatus } from 'src/transactions/types'
import { Currency } from 'src/utils/currencies'

interface Props {
  type: TokenTransactionType
  amount: MoneyAmount
  title: string
  info: React.ReactNode | string | null | undefined
  icon: React.ReactNode
  timestamp: number
  status: TransactionStatus
  onPress: () => void
}

export function TransactionFeedItem(props: Props) {
  const { t } = useTranslation()

  const { type, amount, title, info, icon, status, onPress } = props

  const isReceived = new BigNumber(amount.value).isPositive()
  const isPending = status === TransactionStatus.Pending

  const subtitle = isPending ? t('confirmingTransaction') : info
  const isCeloTx = amount.currencyCode === Currency.Celo

  return (
    <Touchable disabled={isPending} onPress={onPress}>
      <View style={styles.container}>
        <View style={styles.iconContainer}>{icon}</View>
        <View style={styles.contentContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
            <CurrencyDisplay
              amount={amount}
              formatType={
                type === TokenTransactionType.NetworkFee ? FormatType.NetworkFee : undefined
              }
              hideSign={false}
              showExplicitPositiveSign={true}
              hideFullCurrencyName={!isCeloTx}
              style={[styles.amount, isReceived && styles.amountReceived]}
              testID={'FeedItemAmountDisplay'}
            />
          </View>
          {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: variables.contentPadding,
  },
  iconContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    marginLeft: variables.contentPadding,
  },
  titleContainer: {
    flexDirection: 'row',
    marginTop: -1,
  },
  title: {
    ...fontStyles.regular500,
    flexShrink: 1,
  },
  subtitle: {
    ...fontStyles.small,
    color: colors.gray4,
    paddingTop: 2,
  },
  amount: {
    ...fontStyles.regular500,
    marginLeft: 'auto',
    paddingLeft: 10,
    width: '40%',
    textAlign: 'right',
    flexWrap: 'wrap',
  },
  amountReceived: {
    color: colors.greenUI,
  },
})

export default TransactionFeedItem
