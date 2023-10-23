import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import Checkmark from 'src/icons/Checkmark'
import CircledIcon from 'src/icons/CircledIcon'
import ClockIcon from 'src/icons/ClockIcon'
import ExclamationCircleIcon from 'src/icons/ExclamationCircleIcon'
import colors from 'src/styles/colors'
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
    [TransactionStatus.Complete]: [colors.successDark, colors.successLight],
    [TransactionStatus.Pending]: [colors.warningDark, colors.warningLight],
    [TransactionStatus.Failed]: [colors.errorDark, colors.errorLight],
  }[status]

  const icon = {
    [TransactionStatus.Complete]: <Checkmark color={color} width={10} height={10} />,
    [TransactionStatus.Pending]: <ClockIcon color={color} width={10} height={10} />,
    [TransactionStatus.Failed]: <ExclamationCircleIcon color={color} size={10} />,
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
    ...typeScale.bodyXSmall,
  },
})

export default TransactionStatusIndicator
