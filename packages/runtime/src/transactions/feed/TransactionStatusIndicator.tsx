import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import AttentionIcon from 'src/icons/Attention'
import Checkmark from 'src/icons/Checkmark'
import CircledIcon from 'src/icons/CircledIcon'
import ClockIcon from 'src/icons/ClockIcon'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { TransactionStatus } from 'src/transactions/types'

interface Props {
  status: TransactionStatus
  testID?: string
}

function TransactionStatusIndicator({ status, testID }: Props) {
  const { t } = useTranslation()

  const title = {
    [TransactionStatus.Complete]: t('transactionStatus.transactionIsCompleted'),
    [TransactionStatus.Pending]: t('transactionStatus.transactionIsPending'),
    [TransactionStatus.Failed]: t('transactionStatus.transactionIsFailed'),
  }[status]

  const [color, backgroundColor] = {
    [TransactionStatus.Complete]: [Colors.successDark, Colors.successLight],
    [TransactionStatus.Pending]: [Colors.warningDark, Colors.warningLight],
    [TransactionStatus.Failed]: [Colors.errorDark, Colors.errorLight],
  }[status]

  const icon = {
    [TransactionStatus.Complete]: <Checkmark color={color} width={16} height={16} />,
    [TransactionStatus.Pending]: <ClockIcon color={color} width={16} height={16} />,
    [TransactionStatus.Failed]: <AttentionIcon color={color} size={16} />,
  }[status]

  return (
    <View style={styles.container} testID={testID}>
      <CircledIcon backgroundColor={backgroundColor} radius={20}>
        {icon}
      </CircledIcon>
      <Text style={[styles.text, { color }]}>{title}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.Smallest8,
    borderRadius: 100,
    gap: 4,
  },
  text: {
    ...typeScale.labelXSmall,
  },
})

export default TransactionStatusIndicator
