import BigNumber from 'bignumber.js'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import HorizontalLine from 'src/components/HorizontalLine'
import TokenDisplay from 'src/components/TokenDisplay'
import Touchable from 'src/components/Touchable'
import OpenLinkIcon from 'src/icons/OpenLinkIcon'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { TokenExchange } from 'src/transactions/types'
import networkConfig from 'src/web3/networkConfig'

export interface Props {
  exchange: TokenExchange
}

// Note that this is tested from TransactionDetailsScreen.test.tsx
export default function SwapContent({ exchange }: Props) {
  const { t } = useTranslation()

  //TODO: veryfying fee part.
  const onPressTxDetails = () => {
    navigate(Screens.WebViewScreen, {
      uri: `${networkConfig.celoExplorerBaseTxUrl}${exchange.transactionHash}`,
    })
  }

  return (
    <>
      <View style={styles.flexStart}>
        <View style={styles.amountRow}>
          <Text style={styles.exchangeBodyText}>{t('swapContent.swapTo')}</Text>
          <TokenDisplay
            style={styles.currencyAmountText}
            amount={exchange.inAmount.value}
            tokenAddress={exchange.inAmount.tokenAddress}
            showLocalAmount={false}
            showSymbol={true}
            showExplicitPositiveSign={true}
            hideSign={true}
          />
        </View>
        <View style={styles.amountRow}>
          <Text style={styles.exchangeBodyText}>{t('swapContent.swapFrom')}</Text>
          <TokenDisplay
            style={styles.currencyAmountText}
            amount={exchange.outAmount.value}
            tokenAddress={exchange.outAmount.tokenAddress}
            showLocalAmount={false}
            showSymbol={true}
            hideSign={true}
          />
        </View>
        <HorizontalLine />
        <View style={styles.amountRow}>
          <Text style={styles.exchangeBodyText}>{t('swapContent.rate')}</Text>

          <View style={styles.rowContainer}>
            <TokenDisplay
              style={styles.currencyAmountText}
              amount={1}
              tokenAddress={exchange.outAmount.tokenAddress}
              showLocalAmount={false}
              showSymbol={true}
              hideSign={true}
            />
            <Text style={styles.rowContainer}>{'  ≈  '}</Text>
            <TokenDisplay
              style={styles.currencyAmountText}
              amount={new BigNumber(exchange.inAmount.value).dividedBy(exchange.outAmount.value)}
              tokenAddress={exchange.inAmount.tokenAddress}
              showLocalAmount={false}
              showSymbol={true}
              hideSign={true}
            />
          </View>
        </View>
        <View style={styles.amountRow}>
          <Text style={styles.exchangeBodyText}>{t('swapContent.estimatedFee')}</Text>
          <TokenDisplay
            style={styles.currencyAmountText}
            amount={exchange.fees[0].amount.value}
            tokenAddress={exchange.fees[0].amount.tokenAddress}
            showLocalAmount={false}
            showSymbol={true}
            hideSign={true}
          />
        </View>
        <Touchable testID={'txDetails'} borderless={true} onPress={onPressTxDetails}>
          <View style={styles.rowContainer}>
            <Text style={styles.txDetails}>
              {t('fiatConnectStatusScreen.withdraw.success.txDetails')}
            </Text>
            <OpenLinkIcon color={colors.gray4} />
          </View>
        </Touchable>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  flexStart: {
    justifyContent: 'flex-start',
  },
  exchangeBodyText: {
    ...fontStyles.large,
  },
  currencyAmountText: {
    ...fontStyles.large,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
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
