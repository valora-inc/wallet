// VIEW that's used on the CELO screen activity feed for CELO transfers (in or out).

import BigNumber from 'bignumber.js'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import { CeloExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { TransferItemFragment } from 'src/apollo/types'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import { formatShortenedAddress } from 'src/components/ShortenedAddress'
import Touchable from 'src/components/Touchable'
import { txHashToFeedInfoSelector } from 'src/fiatExchanges/reducer'
import { addressToDisplayNameSelector } from 'src/identity/selectors'
import { getRecipientFromAddress } from 'src/recipients/recipient'
import { recipientInfoSelector } from 'src/recipients/reducer'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { navigateToPaymentTransferReview } from 'src/transactions/actions'
import { TransactionStatus } from 'src/transactions/types'
import { getDatetimeDisplayString } from 'src/utils/time'

type Props = TransferItemFragment & {
  status?: TransactionStatus
}

export function CeloTransferFeedItem(props: Props) {
  const { t, i18n } = useTranslation()
  const addressToDisplayName = useSelector(addressToDisplayNameSelector)
  const txHashToFeedInfo = useSelector(txHashToFeedInfoSelector)
  const recipientInfo = useSelector(recipientInfoSelector)
  const {
    address,
    amount,
    hash,
    comment,
    status,
    timestamp,
    type,
    defaultName,
    defaultImage,
  } = props

  const recipient = getRecipientFromAddress(address, recipientInfo, defaultName, defaultImage)

  const onPress = () => {
    ValoraAnalytics.track(CeloExchangeEvents.celo_transaction_select)

    navigateToPaymentTransferReview(type, timestamp, {
      address,
      comment,
      amount,
      type,
      recipient,
      // fee TODO: add fee here.
    })
  }

  const dateTimeFormatted = getDatetimeDisplayString(timestamp, i18n)
  const isPending = status === TransactionStatus.Pending
  const isWithdrawal = new BigNumber(amount.value).isNegative()
  const displayName =
    txHashToFeedInfo[hash]?.name ||
    addressToDisplayName[address]?.name ||
    recipient.name ||
    formatShortenedAddress(address)

  return (
    <Touchable testID="CeloTransferFeedItem" disabled={isPending} onPress={onPress}>
      <View style={styles.container}>
        <View style={styles.firstRow}>
          <Text style={styles.txMode}>
            {t(isWithdrawal ? 'feedItemGoldWithdrawal' : 'feedItemGoldReceived', {
              displayName,
            })}
          </Text>
          <CurrencyDisplay amount={amount} style={styles.amount} showExplicitPositiveSign={true} />
        </View>
        <View style={styles.secondRow}>
          <Text style={styles.time}>{isPending ? t('confirmingExchange') : dateTimeFormatted}</Text>
        </View>
      </View>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    flex: 1,
    padding: variables.contentPadding,
  },
  firstRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 2,
    flexWrap: 'wrap',
  },
  txMode: {
    flex: 3,
    ...fontStyles.regular500,
    color: colors.dark,
  },
  amount: {
    flex: 1,
    textAlign: 'right',
    ...fontStyles.regular500,
    color: colors.dark,
  },
  time: {
    ...fontStyles.small,
    color: colors.gray4,
  },
  secondRow: {},
})

export default CeloTransferFeedItem
