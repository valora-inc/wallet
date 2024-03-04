import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import TokenDisplay from 'src/components/TokenDisplay'
import useSelector from 'src/redux/useSelector'
import { NETWORK_NAMES } from 'src/shared/conts'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { tokensByIdSelector } from 'src/tokens/selectors'
import { NetworkId } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { getFeeCurrencyToken, getFeeDecimals, getMaxGasFee } from 'src/viem/prepareTransactions'
import {
  SerializableTransactionRequest,
  getPreparedTransaction,
} from 'src/viem/preparedTransactionSerialization'

interface Props {
  networkId: NetworkId
  transaction: SerializableTransactionRequest
}

export default function EstimatedNetworkFee({ networkId, transaction }: Props) {
  const { t } = useTranslation()

  const tokensById = useSelector((state) => tokensByIdSelector(state, [networkId]))
  const preparedTransaction = getPreparedTransaction(transaction)
  const feeTokenInfo = getFeeCurrencyToken([preparedTransaction], networkId, tokensById)

  const networkName = NETWORK_NAMES[networkId]

  if (!transaction.gas || !transaction.maxFeePerGas || !feeTokenInfo || !networkName) {
    Logger.warn('WalletConnect', 'Insufficient information to display fee details', {
      networkName,
      transaction,
      feeTokenInfo,
    })
    return null
  }

  const feeDecimals = getFeeDecimals([preparedTransaction], feeTokenInfo)
  // in base units
  const maxFeeAmount = getMaxGasFee([preparedTransaction]).shiftedBy(-feeDecimals)

  return (
    <View style={styles.container} testID="EstimatedNetworkFee">
      <Text style={styles.labelText}>
        {t('walletConnectRequest.estimatedNetworkFee', { networkName })}
      </Text>
      <TokenDisplay
        style={styles.amountPrimaryText}
        amount={maxFeeAmount}
        tokenId={feeTokenInfo.tokenId}
        showLocalAmount={false}
        showSymbol={true}
        hideSign={true}
      />
      <TokenDisplay
        style={styles.amountSecondaryText}
        amount={maxFeeAmount}
        tokenId={feeTokenInfo.tokenId}
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
