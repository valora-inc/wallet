import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import { TransactionDetailsEvents } from 'src/analytics/Events'
import AppAnalytics from 'src/analytics/AppAnalytics'
import Touchable from 'src/components/Touchable'
import OpenLinkIcon from 'src/icons/OpenLinkIcon'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { TokenTransactionTypeV2, TransactionStatus } from 'src/transactions/types'

interface Props {
  status: TransactionStatus
  type: TokenTransactionTypeV2
  onPress: () => void
  testID?: string
}

function TransactionPrimaryAction({ status, type, onPress, testID }: Props) {
  const { t } = useTranslation()

  const title = {
    [TransactionStatus.Complete]: t('transactionDetailsActions.showCompletedTransactionDetails'),
    [TransactionStatus.Pending]: t('transactionDetailsActions.checkPendingTransactionStatus'),
    [TransactionStatus.Failed]: t('transactionDetailsActions.retryFailedTransaction'),
  }[status]

  const [color, backgroundColor] = {
    [TransactionStatus.Complete]: [Colors.successDark, Colors.successLight],
    [TransactionStatus.Pending]: [Colors.warningDark, Colors.warningLight],
    [TransactionStatus.Failed]: [Colors.errorDark, Colors.errorLight],
  }[status]

  const icon = {
    [TransactionStatus.Complete]: <OpenLinkIcon color={color} />,
    [TransactionStatus.Pending]: <OpenLinkIcon color={color} />,
    [TransactionStatus.Failed]: null,
  }[status]

  const analyticsEvent = {
    [TransactionStatus.Complete]: TransactionDetailsEvents.transaction_details_tap_check_status,
    [TransactionStatus.Pending]: TransactionDetailsEvents.transaction_details_tap_details,
    [TransactionStatus.Failed]: TransactionDetailsEvents.transaction_details_tap_retry,
  }[status]

  const pressHandler = () => {
    AppAnalytics.track(analyticsEvent, {
      transactionType: type,
      transactionStatus: status,
    })
    onPress()
  }

  return (
    <Touchable
      style={[styles.container, { backgroundColor }]}
      onPress={pressHandler}
      testID={testID}
    >
      <>
        <Text style={[styles.text, { color }]}>{title}</Text>
        {icon}
      </>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.Smallest8,
    borderRadius: 100,
    gap: 6,
  },
  text: {
    ...typeScale.labelXSmall,
  },
})

export default TransactionPrimaryAction
