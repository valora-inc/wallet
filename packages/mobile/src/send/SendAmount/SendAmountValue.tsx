import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { parseInputAmount } from '@celo/utils/lib/parsing'
import BigNumber from 'bignumber.js'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { getNumberFormatSettings } from 'react-native-localize'
import { formatValueToDisplay } from 'src/components/TokenDisplay'
import SwapInput from 'src/icons/SwapInput'
import { getLocalCurrencyCode, getLocalCurrencySymbol } from 'src/localCurrency/selectors'
import useSelector from 'src/redux/useSelector'
import { useTokenInfo, useTokenToLocalAmount } from 'src/tokens/hooks'

const { decimalSeparator } = getNumberFormatSettings()

const LOCAL_CURRENCY_MAX_DECIMALS = 2

function formatWithMaxDecimals(value: BigNumber | null, decimals: number) {
  if (!value || value.isNaN() || value.isZero()) {
    return ''
  }
  // The first toFormat limits the number of desired decimals and the second
  // removes trailing zeros.
  return parseInputAmount(
    value.toFormat(decimals, BigNumber.ROUND_DOWN),
    decimalSeparator
  ).toFormat()
}

interface Props {
  inputAmount: string
  tokenAmount: BigNumber
  usingLocalAmount: boolean
  tokenAddress: string
  isOutgoingPaymentRequest: boolean
  onPressMax: () => void
  onSwapInput: () => void
  tokenHasUsdPrice: boolean
}

function SendAmountValue({
  inputAmount,
  tokenAmount,
  usingLocalAmount,
  tokenAddress,
  isOutgoingPaymentRequest,
  onPressMax,
  onSwapInput,
  tokenHasUsdPrice,
}: Props) {
  const { t } = useTranslation()

  const localCurrencyCode = useSelector(getLocalCurrencyCode)
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const tokenInfo = useTokenInfo(tokenAddress)
  const localAmount = useTokenToLocalAmount(tokenAmount, tokenAddress)

  const primaryAmount = usingLocalAmount
    ? formatWithMaxDecimals(new BigNumber(inputAmount || 0), LOCAL_CURRENCY_MAX_DECIMALS)
    : inputAmount
  const secondaryAmount = usingLocalAmount ? tokenAmount : localAmount ?? new BigNumber(0)

  return (
    <>
      <View style={styles.container}>
        {isOutgoingPaymentRequest ? (
          <View style={styles.placeholder} />
        ) : (
          <Touchable
            borderless={true}
            onPress={onPressMax}
            style={styles.pressableButton}
            testID="MaxButton"
          >
            <Text adjustsFontSizeToFit={true} maxFontSizeMultiplier={1.618} style={styles.button}>
              {t('max')}
            </Text>
          </Touchable>
        )}
        <View style={styles.valuesContainer}>
          <View style={styles.valueContainer} testID="InputAmountContainer">
            {usingLocalAmount && (
              <View style={styles.symbolContainer}>
                <Text
                  allowFontScaling={false}
                  adjustsFontSizeToFit={true}
                  numberOfLines={1}
                  style={styles.mainSymbol}
                >
                  {localCurrencySymbol || localCurrencyCode}
                </Text>
              </View>
            )}
            <View style={styles.amountContainer}>
              <Text
                textBreakStrategy="simple"
                allowFontScaling={false}
                adjustsFontSizeToFit={true}
                numberOfLines={1}
                minimumFontScale={0.4}
                selectable={true}
                ellipsizeMode="tail"
                style={styles.mainAmount}
                testID="InputAmount"
              >
                {primaryAmount || 0}
              </Text>
            </View>
            {!usingLocalAmount && (
              <View style={styles.symbolContainer}>
                <Text
                  allowFontScaling={false}
                  adjustsFontSizeToFit={true}
                  numberOfLines={1}
                  style={styles.mainSymbol}
                >
                  {tokenInfo?.symbol}
                </Text>
              </View>
            )}
          </View>
          {tokenHasUsdPrice && (
            <View style={styles.valueContainer} testID="SecondaryAmountContainer">
              {!usingLocalAmount && (
                <View style={styles.symbolContainer}>
                  <Text
                    allowFontScaling={false}
                    adjustsFontSizeToFit={true}
                    numberOfLines={1}
                    style={styles.secondarySymbol}
                  >
                    {localCurrencySymbol || localCurrencyCode}
                  </Text>
                </View>
              )}
              <View style={styles.amountContainer}>
                <Text adjustsFontSizeToFit={true} numberOfLines={1} style={styles.secondaryAmount}>
                  {formatValueToDisplay(secondaryAmount)}
                </Text>
              </View>
              {usingLocalAmount && (
                <View style={styles.symbolContainer}>
                  <Text
                    allowFontScaling={false}
                    adjustsFontSizeToFit={true}
                    numberOfLines={1}
                    style={styles.secondarySymbol}
                  >
                    {tokenInfo?.symbol}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
        {tokenHasUsdPrice ? (
          <Touchable
            onPress={onSwapInput}
            borderless={true}
            style={styles.pressableButton}
            testID="SwapInput"
          >
            <SwapInput />
          </Touchable>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  valuesContainer: {
    flex: 1,
  },
  valueContainer: {
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  amountContainer: {
    justifyContent: 'center',
    maxWidth: '85%',
  },
  symbolContainer: {
    justifyContent: 'center',
  },
  button: {
    color: colors.gray4,
    fontSize: 12,
  },
  mainSymbol: {
    ...fontStyles.regular,
    fontSize: 24,
    lineHeight: 64,
  },
  secondarySymbol: {
    ...fontStyles.small,
    marginHorizontal: 2,
  },
  // font family, font weight and width are fixes for truncated text on Android https://github.com/facebook/react-native/issues/15114
  mainAmount: {
    ...fontStyles.regular,
    fontSize: 64,
    lineHeight: undefined,
    fontFamily: 'Jost-Medium',
    fontWeight: 'normal',
    width: '100%',
    paddingRight: 2,
  },
  secondaryAmount: {
    ...fontStyles.small,
    lineHeight: undefined,
  },
  pressableButton: {
    backgroundColor: colors.gray1,
    borderColor: colors.gray2,
    borderRadius: 100,
    borderWidth: 1,
    height: 48,
    width: 48,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    height: 48,
    width: 48,
  },
})

export default SendAmountValue
