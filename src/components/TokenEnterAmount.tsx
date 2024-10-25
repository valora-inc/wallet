import BigNumber from 'bignumber.js'
import React, { useState } from 'react'
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
import TextInput from 'src/components/TextInput'
import TokenDisplay from 'src/components/TokenDisplay'
import TokenIcon, { IconSize } from 'src/components/TokenIcon'
import Touchable from 'src/components/Touchable'
import DownArrowIcon from 'src/icons/DownArrowIcon'
import SwapArrows from 'src/icons/SwapArrows'
import { AmountEnteredIn } from 'src/send/types'
import { NETWORK_NAMES } from 'src/shared/conts'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { TokenBalance } from 'src/tokens/slice'

const BORDER_RADIUS = 12

export function TokenEnterAmount({
  token,
  onTokenPickerSelect,
  tokenSelectionDisabled = false,
  tokenValue,
  onInputChange,
  localAmountValue,
  allowEnterLocalAmount,
  localCurrencySymbol,
  amountType,
  toggleAmountType,
  inputRef,
  inputStyle,
  autoFocus,
  testID = 'AmountInput',
}: {
  token?: TokenBalance
  onTokenPickerSelect(): void
  tokenSelectionDisabled?: boolean
  tokenValue: string
  onInputChange(value: string): void
  localAmountValue: string
  allowEnterLocalAmount: boolean
  localCurrencySymbol: string
  amountType: AmountEnteredIn
  toggleAmountType(): void
  inputRef: React.MutableRefObject<RNTextInput | null>
  inputStyle?: StyleProp<TextStyle>
  autoFocus?: boolean
  testID?: string
}) {
  const { t } = useTranslation()
  // the startPosition and inputRef variables exist to ensure TextInput
  // displays the start of the value for long values on Android
  // https://github.com/facebook/react-native/issues/14845
  const [startPosition, setStartPosition] = useState<number | undefined>(0)

  const tokenValuePlaceholder = new BigNumber(0).toFormat(2)
  const localAmountPlaceholder = `${localCurrencySymbol}${new BigNumber(0).toFormat(2)}`
  const inputValue = amountType === 'token' ? tokenValue : localAmountValue

  const handleSetStartPosition = (value?: number) => {
    if (Platform.OS === 'android') {
      setStartPosition(value)
    }
  }

  return (
    <View>
      <Touchable
        borderless
        borderRadius={BORDER_RADIUS}
        onPress={onTokenPickerSelect}
        testID="SendEnterAmount/TokenSelect"
        disabled={tokenSelectionDisabled}
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
          {token ? (
            <View style={styles.tokenInfoContainer}>
              <TokenIcon token={token} size={IconSize.MEDIUM} />
              <View>
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
            </View>
          ) : (
            <Text style={styles.placeholderText}>{t('tokenEnterAmount.selectToken')}</Text>
          )}
          <DownArrowIcon height={24} color={Colors.gray3} />
        </View>
      </Touchable>
      {token && (
        <View style={[styles.rowContainer, { borderTopLeftRadius: 0, borderTopRightRadius: 0 }]}>
          <TextInput
            forwardedRef={inputRef}
            onChangeText={(value) => {
              handleSetStartPosition(undefined)
              onInputChange(value)
            }}
            value={inputValue ?? undefined}
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
            testID={testID}
            onBlur={() => {
              handleSetStartPosition(0)
            }}
            onFocus={() => {
              handleSetStartPosition(inputValue?.length ?? 0)
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
          />

          {allowEnterLocalAmount ? (
            <>
              <Touchable onPress={toggleAmountType} style={styles.swapArrowContainer}>
                <SwapArrows color={Colors.gray3} size={24} />
              </Touchable>

              <Text numberOfLines={1} style={[styles.secondaryAmountText, { maxWidth: '35%' }]}>
                {amountType === 'token'
                  ? `≈ ${inputValue ? localAmountValue : localAmountPlaceholder}`
                  : `≈ ${inputValue ? tokenValue : tokenValuePlaceholder}`}
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
  },
  tokenName: {
    ...typeScale.labelMedium,
  },
  tokenBalance: {
    ...typeScale.bodySmall,
    color: Colors.gray3,
  },
  primaryAmountText: {
    ...typeScale.titleMedium,
    paddingTop: 0,
    paddingBottom: 0,
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
