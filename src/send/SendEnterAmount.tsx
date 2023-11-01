import { parseInputAmount } from '@celo/utils/lib/parsing'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput as RNTextInput,
} from 'react-native'
import { View } from 'react-native-animatable'
import FastImage from 'react-native-fast-image'
import { getNumberFormatSettings } from 'react-native-localize'
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
import Warning from 'src/components/Warning'
import CustomHeader from 'src/components/header/CustomHeader'
import { useFeeCurrencies, useMaxSendAmount } from 'src/fees/hooks'
import { FeeType } from 'src/fees/reducer'
import DownArrowIcon from 'src/icons/DownArrowIcon'
import { getLocalCurrencyCode, usdToLocalCurrencyRateSelector } from 'src/localCurrency/selectors'
import { navigate } from 'src/navigator/NavigationService'
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
import { isDekRegisteredSelector, walletAddressSelector } from 'src/web3/selectors'
import { usePrepareSendTransactions } from 'src/send/usePrepareSendTransactions'
import Logger from 'src/utils/Logger'

type Props = NativeStackScreenProps<StackParamList, Screens.SendEnterAmount>

const TOKEN_SELECTOR_BORDER_RADIUS = 100
const MAX_BORDER_RADIUS = 96

const TAG = 'SendEnterAmount'

const FETCH_UPDATED_TRANSACTIONS_DEBOUNCE_TIME = 250

enum FeeEstimateStatus {
  Loading = 'Loading',
  ShowAmounts = 'ShowAmounts',
  ShowPlaceholder = 'ShowPlaceholder',
}

// just exported for testing
export function SendEnterAmountFeeSection({
  feeEstimateStatus,
  feeAmount,
  feeCurrency,
}: {
  feeEstimateStatus: FeeEstimateStatus
  feeAmount: BigNumber | undefined
  feeCurrency: TokenBalance
}) {
  const { tokenId: feeTokenId, symbol: feeTokenSymbol } = feeCurrency

  const feePlaceholder = (
    <>
      <Text testID="SendEnterAmount/FeePlaceholder" style={styles.feeInCrypto}>
        ~ {feeTokenSymbol}
      </Text>
    </>
  )
  const feeLoading = (
    <>
      <View testID="SendEnterAmount/FeeLoading" style={styles.feeInCryptoContainer}>
        <Text style={styles.feeInCrypto}>{'≈ '}</Text>
        <ActivityIndicator size="small" color={Colors.gray4} />
      </View>
    </>
  )
  switch (feeEstimateStatus) {
    case FeeEstimateStatus.ShowAmounts:
      if (!feeAmount) {
        // Case where user had fee estimate, then changed the amount. our useEffect hook updating the fee estimate
        //  status has not run yet.
        Logger.error(TAG, 'Fee estimate status is ShowAmounts, but feeAmount is undefined')
        return feeLoading
      }
      return (
        <>
          <View testID="SendEnterAmount/FeeInCrypto" style={styles.feeInCryptoContainer}>
            <Text style={styles.feeInCrypto}>~</Text>
            <TokenDisplay
              tokenId={feeTokenId}
              amount={feeAmount}
              showLocalAmount={false}
              style={styles.feeInCrypto}
            />
          </View>
          <TokenDisplay tokenId={feeTokenId} amount={feeAmount} style={styles.feeInFiat} />
        </>
      )
    case FeeEstimateStatus.Loading:
      return feeLoading
    case FeeEstimateStatus.ShowPlaceholder:
      return feePlaceholder
    default:
      const assertNever: never = feeEstimateStatus // should catch unhandled fee estimate status at compile time
      Logger.error(TAG, `Unhandled feeEstimateStatus: ${assertNever}`)
      return feePlaceholder
  }
}

function SendEnterAmount({ route }: Props) {
  const { t } = useTranslation()
  const { defaultTokenIdOverride, origin, recipient, isFromScan } = route.params
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
  const [amount, setAmount] = useState<string>('')
  const maxAmount = useMaxSendAmount(token.tokenId, FeeType.SEND) // TODO(ACT-946): update to use viem (via prepareTransactions)

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
    // TODO(ACT-955): pass fees as props for confirmation screen
    navigate(Screens.SendConfirmation, {
      origin,
      isFromScan,
      transactionData: {
        tokenId: token.tokenId,
        recipient,
        inputAmount: parsedAmount,
        amountIsInLocalCurrency: false,
        tokenAddress: token.address!,
        tokenAmount: parsedAmount,
      },
    })
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

  const { decimalSeparator } = getNumberFormatSettings()
  const parsedAmount = useMemo(() => parseInputAmount(amount, decimalSeparator), [amount])

  const {
    prepareTransactionsResult,
    prepareTransactionsLoading,
    feeCurrency,
    feeAmount,
    refreshPreparedTransactions,
    clearPreparedTransactions,
  } = usePrepareSendTransactions()

  const isDekRegistered = useSelector(isDekRegisteredSelector) ?? false
  const walletAddress = useSelector(walletAddressSelector)
  const feeCurrencies = useFeeCurrencies(token.networkId)
  useEffect(() => {
    if (!walletAddress) {
      Logger.error(TAG, 'Wallet address not set. Cannot refresh prepared transactions.')
      return
    }
    clearPreparedTransactions()
    if (parsedAmount.isLessThanOrEqualTo(0) || parsedAmount.isGreaterThan(token.balance)) {
      return
    }
    const debouncedRefreshTransactions = setTimeout(() => {
      return refreshPreparedTransactions({
        amount: parsedAmount,
        token,
        recipientAddress: recipient.address,
        walletAddress,
        isDekRegistered,
        feeCurrencies,
      })
    }, FETCH_UPDATED_TRANSACTIONS_DEBOUNCE_TIME)
    return () => clearTimeout(debouncedRefreshTransactions)
  }, [parsedAmount, token])

  const showLowerAmountError = token.balance.lt(amount)
  const showMaxAmountWarning =
    !showLowerAmountError &&
    prepareTransactionsResult &&
    prepareTransactionsResult.type === 'need-decrease-spend-amount-for-gas'
  const showNotEnoughBalanceForGasWarning =
    !showLowerAmountError &&
    prepareTransactionsResult &&
    prepareTransactionsResult.type === 'not-enough-balance-for-gas'
  const sendIsPossible =
    !showLowerAmountError &&
    prepareTransactionsResult &&
    prepareTransactionsResult.type === 'possible' &&
    prepareTransactionsResult.transactions.length > 0

  const [feeEstimateStatus, setFeeEstimateStatus] = useState(
    amount === '' ? FeeEstimateStatus.ShowPlaceholder : FeeEstimateStatus.Loading
  )
  useEffect(() => {
    if (
      amount === '' ||
      showLowerAmountError ||
      showNotEnoughBalanceForGasWarning ||
      showMaxAmountWarning
    ) {
      setFeeEstimateStatus(FeeEstimateStatus.ShowPlaceholder)
      return
    }
    if (prepareTransactionsLoading) {
      setFeeEstimateStatus(FeeEstimateStatus.Loading)
      return
    }
    if (feeAmount) {
      setFeeEstimateStatus(FeeEstimateStatus.ShowAmounts)
      return
    }
  }, [prepareTransactionsLoading, feeAmount, prepareTransactionsResult])

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <CustomHeader style={{ paddingHorizontal: Spacing.Thick24 }} left={<BackButton />} />
      <KeyboardAwareScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.title}>{t('sendEnterAmountScreen.title')}</Text>
          <View style={styles.inputBox}>
            <View style={styles.inputRow}>
              <TextInput
                forwardedRef={textInputRef}
                onChangeText={(value) => {
                  handleSetStartPosition(undefined)
                  if (!value) {
                    setAmount('')
                  } else {
                    if (value.startsWith(decimalSeparator)) {
                      value = `0${value}`
                    }
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
                inputStyle={[
                  styles.inputText,
                  Platform.select({ ios: { lineHeight: undefined } }),
                  showLowerAmountError && { color: Colors.warning },
                ]}
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
            {showLowerAmountError && (
              <Text testID="SendEnterAmount/LowerAmountError" style={styles.lowerAmountError}>
                {t('sendEnterAmountScreen.lowerAmount')}
              </Text>
            )}
            <View style={styles.localAmountRow}>
              <TokenDisplay
                amount={parsedAmount}
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
              {t('sendEnterAmountScreen.networkFee', {
                networkName: NETWORK_NAMES[token.networkId],
              })}
            </Text>
            <View style={styles.feeAmountContainer}>
              <SendEnterAmountFeeSection
                feeAmount={feeAmount}
                feeCurrency={
                  feeCurrency ?? feeCurrencies[0]
                  /* even if transactions are not prepared, give users a preview of what currency they might be paying fees in */
                }
                feeEstimateStatus={feeEstimateStatus}
              />
            </View>
          </View>
        </View>
        {showMaxAmountWarning && (
          <Warning
            title={t('sendEnterAmountScreen.maxAmountWarning.title')}
            description={t('sendEnterAmountScreen.maxAmountWarning.description', {
              feeTokenSymbol: prepareTransactionsResult.feeCurrency.symbol,
            })}
            style={styles.warning}
            testID="SendEnterAmount/MaxAmountWarning"
          />
        )}
        {showNotEnoughBalanceForGasWarning && (
          <Warning
            title={t('sendEnterAmountScreen.notEnoughBalanceForGasWarning.title', {
              feeTokenSymbol: prepareTransactionsResult.feeCurrencies[0].symbol,
            })}
            description={t('sendEnterAmountScreen.notEnoughBalanceForGasWarning.description', {
              feeTokenSymbol: prepareTransactionsResult.feeCurrencies[0].symbol,
            })}
            style={styles.warning}
            testID="SendEnterAmount/NotEnoughForGasWarning"
          />
        )}
        <Button
          onPress={onReviewPress}
          text={t('review')}
          style={styles.reviewButton}
          size={BtnSizes.FULL}
          fontStyle={styles.reviewButtonText}
          disabled={!sendIsPossible}
          testID="SendEnterAmount/ReviewButton"
        />
        <KeyboardSpacer />
      </KeyboardAwareScrollView>
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
    paddingHorizontal: Spacing.Thick24,
    paddingTop: Spacing.Thick24,
    flexGrow: 1,
  },
  title: {
    ...typeScale.titleSmall,
  },
  inputContainer: {
    flex: 1,
  },
  inputBox: {
    marginTop: Spacing.Large32,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderRadius: 16,
    borderColor: Colors.gray2,
  },
  inputRow: {
    paddingHorizontal: Spacing.Regular16,
    paddingTop: Spacing.Smallest8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  localAmountRow: {
    marginTop: Spacing.Thick24,
    marginLeft: Spacing.Regular16,
    paddingRight: Spacing.Regular16,
    paddingBottom: Spacing.Regular16,
    paddingTop: Spacing.Thick24,
    borderTopColor: Colors.gray2,
    borderTopWidth: 1,
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
    paddingVertical: Spacing.Thick24,
  },
  reviewButtonText: {
    ...typeScale.semiBoldMedium,
  },
  lowerAmountError: {
    color: Colors.warning,
    ...typeScale.labelXSmall,
    paddingLeft: Spacing.Regular16,
  },
  warning: {
    marginTop: Spacing.Regular16,
    marginBottom: Spacing.Smallest8,
    paddingHorizontal: Spacing.Regular16,
    borderRadius: 16,
  },
})

export default SendEnterAmount
