import BigNumber from 'bignumber.js'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import { BottomSheetRefType } from 'src/components/BottomSheet'
import TokenDisplay from 'src/components/TokenDisplay'
import Touchable from 'src/components/Touchable'
import InfoIcon from 'src/icons/InfoIcon'
import { getLocalCurrencySymbol, usdToLocalCurrencyRateSelector } from 'src/localCurrency/selectors'
import { NETWORK_NAMES } from 'src/shared/conts'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { TokenBalance } from 'src/tokens/slice'

interface Props {
  networkFee?: BigNumber
  networkFeeInfoBottomSheetRef: React.RefObject<BottomSheetRefType>
  slippagePercentage: string
  feeTokenId: string
  fromToken?: TokenBalance
  toToken?: TokenBalance
  exchangeRatePrice?: string
  swapAmount?: BigNumber
  fetchingSwapQuote: boolean
}

export function SwapTransactionDetails({
  networkFee,
  networkFeeInfoBottomSheetRef,
  feeTokenId,
  slippagePercentage,
  fromToken,
  toToken,
  exchangeRatePrice,
  swapAmount,
  fetchingSwapQuote,
}: Props) {
  const { t } = useTranslation()
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const localCurrencyExchangeRate = useSelector(usdToLocalCurrencyRateSelector)

  const placeholder = '-'
  return (
    <View style={styles.container} testID="SwapTransactionDetails">
      <View style={styles.row} testID="SwapTransactionDetails/ExchangeRate">
        <Text style={styles.label}>{t('swapScreen.transactionDetails.exchangeRate')}</Text>
        <Text style={styles.value}>
          {!fetchingSwapQuote && fromToken && toToken && exchangeRatePrice ? (
            <>
              {`1 ${fromToken.symbol} ≈ `}
              <Text style={styles.value}>
                {`${new BigNumber(exchangeRatePrice).toFormat(5, BigNumber.ROUND_DOWN)} ${
                  toToken.symbol
                }`}
              </Text>
            </>
          ) : (
            <Text style={styles.value}>
              {fromToken ? `1 ${fromToken.symbol} ≈ ` : ''}
              {placeholder}
            </Text>
          )}
        </Text>
      </View>
      <View style={styles.row}>
        {fromToken?.networkId ? (
          <>
            <Touchable
              style={styles.touchableRow}
              onPress={() => {
                networkFeeInfoBottomSheetRef.current?.snapToIndex(0)
              }}
              testID="SwapTransactionDetails/NetworkFee/MoreInfo"
            >
              <>
                <Text style={styles.label}>
                  {t('swapScreen.transactionDetails.networkFee', {
                    networkName: NETWORK_NAMES[fromToken.networkId],
                  })}
                </Text>
                <InfoIcon
                  size={14}
                  color={colors.gray4}
                  testID="SwapTransactionDetails/NetworkFee/MoreInfo/Icon"
                />
              </>
            </Touchable>
            {!fetchingSwapQuote && networkFee ? (
              <View style={styles.networkFeeContainer}>
                <TokenDisplay
                  style={styles.value}
                  amount={networkFee}
                  showApprox
                  tokenId={feeTokenId}
                  showLocalAmount={true}
                  testID="SwapTransactionDetails/NetworkFee/FiatValue"
                />
                <Text style={[styles.value, { fontWeight: '400' }]}>
                  {` (`}
                  <TokenDisplay
                    amount={networkFee}
                    tokenId={feeTokenId}
                    showSymbol={true}
                    showLocalAmount={false}
                    testID="SwapTransactionDetails/NetworkFee/Value"
                  />
                  {')'}
                </Text>
              </View>
            ) : (
              <Text style={styles.value}>{placeholder}</Text>
            )}
          </>
        ) : (
          <>
            <Text style={styles.label}>
              {t('swapScreen.transactionDetails.networkFeeNoNetwork')}
            </Text>
            <Text style={styles.value} testID="SwapTransactionDetails/NetworkFee/Value">
              {placeholder}
            </Text>
          </>
        )}
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>{t('swapScreen.transactionDetails.swapFee')}</Text>
        <Text testID={'SwapFee'} style={styles.value}>
          {t('swapScreen.transactionDetails.swapFeeWaived')}
        </Text>
      </View>
      <View style={styles.row} testID="SwapTransactionDetails/EstimatedValue">
        <Text style={styles.label}>{t('swapScreen.transactionDetails.estimatedValue')}</Text>
        <Text style={styles.value}>
          {fromToken?.priceUsd && swapAmount?.gt(0) && localCurrencyExchangeRate
            ? `${localCurrencySymbol}${swapAmount
                .multipliedBy(fromToken.priceUsd)
                .multipliedBy(localCurrencyExchangeRate)
                .toFormat(2, BigNumber.ROUND_DOWN)}`
            : placeholder}
        </Text>
      </View>
      <View style={styles.row} testID="SwapTransactionDetails/Slippage">
        <Text style={styles.label}>{t('swapScreen.transactionDetails.slippagePercentage')}</Text>
        <Text style={styles.value}>{`${slippagePercentage}%`}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.Tiny4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: Spacing.Small12,
  },
  touchableRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    ...typeScale.bodyXSmall,
    color: colors.gray4,
    fontWeight: '600',
  },
  label: {
    ...typeScale.bodyXSmall,
    color: colors.gray4,
    marginRight: Spacing.Tiny4,
  },
  networkFeeContainer: {
    flexDirection: 'row',
  },
})

export default SwapTransactionDetails
