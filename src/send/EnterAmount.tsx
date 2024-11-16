import BigNumber from 'bignumber.js'
import React, { ComponentType, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import { View } from 'react-native-animatable'
import { getNumberFormatSettings } from 'react-native-localize'
import { SafeAreaView } from 'react-native-safe-area-context'
import BackButton from 'src/components/BackButton'
import Button, { BtnSizes } from 'src/components/Button'
import InLineNotification, { NotificationVariant } from 'src/components/InLineNotification'
import KeyboardAwareScrollView from 'src/components/KeyboardAwareScrollView'
import KeyboardSpacer from 'src/components/KeyboardSpacer'
import { LabelWithInfo } from 'src/components/LabelWithInfo'
import TokenBottomSheet, { TokenPickerOrigin } from 'src/components/TokenBottomSheet'
import TokenDisplay from 'src/components/TokenDisplay'
import TokenEnterAmount, {
  FETCH_UPDATED_TRANSACTIONS_DEBOUNCE_TIME_MS,
  useEnterAmount,
} from 'src/components/TokenEnterAmount'
import CustomHeader from 'src/components/header/CustomHeader'
import { LocalCurrencySymbol } from 'src/localCurrency/consts'
import { useSelector } from 'src/redux/hooks'
import { AmountEnteredIn } from 'src/send/types'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { feeCurrenciesSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import { groupNumber } from 'src/tokens/utils'
import { parseInputAmount } from 'src/utils/parsing'
import { PreparedTransactionsResult, getFeeCurrencyAndAmounts } from 'src/viem/prepareTransactions'

function roundTokenAmount(value: string) {
  const { decimalSeparator } = getNumberFormatSettings()
  if (value === '') {
    return ''
  }

  const bigNum = parseInputAmount(value, decimalSeparator)

  if (bigNum.isLessThan(0.000001)) {
    return `<0${decimalSeparator}000001`
  }

  const grouped = groupNumber(bigNum.decimalPlaces(6).toString()).replaceAll('.', decimalSeparator)
  return grouped
}

function roundLocalAmount(value: string, localCurrencySymbol: LocalCurrencySymbol) {
  const { decimalSeparator } = getNumberFormatSettings()
  if (value === '') {
    return ''
  }

  const bigNum = parseInputAmount(value, decimalSeparator)

  if (bigNum.isLessThan(0.000001)) {
    return `<${localCurrencySymbol}0${decimalSeparator}000001`
  }

  const rounded = bigNum.isLessThan(0.01) ? bigNum.toPrecision(1) : bigNum.toFixed(2)
  const grouped = groupNumber(rounded.toString()).replaceAll('.', decimalSeparator)
  return `${localCurrencySymbol}${grouped}`
}

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

function EnterAmount({
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
  const [token, setToken] = useState<TokenBalance>(() => defaultToken ?? tokens[0])
  const feeCurrencies = useSelector((state) => feeCurrenciesSelector(state, token.networkId))
  const { maxFeeAmount, feeCurrency } = getFeeCurrencyAndAmounts(prepareTransactionsResult)
  const { tokenId: feeTokenId } = feeCurrency ?? feeCurrencies[0]

  const {
    amount,
    amountType,
    derived,
    inputRef,
    bottomSheetRef,
    handleAmountInputChange,
    handleToggleAmountType,
    onOpenTokenPicker,
    onSelectToken,
  } = useEnterAmount({
    token,
    feeCurrencies,
    onSelectToken: (token) => setToken(token),
  })

  // @ts-ignore - the max button will be restored in the next PR
  // const onMaxAmountPress = async () => {
  //   // eventually we may want to do something smarter here, like subtracting gas fees from the max amount if
  //   // this is a gas-paying token. for now, we are just showing a warning to the user prompting them to lower the amount
  //   // if there is not enough for gas
  //   setAmount(token.balance.toFormat({ decimalSeparator }))
  //   setAmountType('token')

  //   tokenAmountInputRef.current?.blur()
  //   AppAnalytics.track(SendEvents.max_pressed, {
  //     tokenId: token.tokenId,
  //     tokenAddress: token.address,
  //     networkId: token.networkId,
  //   })
  // }

  const isAmountLessThanBalance =
    derived.valueToRefreshWith && derived.valueToRefreshWith.lte(token.balance)
  const showLowerAmountError = !isAmountLessThanBalance && !disableBalanceCheck
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
    (disableBalanceCheck ? !!derived.token.bignum?.isZero() : !transactionIsPossible)

  useEffect(() => {
    onClearPreparedTransactions()

    if (
      !derived.token.bignum ||
      derived.token.bignum.isLessThanOrEqualTo(0) ||
      derived.token.bignum.isGreaterThan(token.balance)
    ) {
      return
    }
    const debouncedRefreshTransactions = setTimeout(() => {
      return onRefreshPreparedTransactions(derived.token.bignum!, token, feeCurrencies)
    }, FETCH_UPDATED_TRANSACTIONS_DEBOUNCE_TIME_MS)
    return () => clearTimeout(debouncedRefreshTransactions)
  }, [derived.token.bignum, props.token])

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <CustomHeader style={{ paddingHorizontal: Spacing.Thick24 }} left={<BackButton />} />
      <KeyboardAwareScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.title}>{t('sendEnterAmountScreen.title')}</Text>
          <TokenEnterAmount
            autoFocus
            testID="SendEnterAmount"
            token={token}
            inputValue={amount}
            inputRef={inputRef}
            tokenAmount={derived.token.readable}
            localAmount={derived.local.readable}
            onInputChange={handleAmountInputChange}
            amountType={amountType}
            toggleAmountType={handleToggleAmountType}
            onOpenTokenPicker={tokenSelectionDisabled ? undefined : onOpenTokenPicker}
          />

          {!!maxFeeAmount && (
            <View style={styles.feeContainer} testID="SendEnterAmount/Fee">
              <LabelWithInfo
                label={t('sendEnterAmountScreen.networkFeeV1_97')}
                labelStyle={{ color: Colors.gray3 }}
                testID="SendEnterAmount/FeeLabel"
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

        <ProceedComponent
          tokenAmount={derived.token.bignum}
          localAmount={derived.local.bignum}
          token={token}
          amountEnteredIn={amountType}
          onPressProceed={onPressProceed}
          disabled={disabled}
          showLoading={prepareTransactionsLoading}
        />
        <KeyboardSpacer />
      </KeyboardAwareScrollView>
      <TokenBottomSheet
        forwardedRef={bottomSheetRef}
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
    ...typeScale.titleSmall,
    marginBottom: Spacing.Thick24,
  },
  inputContainer: {
    flex: 1,
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
  feeInCryptoContainer: {
    flexShrink: 1,
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
    paddingVertical: Spacing.Thick24,
  },
  warning: {
    marginBottom: Spacing.Regular16,
    paddingHorizontal: Spacing.Regular16,
    borderRadius: 16,
  },
})

export default EnterAmount
