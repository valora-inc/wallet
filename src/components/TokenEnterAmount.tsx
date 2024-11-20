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
  View,
} from 'react-native'
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
import { type AmountEnteredIn } from 'src/send/types'
import { NETWORK_NAMES } from 'src/shared/conts'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { type TokenBalance } from 'src/tokens/slice'

export const APPROX_SYMBOL = '≈'

const BORDER_RADIUS = 12

function groupNumber(value: string) {
  return value.replace(/\B(?=(\d{3})+(?!\d))(?<!\.\d*)/g, 'group')
}

export default function TokenEnterAmount({
  token,
  inputValue,
  tokenAmount,
  localAmount,
  amountType,
  inputRef,
  inputStyle,
  autoFocus,
  editable = true,
  testID,
  onInputChange,
  toggleAmountType,
  onOpenTokenPicker,
}: {
  token?: TokenBalance
  inputValue: string
  tokenAmount: string
  localAmount: string
  amountType: AmountEnteredIn
  inputRef: React.MutableRefObject<RNTextInput | null>
  inputStyle?: StyleProp<TextStyle>
  autoFocus?: boolean
  editable?: boolean
  testID?: string
  onInputChange(value: string): void
  toggleAmountType?(): void
  onOpenTokenPicker?(): void
}) {
  const { t } = useTranslation()
  // the startPosition and inputRef variables exist to ensure TextInput
  // displays the start of the value for long values on Android
  // https://github.com/facebook/react-native/issues/14845
  const [startPosition, setStartPosition] = useState<number | undefined>(0)
  // this should never be null, just adding a default to make TS happy
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol) ?? LocalCurrencySymbol.USD
  const { decimalSeparator, groupingSeparator } = getNumberFormatSettings()
  const tokenPlaceholder = new BigNumber(0).toFormat(2)
  const localPlaceholder = `${localCurrencySymbol}${new BigNumber(0).toFormat(2).replaceAll('.', decimalSeparator)}`

  const formattedInputValue = useMemo(() => {
    const number = groupNumber(inputValue)
      .replaceAll('.', decimalSeparator)
      .replaceAll('group', groupingSeparator)
    if (amountType === 'token') return number
    return number !== '' ? `${localCurrencySymbol}${number}` : ''
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
        onPress={onOpenTokenPicker}
        disabled={!onOpenTokenPicker}
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
                  <Text style={styles.tokenName} testID={`${testID}/TokenName`}>
                    {token.symbol} on {NETWORK_NAMES[token.networkId]}
                  </Text>
                  <Text style={styles.tokenBalance} testID={`${testID}/TokenBalance`}>
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

          {onOpenTokenPicker && <DownArrowIcon height={24} color={Colors.gray3} />}
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
            placeholder={amountType === 'token' ? tokenPlaceholder : localPlaceholder}
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
                <Touchable
                  onPress={toggleAmountType}
                  style={styles.swapArrowContainer}
                  testID={`${testID}/SwitchTokens`}
                >
                  <SwapArrows color={Colors.gray3} size={24} />
                </Touchable>
              )}

              <Text
                numberOfLines={1}
                style={[styles.secondaryAmountText, { maxWidth: '35%' }]}
                testID={`${testID}/ExchangeAmount`}
              >
                {amountType === 'token'
                  ? `${APPROX_SYMBOL} ${localAmount ? localAmount : localPlaceholder}`
                  : `${APPROX_SYMBOL} ${tokenAmount ? tokenAmount : tokenPlaceholder}`}
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
