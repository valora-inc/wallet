import BigNumber from 'bignumber.js'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { formatValueToDisplay } from 'src/components/TokenDisplay'
import Touchable from 'src/components/Touchable'
import SwapInput from 'src/icons/SwapInput'
import { getLocalCurrencyCode, getLocalCurrencySymbol } from 'src/localCurrency/selectors'
import useSelector from 'src/redux/useSelector'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { useTokenInfo, useTokenToLocalAmount } from 'src/tokens/hooks'

interface Props {
  inputAmount: string
  tokenAmount: BigNumber
  usingLocalAmount: boolean
  tokenAddress: string
  isOutgoingPaymentRequest: boolean
  onPressMax: () => void
  onSwapInput: () => void
  tokenHasUsdPrice: boolean
  allowModify: boolean
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
  allowModify,
}: Props) {
  const { t } = useTranslation()

  const localCurrencyCode = useSelector(getLocalCurrencyCode)
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const tokenInfo = useTokenInfo(tokenAddress)
  const localAmount = useTokenToLocalAmount(tokenAmount, tokenAddress)

  const secondaryAmount = usingLocalAmount ? tokenAmount : localAmount ?? new BigNumber(0)

  return (
    <>
      <View style={styles.container}>
        {isOutgoingPaymentRequest || !allowModify ? (
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
                  testID="PrimaryInputSymbol"
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
                {inputAmount ? inputAmount : 0}
              </Text>
            </View>
            {!usingLocalAmount && (
              <View style={styles.symbolContainer}>
                <Text
                  testID="PrimaryInputSymbol"
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
    ...fontStyles.smallNumber,
    color: colors.gray4,
    fontSize: 12,
  },
  mainSymbol: {
    ...fontStyles.largeNumber,
  },
  secondarySymbol: {
    ...fontStyles.small,
    marginHorizontal: 2,
  },
  // font family, font weight and width are fixes for truncated text on Android https://github.com/facebook/react-native/issues/15114
  mainAmount: {
    ...fontStyles.largeNumber,
    fontSize: 64,
    lineHeight: undefined,
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
