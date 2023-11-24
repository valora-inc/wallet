import BigNumber from 'bignumber.js'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import RowDivider from 'src/components/RowDivider'
import TokenDisplay, { formatValueToDisplay } from 'src/components/TokenDisplay'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { useTokensList } from 'src/tokens/hooks'
import { TokenExchange, TransactionStatus } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
export interface Props {
  exchange: TokenExchange
}

// Note that this is tested from TransactionDetailsScreen.test.tsx
export default function SwapContent({ exchange }: Props) {
  const { t } = useTranslation()
  const tokensList = useTokensList()

  const fromTokenSymbol = tokensList.find(
    (token) => token.tokenId === exchange.outAmount.tokenId
  )?.symbol
  const toTokenSymbol = tokensList.find(
    (token) => token.tokenId === exchange.inAmount.tokenId
  )?.symbol

  React.useEffect(() => {
    Logger.info('DIEGO - swap content', JSON.stringify(exchange.fees))
  }, [])

  return (
    <View style={styles.contentContainer}>
      <View style={[styles.row, { paddingBottom: Spacing.Smallest8 }]}>
        <Text style={styles.bodyText}>{t('swapTransactionDetailPage.swapTo')}</Text>
        <TokenDisplay
          style={styles.currencyAmountPrimaryText}
          amount={exchange.inAmount.value}
          tokenId={exchange.inAmount.tokenId}
          showLocalAmount={false}
          showSymbol={true}
          hideSign={true}
          testID="SwapContent/swapTo"
        />
      </View>
      <View style={[styles.row]}>
        <Text style={styles.bodyText}>{t('swapTransactionDetailPage.swapFrom')}</Text>
        <TokenDisplay
          style={styles.currencyAmountPrimaryText}
          amount={exchange.outAmount.value}
          tokenId={exchange.outAmount.tokenId}
          showLocalAmount={false}
          showSymbol={true}
          hideSign={true}
          testID="SwapContent/swapFrom"
        />
      </View>
      <RowDivider />
      <View style={[styles.row, { paddingBottom: Spacing.Smallest8 }]}>
        <Text style={styles.bodyText}>{t('swapTransactionDetailPage.rate')}</Text>
        <Text testID="SwapContent/rate" style={styles.currencyAmountPrimaryText}>
          {`1 ${fromTokenSymbol} ≈ ${formatValueToDisplay(
            new BigNumber(exchange.inAmount.value).dividedBy(exchange.outAmount.value)
          )} ${toTokenSymbol}`}
        </Text>
      </View>

      {exchange.fees[0] && (
        <>
          <View style={styles.row}>
            <Text style={styles.bodyText}>
              {exchange.status === TransactionStatus.Pending
                ? t('swapTransactionDetailPage.estimatedFee')
                : t('swapTransactionDetailPage.networkFee')}
            </Text>
            <TokenDisplay
              style={styles.currencyAmountPrimaryText}
              amount={exchange.fees[0].amount.value}
              tokenId={exchange.fees[0].amount.tokenId}
              showLocalAmount={false}
              showSymbol={true}
              hideSign={true}
              testID="SwapContent/estimatedFee"
            />
          </View>
          <View style={styles.row}>
            <TokenDisplay
              style={styles.currencyAmountSecondaryText}
              amount={exchange.fees[0].amount.value}
              tokenId={exchange.fees[0].amount.tokenId}
              showLocalAmount={true}
              showSymbol={true}
              hideSign={true}
              testID="SwapContent/estimatedFeeLocalAmount"
            />
          </View>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  contentContainer: {
    flexShrink: 1,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bodyText: {
    ...typeScale.bodyMedium,
    color: Colors.black,
    width: '40%',
  },
  currencyAmountPrimaryText: {
    ...typeScale.bodyMedium,
    color: Colors.black,
    width: '60%',
    textAlign: 'right',
  },
  currencyAmountSecondaryText: {
    ...typeScale.bodySmall,
    color: Colors.gray4,
    marginLeft: 'auto',
  },
})
