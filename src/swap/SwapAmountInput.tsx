import BigNumber from 'bignumber.js'
import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Platform,
  TextInput as RNTextInput,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native'
import SkeletonPlaceholder from 'react-native-skeleton-placeholder'
import TextInput from 'src/components/TextInput'
import TokenDisplay from 'src/components/TokenDisplay'
import TokenIcon, { IconSize } from 'src/components/TokenIcon'
import Touchable from 'src/components/Touchable'
import DownArrowIcon from 'src/icons/DownArrowIcon'
import Colors from 'src/styles/colors'
import fontStyles, { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { TokenBalance } from 'src/tokens/slice'
import { NETWORK_NAMES } from 'src/shared/conts'

interface Props {
  onInputChange(value: string): void
  inputValue?: string | null
  parsedInputValue?: BigNumber | null
  onPressMax?(): void
  onSelectToken(): void
  token?: TokenBalance
  loading: boolean
  autoFocus?: boolean
  inputError?: boolean
  style?: StyleProp<ViewStyle>
  buttonPlaceholder: string
  editable?: boolean
  borderRadius?: number
}

const SwapAmountInput = ({
  onInputChange,
  inputValue,
  parsedInputValue,
  onPressMax,
  onSelectToken,
  token,
  loading,
  autoFocus,
  inputError,
  style,
  buttonPlaceholder,
  editable = true,
  borderRadius,
}: Props) => {
  const { t } = useTranslation()

  // the startPosition and textInputRef variables exist to ensure TextInput
  // displays the start of the value for long values on Android
  // https://github.com/facebook/react-native/issues/14845
  const [startPosition, setStartPosition] = useState<number | undefined>(0)
  const textInputRef = useRef<RNTextInput | null>(null)

  const handleSetStartPosition = (value?: number) => {
    if (Platform.OS === 'android') {
      setStartPosition(value)
    }
  }

  const touchableBorderStyle = token
    ? {
        borderTopLeftRadius: borderRadius,
        borderTopRightRadius: borderRadius,
      }
    : borderRadius

  return (
    <View style={[styles.container, { borderRadius }, style]} testID="SwapAmountInput">
      <Touchable
        borderless
        borderRadius={touchableBorderStyle}
        onPress={onSelectToken}
        testID="SwapAmountInput/TokenSelect"
      >
        <View style={styles.contentContainer}>
          {token ? (
            <View style={styles.tokenInfo}>
              <TokenIcon token={token} size={IconSize.MEDIUM} />
              <View style={styles.tokenInfoText}>
                <Text style={styles.tokenName}>{token.symbol}</Text>
                <Text style={styles.tokenNetwork}>
                  {t('swapScreen.onNetwork', { networkName: NETWORK_NAMES[token.networkId] })}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.tokenNamePlaceholder}>{buttonPlaceholder}</Text>
          )}
          <DownArrowIcon height={24} color={Colors.gray3} />
        </View>
      </Touchable>
      {token && (
        <View style={[styles.contentContainer, styles.bottomContainer]}>
          <View style={styles.inputContainer}>
            <TextInput
              forwardedRef={textInputRef}
              onChangeText={(value) => {
                handleSetStartPosition(undefined)
                onInputChange(value)
              }}
              value={inputValue || undefined}
              placeholder="0"
              // hide input when loading so that the value is not visible under the loader
              style={{ opacity: loading ? 0 : 1 }}
              editable={editable && !loading}
              keyboardType="decimal-pad"
              // Work around for RN issue with Samsung keyboards
              // https://github.com/facebook/react-native/issues/22005
              autoCapitalize="words"
              autoFocus={autoFocus}
              // unset lineHeight to allow ellipsis on long inputs on iOS
              inputStyle={[styles.inputText, inputError ? styles.inputError : {}]}
              testID="SwapAmountInput/Input"
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
            />
            {loading && (
              <View style={styles.loaderContainer}>
                <SkeletonPlaceholder
                  borderRadius={100} // ensure rounded corners with font scaling
                  backgroundColor={Colors.gray2}
                  highlightColor={Colors.white}
                  testID="SwapAmountInput/Loader"
                >
                  <View style={styles.loader} />
                </SkeletonPlaceholder>
              </View>
            )}
          </View>
          {!loading && parsedInputValue?.gt(0) && token && (
            <Text numberOfLines={1} style={styles.fiatValue} testID="SwapAmountInput/FiatValue">
              <TokenDisplay
                amount={parsedInputValue ?? 0}
                showLocalAmount
                showApprox
                errorFallback={t('swapScreen.tokenUsdValueUnknown') ?? undefined}
                tokenId={token?.tokenId}
              />
            </Text>
          )}
          {onPressMax && (
            <View style={styles.maxButtonWrapper}>
              <Touchable
                borderRadius={Spacing.Tiny4}
                onPress={() => {
                  onPressMax()
                  textInputRef.current?.blur()
                }}
                style={styles.maxButton}
                testID="SwapAmountInput/MaxButton"
              >
                <Text style={styles.maxText}>{t('max')}</Text>
              </Touchable>
            </View>
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.gray1,
    borderColor: Colors.gray2,
    borderWidth: 1,
  },
  tokenInfo: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  contentContainer: {
    height: 64,
    paddingHorizontal: Spacing.Regular16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomContainer: {
    borderColor: Colors.gray2,
    borderTopWidth: 1,
  },
  inputContainer: {
    flex: 1,
  },
  inputError: {
    color: Colors.error,
  },
  inputText: {
    ...fontStyles.h2,
    fontSize: 26,
    lineHeight: undefined,
    paddingVertical: Spacing.Smallest8,
  },
  loaderContainer: {
    paddingVertical: Spacing.Small12,
  },
  loader: {
    height: '100%',
    width: '100%',
  },
  maxButtonWrapper: {
    marginLeft: Spacing.Smallest8,
  },
  maxButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray2,
    borderRadius: Spacing.Tiny4,
    paddingVertical: Spacing.Tiny4,
    paddingHorizontal: Spacing.Tiny4,
  },
  maxText: {
    ...typeScale.labelXXSmall,
    color: Colors.gray5,
    fontSize: 10,
  },
  tokenName: {
    ...typeScale.labelSemiBoldXSmall,
    paddingHorizontal: 4,
  },
  tokenNetwork: {
    ...typeScale.bodyXSmall,
    color: Colors.gray4,
    paddingHorizontal: 4,
  },
  tokenInfoText: {
    paddingLeft: Spacing.Smallest8,
  },
  tokenNamePlaceholder: {
    ...typeScale.labelMedium,
    paddingHorizontal: 4,
    color: Colors.gray3,
  },
  fiatValue: {
    ...typeScale.bodyXSmall,
    paddingLeft: Spacing.Smallest8,
    maxWidth: '40%',
    color: Colors.gray4,
    paddingVertical: Spacing.Smallest8,
  },
})

export default SwapAmountInput
