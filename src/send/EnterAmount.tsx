import BigNumber from 'bignumber.js'
import React, { ComponentType, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Keyboard,
  Platform,
  TextInput as RNTextInput,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
} from 'react-native'
import { View } from 'react-native-animatable'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { SendEvents } from 'src/analytics/Events'
import BackButton from 'src/components/BackButton'
import { BottomSheetModalRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes } from 'src/components/Button'
import InLineNotification, { NotificationVariant } from 'src/components/InLineNotification'
import KeyboardAwareScrollView from 'src/components/KeyboardAwareScrollView'
import { LabelWithInfo } from 'src/components/LabelWithInfo'
import TextInput from 'src/components/TextInput'
import TokenBottomSheet, {
  TokenBottomSheetProps,
  TokenPickerOrigin,
} from 'src/components/TokenBottomSheet'
import TokenDisplay from 'src/components/TokenDisplay'
import TokenEnterAmount, {
  FETCH_UPDATED_TRANSACTIONS_DEBOUNCE_TIME_MS,
  useEnterAmount,
} from 'src/components/TokenEnterAmount'
import CustomHeader from 'src/components/header/CustomHeader'
import { useSelector } from 'src/redux/hooks'
import EnterAmountOptions from 'src/send/EnterAmountOptions'
import { AmountEnteredIn } from 'src/send/types'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { feeCurrenciesSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import { PreparedTransactionsResult, getFeeCurrencyAndAmounts } from 'src/viem/prepareTransactions'

export interface ProceedArgs {
  tokenAmount: BigNumber
  localAmount: BigNumber | null
  token: TokenBalance
  amountEnteredIn: AmountEnteredIn
}

type ProceedComponentProps = Omit<ProceedArgs, 'tokenAmount'> & {
  onPressProceed(args: ProceedArgs): void
  disabled: boolean
  tokenAmount: BigNumber | null
  showLoading?: boolean
}

interface Props {
  tokens: TokenBalance[]
  defaultToken?: TokenBalance
  prepareTransactionsResult?: PreparedTransactionsResult
  prepareTransactionsLoading: boolean
  onClearPreparedTransactions(): void
  onRefreshPreparedTransactions(
    amount: BigNumber,
    token: TokenBalance,
    feeCurrencies: TokenBalance[]
  ): void
  prepareTransactionError?: Error
  tokenSelectionDisabled?: boolean
  onPressProceed(args: ProceedArgs): void
  disableProceed?: boolean
  children?: React.ReactNode
  ProceedComponent: ComponentType<ProceedComponentProps>
  disableBalanceCheck?: boolean
}

export const SendProceed = ({
  tokenAmount,
  localAmount,
  token,
  amountEnteredIn,
  disabled,
  onPressProceed,
  showLoading,
}: ProceedComponentProps) => {
  const { t } = useTranslation()
  return (
    <Button
      onPress={() =>
        tokenAmount && onPressProceed({ tokenAmount, localAmount, token, amountEnteredIn })
      }
      text={t('review')}
      style={styles.reviewButton}
      size={BtnSizes.FULL}
      disabled={disabled}
      showLoading={showLoading}
      testID="SendEnterAmount/ReviewButton"
    />
  )
}

export default function EnterAmount({
  tokens,
  defaultToken,
  prepareTransactionsLoading,
  prepareTransactionsResult,
  onClearPreparedTransactions,
  onRefreshPreparedTransactions,
  prepareTransactionError,
  tokenSelectionDisabled = false,
  onPressProceed,
  disableProceed = false,
  children,
  ProceedComponent,
  disableBalanceCheck = false,
}: Props) {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const [token, setToken] = useState<TokenBalance>(() => defaultToken ?? tokens[0])
  const [selectedPercentage, setSelectedPercentage] = useState<number | null>(null)
  const feeCurrencies = useSelector((state) => feeCurrenciesSelector(state, token.networkId))
  const { maxFeeAmount, feeCurrency } = getFeeCurrencyAndAmounts(prepareTransactionsResult)
  const { tokenId: feeTokenId } = feeCurrency ?? feeCurrencies[0]

  const inputRef = useRef<RNTextInput>(null)
  const tokenBottomSheetRef = useRef<BottomSheetModalRefType>(null)

  const {
    amount,
    amountType,
    processedAmounts,
    replaceAmount,
    handleAmountInputChange,
    handleToggleAmountType,
    handleSelectPercentageAmount,
  } = useEnterAmount({
    token,
    inputRef,
    onHandleAmountInputChange: () => {
      setSelectedPercentage(null)
    },
  })

  useEffect(() => {
    onClearPreparedTransactions()

    const canRefresh =
      processedAmounts.token.bignum &&
      processedAmounts.token.bignum.gt(0) &&
      processedAmounts.token.bignum.lte(token.balance)
    if (!canRefresh) return

    const debouncedRefreshTransactions = setTimeout(() => {
      return onRefreshPreparedTransactions(processedAmounts.token.bignum!, token, feeCurrencies)
    }, FETCH_UPDATED_TRANSACTIONS_DEBOUNCE_TIME_MS)

    return () => clearTimeout(debouncedRefreshTransactions)
  }, [processedAmounts.token.bignum?.toString(), token])

  const onOpenTokenPicker = () => {
    tokenBottomSheetRef.current?.snapToIndex(0)
    AppAnalytics.track(SendEvents.token_dropdown_opened, {
      currentTokenId: token.tokenId,
      currentTokenAddress: token.address,
      currentNetworkId: token.networkId,
    })
  }

  const onSelectToken: TokenBottomSheetProps['onTokenSelected'] = (selectedToken) => {
    setToken(selectedToken)
    replaceAmount('')
    setSelectedPercentage(null)
    tokenBottomSheetRef.current?.close()

    // NOTE: analytics is already fired by the bottom sheet, don't need one here
  }

  const onSelectPercentageAmount = (percentage: number) => {
    handleSelectPercentageAmount(percentage)
    setSelectedPercentage(percentage)

    AppAnalytics.track(SendEvents.send_percentage_selected, {
      tokenId: token.tokenId,
      tokenAddress: token.address,
      networkId: token.networkId,
      percentage: percentage * 100,
      flow: 'send',
    })
  }

  const showLowerAmountError =
    processedAmounts.token.bignum &&
    !processedAmounts.token.bignum.lte(token.balance) &&
    !disableBalanceCheck
  const showMaxAmountWarning =
    !showLowerAmountError &&
    prepareTransactionsResult &&
    prepareTransactionsResult.type === 'need-decrease-spend-amount-for-gas'
  const showNotEnoughBalanceForGasWarning =
    !showLowerAmountError &&
    prepareTransactionsResult &&
    prepareTransactionsResult.type === 'not-enough-balance-for-gas'
  const transactionIsPossible =
    !showLowerAmountError &&
    prepareTransactionsResult &&
    prepareTransactionsResult.type === 'possible' &&
    prepareTransactionsResult.transactions.length > 0

  const disabled =
    disableProceed ||
    (disableBalanceCheck ? !!processedAmounts.token.bignum?.isZero() : !transactionIsPossible)

  return (
    <SafeAreaView style={styles.safeAreaContainer} edges={['top']}>
      <CustomHeader style={{ paddingHorizontal: Spacing.Thick24 }} left={<BackButton />} />
      <KeyboardAwareScrollView
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: Math.max(insets.bottom, Spacing.Thick24) },
        ]}
        onScrollBeginDrag={() => {
          Keyboard.dismiss()
        }}
      >
        <View style={styles.inputContainer}>
          <Text style={styles.title}>{t('sendEnterAmountScreen.title')}</Text>
          <TokenEnterAmount
            autoFocus
            testID="SendEnterAmount"
            token={token}
            inputValue={amount}
            inputRef={inputRef}
            tokenAmount={processedAmounts.token.displayAmount}
            localAmount={processedAmounts.local.displayAmount}
            onInputChange={handleAmountInputChange}
            amountType={amountType}
            toggleAmountType={handleToggleAmountType}
            onOpenTokenPicker={tokenSelectionDisabled ? undefined : onOpenTokenPicker}
          />

          {!!maxFeeAmount && !!amount && (
            <View style={styles.feeContainer} testID="SendEnterAmount/Fee">
              <LabelWithInfo
                label={t('sendEnterAmountScreen.networkFeeV1_97')}
                labelStyle={{ color: Colors.gray3 }}
                testID="SendEnterAmount/FeeLabel"
                style={styles.feeLabelContainer}
              />
              <View testID="SendEnterAmount/FeeInCrypto" style={styles.feeInCryptoContainer}>
                <TokenDisplay
                  showApprox
                  showLocalAmount={false}
                  style={styles.feeValue}
                  tokenId={feeTokenId}
                  amount={maxFeeAmount}
                />
                <Text style={styles.feeValue}>
                  {'('}
                  <TokenDisplay
                    tokenId={feeTokenId}
                    amount={maxFeeAmount}
                    style={styles.feeValue}
                  />
                  {')'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {showLowerAmountError && (
          <InLineNotification
            variant={NotificationVariant.Warning}
            title={t('sendEnterAmountScreen.insufficientBalanceWarning.title', {
              tokenSymbol: token.symbol,
            })}
            description={t('sendEnterAmountScreen.insufficientBalanceWarning.description', {
              tokenSymbol: token.symbol,
            })}
            style={styles.warning}
            testID="SendEnterAmount/NotEnoughBalanceWarning"
          />
        )}
        {showMaxAmountWarning && (
          <InLineNotification
            variant={NotificationVariant.Warning}
            title={t('sendEnterAmountScreen.maxAmountWarning.title')}
            description={t('sendEnterAmountScreen.maxAmountWarning.description', {
              feeTokenSymbol: prepareTransactionsResult.feeCurrency.symbol,
            })}
            style={styles.warning}
            testID="SendEnterAmount/MaxAmountWarning"
          />
        )}
        {showNotEnoughBalanceForGasWarning && (
          <InLineNotification
            variant={NotificationVariant.Warning}
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
        {prepareTransactionError && (
          <InLineNotification
            variant={NotificationVariant.Error}
            title={t('sendEnterAmountScreen.prepareTransactionError.title')}
            description={t('sendEnterAmountScreen.prepareTransactionError.description')}
            style={styles.warning}
            testID="SendEnterAmount/PrepareTransactionError"
          />
        )}

        {children}

        <EnterAmountOptions
          onPressAmount={onSelectPercentageAmount}
          selectedAmount={selectedPercentage}
          testID="SendEnterAmount/AmountOptions"
        />

        <ProceedComponent
          tokenAmount={processedAmounts.token.bignum}
          localAmount={processedAmounts.local.bignum}
          token={token}
          amountEnteredIn={amountType}
          onPressProceed={onPressProceed}
          disabled={disabled}
          showLoading={prepareTransactionsLoading}
        />
      </KeyboardAwareScrollView>
      <TokenBottomSheet
        forwardedRef={tokenBottomSheetRef}
        snapPoints={['90%']}
        origin={TokenPickerOrigin.Send}
        onTokenSelected={onSelectToken}
        tokens={tokens}
        title={t('sendEnterAmountScreen.selectToken')}
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
    ...typeScale.titleMedium,
    marginBottom: Spacing.Thick24,
  },

  inputContainer: {
    flex: 1,
  },
  input: {
    flex: 1,
    marginRight: Spacing.Smallest8,
  },
  feeContainer: {
    marginVertical: Spacing.Regular16,
    padding: Spacing.Regular16,
    borderColor: Colors.gray2,
    borderWidth: 1,
    borderRadius: 12,
    gap: Spacing.Smallest8,
    flexDirection: 'row',
  },
  feeLabelContainer: {
    flex: 0,
    alignItems: 'flex-start',
  },
  feeInCryptoContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.Tiny4,
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  feeValue: {
    ...typeScale.bodyMedium,
    color: Colors.gray3,
    flexWrap: 'wrap',
    textAlign: 'right',
  },
  reviewButton: {
    paddingTop: Spacing.Thick24,
  },
  warning: {
    marginBottom: Spacing.Regular16,
    paddingHorizontal: Spacing.Regular16,
    borderRadius: 16,
  },
})

export function AmountInput({
  inputValue,
  onInputChange,
  inputRef,
  inputStyle,
  autoFocus,
  placeholder = '0',
  testID = 'AmountInput',
  editable = true,
}: {
  inputValue: string
  onInputChange(value: string): void
  inputRef: React.MutableRefObject<RNTextInput | null>
  inputStyle?: StyleProp<TextStyle>
  autoFocus?: boolean
  placeholder?: string
  testID?: string
  editable?: boolean
}) {
  // the startPosition and inputRef variables exist to ensure TextInput
  // displays the start of the value for long values on Android
  // https://github.com/facebook/react-native/issues/14845
  const [startPosition, setStartPosition] = useState<number | undefined>(0)

  const handleSetStartPosition = (value?: number) => {
    if (Platform.OS === 'android') {
      setStartPosition(value)
    }
  }

  return (
    <View style={styles.input}>
      <TextInput
        forwardedRef={inputRef}
        onChangeText={(value) => {
          handleSetStartPosition(undefined)
          onInputChange(value)
        }}
        editable={editable}
        value={inputValue || undefined}
        placeholder={placeholder}
        keyboardType="decimal-pad"
        // Work around for RN issue with Samsung keyboards
        // https://github.com/facebook/react-native/issues/22005
        autoCapitalize="words"
        autoFocus={autoFocus}
        // unset lineHeight to allow ellipsis on long inputs on iOS. For
        // android, ellipses doesn't work and unsetting line height causes
        // height changes when amount is entered
        inputStyle={[inputStyle, Platform.select({ ios: { lineHeight: undefined } })]}
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
      />
    </View>
  )
}
