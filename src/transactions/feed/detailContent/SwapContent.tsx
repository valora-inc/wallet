import BigNumber from 'bignumber.js'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { SwapEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import TokenDisplay from 'src/components/TokenDisplay'
import { formatValueToDisplay } from 'src/components/TokenDisplay'
import Touchable from 'src/components/Touchable'
import OpenLinkIcon from 'src/icons/OpenLinkIcon'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { useTokensList } from 'src/tokens/hooks'
import { TokenExchange } from 'src/transactions/types'
import networkConfig from 'src/web3/networkConfig'

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

  const onPressTxDetails = () => {
    ValoraAnalytics.track(SwapEvents.swap_feed_detail_view_tx)
    navigate(Screens.WebViewScreen, {
      uri: `${networkConfig.celoExplorerBaseTxUrl}${exchange.transactionHash}`,
    })
  }

  return (
    <View style={styles.contentContainer}>
      <View style={[styles.row, { paddingBottom: Spacing.Regular16 }]}>
        <Text style={styles.bodyText}>{t('swapTransactionDetailPage.swapTo')}</Text>
        <TokenDisplay
          style={styles.currencyAmountText}
          amount={exchange.inAmount.value}
          tokenId={exchange.inAmount.tokenId}
          showLocalAmount={false}
          showSymbol={true}
          hideSign={true}
          testID="SwapContent/swapTo"
        />
      </View>
      <View style={[styles.row, { paddingBottom: Spacing.Regular16 }]}>
        <Text style={styles.bodyText}>{t('swapTransactionDetailPage.swapFrom')}</Text>
        <TokenDisplay
          style={styles.currencyAmountText}
          amount={exchange.outAmount.value}
          tokenId={exchange.outAmount.tokenId}
          showLocalAmount={false}
          showSymbol={true}
          hideSign={true}
          testID="SwapContent/swapFrom"
        />
      </View>
      <View style={styles.separator} />
      <View style={[styles.row, { paddingBottom: Spacing.Smallest8 }]}>
        <Text style={styles.bodyText}>{t('swapTransactionDetailPage.rate')}</Text>
        <Text testID="SwapContent/rate" style={styles.currencyAmountText}>
          {`1 ${fromTokenSymbol} ≈ ${formatValueToDisplay(
            new BigNumber(exchange.inAmount.value).dividedBy(exchange.outAmount.value)
          )} ${toTokenSymbol}`}
        </Text>
      </View>
      <View style={[styles.row, { paddingBottom: Spacing.Smallest8 }]}>
        <Text style={styles.bodyText}>{t('swapTransactionDetailPage.estimatedFee')}</Text>
        {exchange.fees[0] && (
          <TokenDisplay
            style={styles.currencyAmountText}
            amount={exchange.fees[0].amount.value}
            tokenId={exchange.fees[0].amount.tokenId}
            showLocalAmount={false}
            showSymbol={true}
            hideSign={true}
            testID="SwapContent/estimatedFee"
          />
        )}
      </View>
      <Touchable
        style={styles.rowContainer}
        borderless={true}
        onPress={onPressTxDetails}
        testID={'txDetails'}
      >
        <>
          <Text style={styles.txDetails}>{t('swapTransactionDetailPage.viewOnExplorer')}</Text>
          <OpenLinkIcon color={colors.gray4} />
        </>
      </Touchable>
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
    ...fontStyles.large,
    width: '40%',
  },
  currencyAmountText: {
    ...fontStyles.large,
    width: '60%',
    textAlign: 'right',
  },
  separator: {
    height: 1,
    width: '100%',
    backgroundColor: colors.gray2,
    marginBottom: Spacing.Regular16,
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txDetails: {
    ...fontStyles.large,
    color: colors.gray4,
  },
})
