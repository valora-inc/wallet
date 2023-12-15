import BigNumber from 'bignumber.js'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import TokenDisplay from 'src/components/TokenDisplay'
import { NETWORK_NAMES } from 'src/shared/conts'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { useTokenInfo } from 'src/tokens/hooks'
import { getTokenId } from 'src/tokens/utils'
import { NetworkId } from 'src/transactions/types'
import { SerializableTransactionRequest } from 'src/viem/preparedTransactionSerialization'

interface Props {
  networkId: NetworkId
  transaction: SerializableTransactionRequest
}

export default function EstimatedNetworkFee({ networkId, transaction }: Props) {
  const { t } = useTranslation()

  const feeTokenId =
    'feeCurrency' in transaction
      ? getTokenId(networkId, transaction.feeCurrency)
      : getTokenId(networkId)

  const feeTokenInfo = useTokenInfo(feeTokenId)

  const networkName = NETWORK_NAMES[networkId]

  if (!transaction.gas || !transaction.maxFeePerGas || !feeTokenInfo || !networkName) {
    // insufficient information to display fee details
    return null
  }

  // fee value in base units
  const feeValue = BigNumber(transaction.gas)
    .times(BigNumber(transaction.maxFeePerGas))
    .shiftedBy(-feeTokenInfo.decimals)

  return (
    <View style={styles.container} testID="EstimatedNetworkFee">
      <Text style={styles.labelText}>
        {t('walletConnectRequest.estimatedNetworkFee', { networkName })}
      </Text>
      <TokenDisplay
        style={styles.amountPrimaryText}
        amount={feeValue}
        tokenId={feeTokenId}
        showLocalAmount={false}
        showSymbol={true}
        hideSign={true}
      />
      <TokenDisplay
        style={styles.amountSecondaryText}
        amount={feeValue}
        tokenId={feeTokenId}
        showLocalAmount={true}
        showSymbol={true}
        hideSign={true}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.Thick24,
  },
  labelText: {
    ...typeScale.labelXSmall,
    color: Colors.gray4,
    marginBottom: Spacing.Tiny4,
  },
  amountPrimaryText: {
    ...typeScale.labelSemiBoldSmall,
    color: Colors.black,
  },
  amountSecondaryText: {
    ...typeScale.bodyXSmall,
    color: Colors.gray4,
  },
})
