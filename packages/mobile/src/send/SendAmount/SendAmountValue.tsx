import BorderlessButton from '@celo/react-components/components/BorderlessButton'
import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import BigNumber from 'bignumber.js'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { formatValueToDisplay } from 'src/components/TokenDisplay'
import SwapInput from 'src/icons/SwapInput'
import { getLocalCurrencyCode, getLocalCurrencySymbol } from 'src/localCurrency/selectors'
import useSelector from 'src/redux/useSelector'
import { useTokenInfo, useTokenToLocalAmount } from 'src/tokens/hooks'

interface Props {
  inputAmount: string
  tokenAmount: BigNumber
  usingLocalAmount: boolean
  tokenAddress: string
  isOutgoingPaymentRequest: boolean
  onPressMax: () => void
  onSwapInput: () => void
}

function SendAmountValue({
  inputAmount,
  tokenAmount,
  usingLocalAmount,
  tokenAddress,
  isOutgoingPaymentRequest,
  onPressMax,
  onSwapInput,
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
        {isOutgoingPaymentRequest ? null : (
          <BorderlessButton onPress={onPressMax}>
            <Text style={styles.button}>{t('max')}</Text>
          </BorderlessButton>
        )}
        <View style={styles.valuesContainer}>
          <View style={styles.valueContainer}>
            {usingLocalAmount && (
              <View style={styles.symbolContainer}>
                <Text adjustsFontSizeToFit={true} numberOfLines={1} style={styles.mainSymbol}>
                  {localCurrencySymbol || localCurrencyCode}
                </Text>
              </View>
            )}
            <View style={styles.amountContainer}>
              <Text
                textBreakStrategy="simple"
                adjustsFontSizeToFit={true}
                numberOfLines={1}
                minimumFontScale={0.4}
                selectable={true}
                ellipsizeMode="tail"
                style={styles.mainAmount}
              >
                {inputAmount ? inputAmount : 0}
              </Text>
            </View>
            {!usingLocalAmount && (
              <View style={styles.symbolContainer}>
                <Text adjustsFontSizeToFit={true} numberOfLines={1} style={styles.mainSymbol}>
                  {tokenInfo?.symbol}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.valueContainer}>
            {!usingLocalAmount && (
              <View style={styles.symbolContainer}>
                <Text adjustsFontSizeToFit={true} numberOfLines={1} style={styles.secondarySymbol}>
                  {localCurrencySymbol || localCurrencyCode}
                </Text>
              </View>
            )}
            <View style={styles.amountContainer}>
              <Text adjustsFontSizeToFit={true} numberOfLines={1} style={styles.secondaryAmount}>
                ~{formatValueToDisplay(secondaryAmount)}
              </Text>
            </View>
            {usingLocalAmount && (
              <View style={styles.symbolContainer}>
                <Text adjustsFontSizeToFit={true} numberOfLines={1} style={styles.secondarySymbol}>
                  {tokenInfo?.symbol}
                </Text>
              </View>
            )}
          </View>
        </View>
        <Touchable onPress={onSwapInput} borderless={true}>
          <SwapInput />
        </Touchable>
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
    flexDirection: 'row',
    justifyContent: 'center',
  },
  amountContainer: {
    justifyContent: 'center',
    maxWidth: '75%',
  },
  symbolContainer: {
    justifyContent: 'center',
  },
  button: {
    color: colors.gray4,
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
    fontFamily: 'arial',
    fontWeight: 'normal',
    width: '100%',
    paddingHorizontal: 2,
  },
  secondaryAmount: {
    ...fontStyles.small,
    lineHeight: undefined,
  },
})

export default SendAmountValue
