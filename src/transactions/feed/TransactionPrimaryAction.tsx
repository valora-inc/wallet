import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import { TransactionDetailsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Touchable from 'src/components/Touchable'
import OpenLinkIcon from 'src/icons/OpenLinkIcon'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { TransactionStatus } from 'src/transactions/types'

interface Props {
  status: TransactionStatus
  onPress: () => void
  testID?: string
}

function TransactionPrimaryAction({ status, onPress, testID }: Props) {
  const { t } = useTranslation()

  const title = {
    [TransactionStatus.Complete]: t('transactionDetailsActions.showCompletedTransactionDetails'),
    [TransactionStatus.Pending]: t('transactionDetailsActions.checkPendingTransactionStatus'),
    [TransactionStatus.Failed]: t('transactionDetailsActions.retryFailedTransaction'),
  }[status]

  const [color, backgroundColor] = {
    [TransactionStatus.Complete]: [colors.successDark, colors.successLight],
    [TransactionStatus.Pending]: [colors.warningDark, colors.warningLight],
    [TransactionStatus.Failed]: [colors.errorDark, colors.errorLight],
  }[status]

  const icon = {
    [TransactionStatus.Complete]: <OpenLinkIcon color={color} />,
    [TransactionStatus.Pending]: <OpenLinkIcon color={color} />,
    [TransactionStatus.Failed]: null,
  }[status]

  const analyticsEvent = {
    [TransactionStatus.Complete]: TransactionDetailsEvents.transaction_details_tap_check_status,
    [TransactionStatus.Pending]: TransactionDetailsEvents.transaction_details_tap_details,
    [TransactionStatus.Failed]: TransactionDetailsEvents.transaction_details_tap_rety,
  }[status]

  const pressHandler = () => {
    ValoraAnalytics.track(analyticsEvent)
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
    ...typeScale.bodyXSmall,
  },
})

export default TransactionPrimaryAction
