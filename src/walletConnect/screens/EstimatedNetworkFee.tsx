import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import SkeletonPlaceholder from 'src/components/SkeletonPlaceholder'
import TokenDisplay from 'src/components/TokenDisplay'
import { useSelector } from 'src/redux/hooks'
import { NETWORK_NAMES } from 'src/shared/conts'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { tokensByIdSelector } from 'src/tokens/selectors'
import { TokenBalances } from 'src/tokens/slice'
import { NetworkId } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import {
  getEstimatedGasFee,
  getFeeCurrencyToken,
  getFeeDecimals,
} from 'src/viem/prepareTransactions'
import {
  SerializableTransactionRequest,
  getPreparedTransaction,
} from 'src/viem/preparedTransactionSerialization'

const TAG = 'WalletConnect/EstimatedNetworkFee'

interface Props {
  isLoading: boolean
  networkId: NetworkId
  transactions: SerializableTransactionRequest[]
}

function getNetworkFee(
  transactions: SerializableTransactionRequest[],
  networkId: NetworkId,
  tokensById: TokenBalances
) {
  try {
    const preparedTransactions = transactions.map(getPreparedTransaction)
    const feeCurrency = getFeeCurrencyToken(preparedTransactions, networkId, tokensById)
    if (!feeCurrency) {
      Logger.warn(TAG, 'No fee token info found', { transactions, networkId })
      return null
    }

    const feeDecimals = getFeeDecimals(preparedTransactions, feeCurrency)
    return {
      token: feeCurrency,
      amount: getEstimatedGasFee(preparedTransactions).shiftedBy(-feeDecimals),
    }
  } catch (error) {
    Logger.warn(TAG, 'Failed to get estimated gas fee', error)
    return null
  }
}

export default function EstimatedNetworkFee({ isLoading, networkId, transactions }: Props) {
  const { t } = useTranslation()

  const tokensById = useSelector((state) => tokensByIdSelector(state, [networkId]))
  const networkFee = getNetworkFee(transactions, networkId, tokensById)

  const networkName = NETWORK_NAMES[networkId]

  if (!networkFee || !networkName) {
    Logger.warn(TAG, 'Insufficient information to display fee details', {
      networkName,
      transactions,
    })
    return null
  }

  return (
    <View style={styles.container} testID="EstimatedNetworkFee">
      <Text style={styles.labelText}>
        {t('walletConnectRequest.estimatedNetworkFee', { networkName })}
      </Text>
      <View>
        <View style={isLoading ? styles.contentLoading : undefined}>
          <TokenDisplay
            style={styles.amountPrimaryText}
            amount={networkFee.amount}
            tokenId={networkFee.token.tokenId}
            showLocalAmount={false}
            showSymbol={true}
            hideSign={true}
            testID="EstimatedNetworkFee/Amount"
          />
          <TokenDisplay
            style={styles.amountSecondaryText}
            amount={networkFee.amount}
            tokenId={networkFee.token.tokenId}
            showLocalAmount={true}
            showSymbol={true}
            hideSign={true}
            testID="EstimatedNetworkFee/AmountLocal"
          />
        </View>
        {!!isLoading && (
          <View style={StyleSheet.absoluteFill}>
            <SkeletonPlaceholder
              borderRadius={100} // ensure rounded corners with font scaling
              backgroundColor={Colors.gray2}
              highlightColor={Colors.white}
              testID="EstimatedNetworkFee/Loading"
            >
              <View style={styles.loader} />
            </SkeletonPlaceholder>
          </View>
        )}
      </View>
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
  contentLoading: {
    opacity: 0,
  },
  loader: {
    height: '100%',
    width: 100,
  },
})
