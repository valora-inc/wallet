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
  onPress: () => void
  testID?: string
}

function TransactionDetailsPill({ status, onPress, testID }: Props) {
  const { t } = useTranslation()

  const presentationByStatus: Record<TransactionStatus, [string, colors, colors]> = {
    [TransactionStatus.Complete]: [t('Details'), colors.successDark, colors.successLight],
    [TransactionStatus.Pending]: [t('CheckStatus'), colors.warningDark, colors.warningLight],
    [TransactionStatus.Failed]: [t('Retry'), colors.errorDark, colors.errorLight],
  }

  const [title, color, backgroundColor] = presentationByStatus[status]
  const icon = status !== TransactionStatus.Failed ? <OpenLinkIcon color={color} /> : null

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
    gap: 2,
  },
  text: {
    ...typeScale.bodyXSmall,
  },
})

export default TransactionDetailsPill
