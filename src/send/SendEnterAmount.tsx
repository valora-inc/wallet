import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React, { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform, TextInput as RNTextInput, StyleSheet, Text } from 'react-native'
import { View } from 'react-native-animatable'
import FastImage from 'react-native-fast-image'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SendEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BackButton from 'src/components/BackButton'
import { BottomSheetRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes } from 'src/components/Button'
import KeyboardAwareScrollView from 'src/components/KeyboardAwareScrollView'
import KeyboardSpacer from 'src/components/KeyboardSpacer'
import TextInput from 'src/components/TextInput'
import TokenBottomSheet, {
  TokenBalanceItemOption,
  TokenPickerOrigin,
} from 'src/components/TokenBottomSheet'
import TokenDisplay from 'src/components/TokenDisplay'
import Touchable from 'src/components/Touchable'
import CustomHeader from 'src/components/header/CustomHeader'
import { useMaxSendAmount } from 'src/fees/hooks'
import { FeeType } from 'src/fees/reducer'
import DownArrowIcon from 'src/icons/DownArrowIcon'
import { getLocalCurrencyCode, usdToLocalCurrencyRateSelector } from 'src/localCurrency/selectors'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import useSelector from 'src/redux/useSelector'
import { lastUsedTokenIdSelector } from 'src/send/selectors'
import { NETWORK_NAMES } from 'src/shared/conts'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { useTokenToLocalAmount } from 'src/tokens/hooks'
import { tokensWithNonZeroBalanceAndShowZeroBalanceSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import { getSupportedNetworkIdsForSend } from 'src/tokens/utils'

type Props = NativeStackScreenProps<StackParamList, Screens.SendEnterAmount>

const TOKEN_SELECTOR_BORDER_RADIUS = 100
const MAX_BORDER_RADIUS = 96

function SendEnterAmount({ route }: Props) {
  const { t } = useTranslation()
  const { defaultTokenIdOverride, origin, recipient, isFromScan } = route.params
  const [amount, setAmount] = useState<string>('')
  const supportedNetworkIds = getSupportedNetworkIdsForSend()
  const tokens = useSelector((state) =>
    tokensWithNonZeroBalanceAndShowZeroBalanceSelector(state, supportedNetworkIds)
  )
  const lastUsedTokenId = useSelector(lastUsedTokenIdSelector)

  const defaultToken = useMemo(() => {
    const defaultToken = tokens.find((token) => token.tokenId === defaultTokenIdOverride)
    const lastUsedToken = tokens.find((token) => token.tokenId === lastUsedTokenId)

    return defaultToken ?? lastUsedToken ?? tokens[0]
  }, [tokens, defaultTokenIdOverride, lastUsedTokenId])

  // the startPosition and textInputRef variables exist to ensure TextInput
  // displays the start of the value for long values on Android
  // https://github.com/facebook/react-native/issues/14845
  const [startPosition, setStartPosition] = useState<number | undefined>(0)
  const textInputRef = useRef<RNTextInput | null>(null)
  const tokenBottomSheetRef = useRef<BottomSheetRefType>(null)

  const [token, setToken] = useState<TokenBalance>(defaultToken)
  const maxAmount = useMaxSendAmount(token.tokenId, FeeType.SEND)

  const localCurrencyCode = useSelector(getLocalCurrencyCode)
  const localCurrencyExchangeRate = useSelector(usdToLocalCurrencyRateSelector)
  const localAmount = useTokenToLocalAmount(new BigNumber(amount), token.tokenId)

  const onTokenPickerSelect = () => {
    tokenBottomSheetRef.current?.snapToIndex(0)
    ValoraAnalytics.track(SendEvents.token_dropdown_opened, {
      currentTokenId: token.tokenId,
      currentTokenAddress: token.address,
      currentNetworkId: token.networkId,
    })
  }

  const onSelectToken = (token: TokenBalance) => {
    setToken(token)
    tokenBottomSheetRef.current?.close()
    // NOTE: analytics is already fired by the bottom sheet, don't need one here
  }

  const onMaxAmountPress = () => {
    setAmount(maxAmount.toString())
    textInputRef.current?.blur()
    ValoraAnalytics.track(SendEvents.max_pressed, {
      tokenId: token.tokenId,
      tokenAddress: token.address,
      networkId: token.networkId,
    })
  }

  const onReviewPress = () => {
    // TODO(ACT-943): navigate to send confirmation screen once validation is
    // done
    ValoraAnalytics.track(SendEvents.send_amount_continue, {
      origin,
      isScan: isFromScan,
      recipientType: recipient.recipientType,
      localCurrencyExchangeRate,
      localCurrency: localCurrencyCode,
      localCurrencyAmount: localAmount?.toString() ?? null,
      underlyingTokenAddress: token.address,
      underlyingTokenSymbol: token.symbol,
      underlyingAmount: amount.toString(),
      amountInUsd: null,
      tokenId: token.tokenId,
      networkId: token.networkId,
    })
  }

  const handleSetStartPosition = (value?: number) => {
    if (Platform.OS === 'android') {
      setStartPosition(value)
    }
  }

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <CustomHeader style={{ paddingHorizontal: Spacing.Thick24 }} left={<BackButton />} />
      <KeyboardAwareScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>{t('sendEnterAmountScreen.title')}</Text>
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TextInput
              forwardedRef={textInputRef}
              onChangeText={(value) => {
                handleSetStartPosition(undefined)
                if (!value) {
                  setAmount('')
                } else {
                  setAmount(
                    (prev) => value.match(/^(?:\d+[.,]?\d*|[.,]\d*|[.,])$/)?.join('') ?? prev
                  )
                }
              }}
              value={amount}
              placeholder="0"
              // hide input when loading to prevent the UI height from jumping
              style={styles.input}
              keyboardType="decimal-pad"
              // Work around for RN issue with Samsung keyboards
              // https://github.com/facebook/react-native/issues/22005
              autoCapitalize="words"
              autoFocus={true}
              // unset lineHeight to allow ellipsis on long inputs on iOS. For
              // android, ellipses doesn't work and unsetting line height causes
              // height changes when amount is entered
              inputStyle={[styles.inputText, Platform.select({ ios: { lineHeight: undefined } })]}
              testID="SendEnterAmount/Input"
              onBlur={() => {
                handleSetStartPosition(0)
              }}
              onFocus={() => {
                handleSetStartPosition(amount?.length ?? 0)
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
            <Touchable
              borderRadius={TOKEN_SELECTOR_BORDER_RADIUS}
              onPress={onTokenPickerSelect}
              style={styles.tokenSelectButton}
              testID="SendEnterAmount/TokenSelect"
            >
              <>
                <FastImage source={{ uri: token.imageUrl }} style={styles.tokenImage} />
                <Text style={styles.tokenName}>{token.symbol}</Text>
                <DownArrowIcon color={Colors.gray5} />
              </>
            </Touchable>
          </View>
          <View style={styles.localAmountRow}>
            <TokenDisplay
              amount={amount || '0'}
              tokenId={token.tokenId}
              style={styles.localAmount}
              testID="SendEnterAmount/LocalAmount"
            />
            <Touchable
              borderRadius={MAX_BORDER_RADIUS}
              onPress={onMaxAmountPress}
              style={styles.maxTouchable}
              testID="SendEnterAmount/Max"
            >
              <Text style={styles.maxText}>{t('max')}</Text>
            </Touchable>
          </View>
        </View>
        <View style={styles.feeContainer}>
          <Text style={styles.feeLabel}>
            {t('sendEnterAmountScreen.networkFee', { networkName: NETWORK_NAMES[token.networkId] })}
          </Text>
          {/* TODO(ACT-958): Display estimated fees */}
          <View style={styles.feeAmountContainer}>
            <View style={styles.feeInCryptoContainer}>
              <Text style={styles.feeInCrypto}>~</Text>
              <TokenDisplay
                tokenId={`${token.networkId}:native`}
                amount={0.005}
                showLocalAmount={false}
                style={styles.feeInCrypto}
              />
            </View>
            <TokenDisplay
              tokenId={`${token.networkId}:native`}
              amount={0.005}
              style={styles.feeInFiat}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>
      <Button
        onPress={onReviewPress}
        text={t('review')}
        style={styles.reviewButton}
        size={BtnSizes.FULL}
        fontStyle={styles.reviewButtonText}
      />
      <KeyboardSpacer />
      <TokenBottomSheet
        forwardedRef={tokenBottomSheetRef}
        snapPoints={['90%']}
        origin={TokenPickerOrigin.Send}
        onTokenSelected={onSelectToken}
        tokens={tokens}
        title={t('sendEnterAmountScreen.selectToken')}
        TokenOptionComponent={TokenBalanceItemOption}
        titleStyle={styles.title}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.Thick24,
  },
  title: {
    ...typeScale.titleSmall,
  },
  inputContainer: {
    marginTop: Spacing.Large32,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderRadius: 16,
    borderColor: Colors.gray2,
    flex: 1,
  },
  inputRow: {
    marginLeft: Spacing.Regular16,
    paddingRight: Spacing.Regular16,
    paddingBottom: Spacing.Regular16,
    paddingTop: Spacing.Smallest8,
    borderBottomColor: Colors.gray2,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  localAmountRow: {
    margin: Spacing.Regular16,
    marginTop: Spacing.Thick24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    marginRight: Spacing.Smallest8,
  },
  inputText: {
    ...typeScale.titleMedium,
  },
  tokenSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light,
    borderWidth: 1,
    borderColor: Colors.gray2,
    borderRadius: TOKEN_SELECTOR_BORDER_RADIUS,
    paddingHorizontal: Spacing.Smallest8,
    paddingVertical: Spacing.Tiny4,
  },
  tokenName: {
    ...typeScale.labelSmall,
    paddingLeft: Spacing.Tiny4,
    paddingRight: Spacing.Smallest8,
  },
  tokenImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  localAmount: {
    ...typeScale.labelMedium,
    flex: 1,
  },
  maxTouchable: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.gray2,
    borderWidth: 1,
    borderColor: Colors.gray2,
    borderRadius: MAX_BORDER_RADIUS,
  },
  maxText: {
    ...typeScale.labelSmall,
  },
  feeContainer: {
    flexDirection: 'row',
    marginTop: 18,
  },
  feeLabel: {
    flex: 1,
    ...typeScale.bodyXSmall,
    color: Colors.gray4,
    paddingLeft: 2,
  },
  feeAmountContainer: {
    alignItems: 'flex-end',
    paddingRight: 2,
  },
  feeInCryptoContainer: {
    flexDirection: 'row',
  },
  feeInCrypto: {
    color: Colors.gray4,
    ...typeScale.labelXSmall,
  },
  feeInFiat: {
    color: Colors.gray4,
    ...typeScale.bodyXSmall,
  },
  reviewButton: {
    padding: Spacing.Thick24,
  },
  reviewButtonText: {
    ...typeScale.semiBoldMedium,
  },
})

export default SendEnterAmount
