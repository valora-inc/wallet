import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import Touchable from 'src/components/Touchable'
import OpenLinkIcon from 'src/icons/OpenLinkIcon'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { TransactionStatus } from 'src/transactions/types'

interface Props {
  status: TransactionStatus
  onPress?: () => void
  testID?: string
}

function TransactionPrimaryAction({ status, onPress, testID }: Props) {
  const { t } = useTranslation()

  const titleByStatus: Record<TransactionStatus, string> = {
    [TransactionStatus.Complete]: t('transactionDetailsActions.showCompletedTransactionDetails'),
    [TransactionStatus.Pending]: t('transactionDetailsActions.checkPendingTransactionStatus'),
    [TransactionStatus.Failed]: t('transactionDetailsActions.retryFailedTransaction'),
  }
  const title = titleByStatus[status]

  const colorsByStatus: Record<TransactionStatus, [colors, colors]> = {
    [TransactionStatus.Complete]: [colors.successDark, colors.successLight],
    [TransactionStatus.Pending]: [colors.warningDark, colors.warningLight],
    [TransactionStatus.Failed]: [colors.errorDark, colors.errorLight],
  }
  const [color, backgroundColor] = colorsByStatus[status]

  const iconByStatus: Record<TransactionStatus, React.ReactNode> = {
    [TransactionStatus.Complete]: <OpenLinkIcon color={color} />,
    [TransactionStatus.Pending]: <OpenLinkIcon color={color} />,
    [TransactionStatus.Failed]: null,
  }
  const icon = iconByStatus[status]

  return (
    <Touchable style={[styles.container, { backgroundColor }]} onPress={onPress} testID={testID}>
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
