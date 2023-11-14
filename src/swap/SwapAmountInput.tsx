import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Image,
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
import Touchable from 'src/components/Touchable'
import DownArrowIcon from 'src/icons/DownArrowIcon'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { TokenBalance } from 'src/tokens/slice'

interface Props {
  label: string
  onInputChange(value: string): void
  inputValue?: string | null
  onPressMax?(): void
  onSelectToken(): void
  token?: TokenBalance
  loading: boolean
  autoFocus?: boolean
  inputError?: boolean
  style?: StyleProp<ViewStyle>
  buttonPlaceholder: string
  editable?: boolean
}

const SwapAmountInput = ({
  label,
  onInputChange,
  inputValue,
  onPressMax,
  onSelectToken,
  token,
  loading,
  autoFocus,
  inputError,
  style,
  buttonPlaceholder,
  editable = true,
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

  return (
    <View style={[styles.container, style]} testID="SwapAmountInput">
      <Text style={styles.label}>{label}</Text>
      <View style={styles.contentContainer}>
        <View style={styles.inputContainer}>
          <TextInput
            forwardedRef={textInputRef}
            onChangeText={(value) => {
              handleSetStartPosition(undefined)
              onInputChange(value)
            }}
            value={inputValue || undefined}
            placeholder="0"
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
        {onPressMax && (
          <Touchable
            borderless
            onPress={() => {
              onPressMax()
              textInputRef.current?.blur()
            }}
            style={styles.maxButton}
            testID="SwapAmountInput/MaxButton"
          >
            <Text style={styles.maxText}>{t('max')}</Text>
          </Touchable>
        )}
        <Touchable
          borderless
          onPress={onSelectToken}
          style={styles.tokenSelectButton}
          testID="SwapAmountInput/TokenSelect"
        >
          {token ? (
            <>
              <Image source={{ uri: token.imageUrl }} style={styles.tokenImage} />
              <Text style={styles.tokenName}>{token.symbol}</Text>
              <DownArrowIcon color={Colors.gray5} />
            </>
          ) : (
            <>
              <Text style={styles.tokenNamePlaceholder}>{buttonPlaceholder}</Text>
              <DownArrowIcon color={Colors.gray5} />
            </>
          )}
        </Touchable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.Regular16,
    backgroundColor: Colors.gray1,
    borderColor: Colors.gray2,
  },
  label: {
    ...fontStyles.xsmall,
    fontWeight: 'bold',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    marginRight: Spacing.Smallest8,
  },
  inputError: {
    color: Colors.warning,
  },
  inputText: {
    ...fontStyles.h2,
    fontSize: 26,
    lineHeight: undefined,
    paddingVertical: Spacing.Smallest8,
  },
  loaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    paddingVertical: Spacing.Small12,
    width: '100%',
    height: '100%',
  },
  loader: {
    height: '100%',
    width: '100%',
  },
  maxButton: {
    backgroundColor: Colors.light,
    borderWidth: 1,
    borderColor: Colors.gray2,
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 4,
    marginRight: Spacing.Smallest8,
  },
  maxText: {
    ...fontStyles.small,
    color: Colors.gray5,
    fontSize: 10,
  },
  tokenSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light,
    borderWidth: 1,
    borderColor: Colors.gray2,
    borderRadius: 100,
    paddingHorizontal: Spacing.Smallest8,
    paddingVertical: 4,
  },
  tokenName: {
    ...fontStyles.small600,
    paddingHorizontal: 4,
  },
  tokenNamePlaceholder: {
    ...fontStyles.small600,
    paddingHorizontal: 4,
    color: Colors.greenUI,
  },
  tokenImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  loadingContainer: {
    position: 'absolute',
    left: 0,
  },
})

export default SwapAmountInput
