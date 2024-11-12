import BigNumber from 'bignumber.js'
import React, { useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import {
  Platform,
  TextInput as RNTextInput,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
} from 'react-native'
import { View } from 'react-native-animatable'
import { getNumberFormatSettings } from 'react-native-localize'
import TextInput from 'src/components/TextInput'
import TokenDisplay from 'src/components/TokenDisplay'
import TokenIcon, { IconSize } from 'src/components/TokenIcon'
import Touchable from 'src/components/Touchable'
import DownArrowIcon from 'src/icons/DownArrowIcon'
import SwapArrows from 'src/icons/SwapArrows'
import { LocalCurrencySymbol } from 'src/localCurrency/consts'
import { getLocalCurrencySymbol } from 'src/localCurrency/selectors'
import { useSelector } from 'src/redux/hooks'
import { AmountEnteredIn } from 'src/send/types'
import { NETWORK_NAMES } from 'src/shared/conts'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { TokenBalance } from 'src/tokens/slice'
import { parseInputAmount } from 'src/utils/parsing'

const BORDER_RADIUS = 12

function roundTokenAmount(value: string, decimalSeparator: string) {
  return parseInputAmount(value, decimalSeparator)
    .decimalPlaces(6)
    .toString()
    .replaceAll('.', decimalSeparator)
}

function roundLocalAmount(
  value: string,
  decimalSeparator: string,
  localCurrencySymbol: LocalCurrencySymbol
) {
  const bigNum = parseInputAmount(value, decimalSeparator)

  if (bigNum.isLessThan(0.000001)) {
    return `<${localCurrencySymbol}0${decimalSeparator}000001`
  }

  if (bigNum.isLessThan(0.01)) {
    return `${localCurrencySymbol}${bigNum.toPrecision(1).toString().replaceAll('.', decimalSeparator)}`
  }

  return `${localCurrencySymbol}${bigNum.decimalPlaces(2).toString().replaceAll('.', decimalSeparator)}`
}

export function TokenEnterAmount({
  token,
  onTokenPickerSelect,
  tokenValue,
  onInputChange,
  localAmountValue,
  amountType,
  toggleAmountType,
  inputRef,
  inputStyle,
  autoFocus,
  editable = true,
  testID,
}: {
  token?: TokenBalance
  onTokenPickerSelect?(): void
  tokenValue: string
  onInputChange(value: string): void
  localAmountValue: string
  amountType: AmountEnteredIn
  toggleAmountType?(): void
  inputRef: React.MutableRefObject<RNTextInput | null>
  inputStyle?: StyleProp<TextStyle>
  autoFocus?: boolean
  editable?: boolean
  testID?: string
}) {
  const { t } = useTranslation()
  const { decimalSeparator } = getNumberFormatSettings()
  // the startPosition and inputRef variables exist to ensure TextInput
  // displays the start of the value for long values on Android
  // https://github.com/facebook/react-native/issues/14845
  const [startPosition, setStartPosition] = useState<number | undefined>(0)
  // this should never be null, just adding a default to make TS happy
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol) ?? LocalCurrencySymbol.USD
  const tokenValuePlaceholder = new BigNumber(0).toFormat(2)
  const localAmountPlaceholder = `${localCurrencySymbol}${new BigNumber(0).toFormat(2).replaceAll('.', decimalSeparator)}`
  const inputValue = amountType === 'token' ? tokenValue : localAmountValue

  const tokenAmountRounded = roundTokenAmount(tokenValue, decimalSeparator)
  const localAmountRounded = roundLocalAmount(
    localAmountValue,
    decimalSeparator,
    localCurrencySymbol
  )

  const formattedInputValue = useMemo(() => {
    if (amountType === 'token') return inputValue
    return inputValue !== '' ? `${localCurrencySymbol}${inputValue}` : ''
  }, [inputValue, amountType, localCurrencySymbol])

  const handleSetStartPosition = (value?: number) => {
    if (Platform.OS === 'android') {
      setStartPosition(value)
    }
  }

  return (
    <View testID={testID}>
      <Touchable
        borderless
        onPress={onTokenPickerSelect}
        disabled={!onTokenPickerSelect}
        testID={`${testID}/TokenSelect`}
        borderRadius={{
          borderTopLeftRadius: BORDER_RADIUS,
          borderTopRightRadius: BORDER_RADIUS,
          borderBottomLeftRadius: token ? 0 : BORDER_RADIUS,
          borderBottomRightRadius: token ? 0 : BORDER_RADIUS,
        }}
      >
        <View
          style={[
            styles.rowContainer,
            {
              borderBottomLeftRadius: token ? 0 : BORDER_RADIUS,
              borderBottomRightRadius: token ? 0 : BORDER_RADIUS,
            },
          ]}
        >
          <View style={styles.tokenInfoContainer}>
            {token ? (
              <>
                <TokenIcon token={token} size={IconSize.MEDIUM} />

                <View style={styles.tokenNameAndAvailable}>
                  <Text style={styles.tokenName}>
                    {token.symbol} on {NETWORK_NAMES[token.networkId]}
                  </Text>
                  <Text style={styles.tokenBalance}>
                    <Trans i18nKey="tokenEnterAmount.availableBalance">
                      <TokenDisplay
                        tokenId={token.tokenId}
                        amount={token.balance}
                        showLocalAmount={false}
                      />
                    </Trans>
                  </Text>
                </View>
              </>
            ) : (
              <Text style={styles.placeholderText}>{t('tokenEnterAmount.selectToken')}</Text>
            )}
          </View>

          {onTokenPickerSelect && <DownArrowIcon height={24} color={Colors.gray3} />}
        </View>
      </Touchable>
      {token && (
        <View
          style={[
            styles.rowContainer,
            { borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTopWidth: 0 },
          ]}
        >
          <TextInput
            forwardedRef={inputRef}
            onChangeText={(value) => {
              handleSetStartPosition(undefined)
              onInputChange(value.startsWith(localCurrencySymbol) ? value.slice(1) : value)
            }}
            value={formattedInputValue}
            placeholderTextColor={Colors.gray3}
            placeholder={amountType === 'token' ? tokenValuePlaceholder : localAmountPlaceholder}
            keyboardType="decimal-pad"
            // Work around for RN issue with Samsung keyboards
            // https://github.com/facebook/react-native/issues/22005
            autoCapitalize="words"
            autoFocus={autoFocus}
            // unset lineHeight to allow ellipsis on long inputs on iOS. For
            // android, ellipses doesn't work and unsetting line height causes
            // height changes when amount is entered
            inputStyle={[
              styles.primaryAmountText,
              inputStyle,
              Platform.select({ ios: { lineHeight: undefined } }),
            ]}
            onBlur={() => {
              handleSetStartPosition(0)
            }}
            onFocus={() => {
              const withCurrency = amountType === 'local' ? 1 : 0
              handleSetStartPosition((inputValue?.length ?? 0) + withCurrency)
            }}
            onSelectionChange={() => {
              handleSetStartPosition(undefined)
            }}
            selection={
              Platform.OS === 'android' && typeof startPosition === 'number'
                ? { start: startPosition }
                : undefined
            }
            showClearButton={false}
            editable={editable}
            testID={`${testID}/TokenAmountInput`}
          />

          {token.priceUsd ? (
            <>
              {toggleAmountType && (
                <Touchable onPress={toggleAmountType} style={styles.swapArrowContainer}>
                  <SwapArrows color={Colors.gray3} size={24} />
                </Touchable>
              )}

              <Text numberOfLines={1} style={[styles.secondaryAmountText, { maxWidth: '35%' }]}>
                {amountType === 'token'
                  ? `≈ ${inputValue ? localAmountRounded : localAmountPlaceholder}`
                  : `≈ ${inputValue ? tokenAmountRounded : tokenValuePlaceholder}`}
              </Text>
            </>
          ) : (
            <Text style={styles.secondaryAmountText}>
              {t('tokenEnterAmount.fiatPriceUnavailable')}
            </Text>
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  rowContainer: {
    borderWidth: 1,
    borderColor: Colors.gray2,
    borderRadius: BORDER_RADIUS,
    padding: Spacing.Regular16,
    backgroundColor: Colors.gray1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.Tiny4,
  },
  tokenInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.Smallest8,
    flexShrink: 1,
  },
  tokenNameAndAvailable: {
    flexShrink: 1,
  },
  tokenName: {
    ...typeScale.labelMedium,
    color: Colors.black,
  },
  tokenBalance: {
    ...typeScale.bodySmall,
    color: Colors.gray3,
  },
  primaryAmountText: {
    ...typeScale.titleMedium,
    paddingTop: 0,
    paddingBottom: 0,
    color: Colors.black,
  },
  secondaryAmountText: {
    ...typeScale.bodyMedium,
    color: Colors.gray3,
  },
  placeholderText: {
    ...typeScale.labelMedium,
    paddingHorizontal: 4,
    color: Colors.gray3,
  },
  swapArrowContainer: {
    transform: [{ rotate: '90deg' }],
  },
})

export default TokenEnterAmount
