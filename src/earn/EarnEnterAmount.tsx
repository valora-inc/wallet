import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, TextInput as RNTextInput, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents, SendEvents } from 'src/analytics/Events'
import BackButton from 'src/components/BackButton'
import BottomSheet, { BottomSheetModalRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import InLineNotification, { NotificationVariant } from 'src/components/InLineNotification'
import KeyboardAwareScrollView from 'src/components/KeyboardAwareScrollView'
import { LabelWithInfo } from 'src/components/LabelWithInfo'
import RowDivider from 'src/components/RowDivider'
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
import EarnDepositBottomSheet from 'src/earn/EarnDepositBottomSheet'
import { usePrepareEnterAmountTransactionsCallback } from 'src/earn/hooks'
import { getSwapToAmountInDecimals } from 'src/earn/utils'
import { CICOFlow } from 'src/fiatExchanges/utils'
import ArrowRightThick from 'src/icons/ArrowRightThick'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { hooksApiUrlSelector, positionsWithBalanceSelector } from 'src/positions/selectors'
import { EarnPosition, Position } from 'src/positions/types'
import { useSelector } from 'src/redux/hooks'
import EnterAmountOptions from 'src/send/EnterAmountOptions'
import { NETWORK_NAMES } from 'src/shared/conts'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { SwapTransaction } from 'src/swap/types'
import { useTokenInfo } from 'src/tokens/hooks'
import { feeCurrenciesSelector, swappableFromTokensByNetworkIdSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import Logger from 'src/utils/Logger'
import { getFeeCurrencyAndAmounts, PreparedTransactionsResult } from 'src/viem/prepareTransactions'
import { walletAddressSelector } from 'src/web3/selectors'
import { isAddress } from 'viem'

type Props = NativeStackScreenProps<StackParamList, Screens.EarnEnterAmount>

const TAG = 'EarnEnterAmount'

function useTokens({ pool }: { pool: EarnPosition }) {
  const depositToken = useTokenInfo(pool.dataProps.depositTokenId)
  const withdrawToken = useTokenInfo(pool.dataProps.withdrawTokenId)
  const swappableTokens = useSelector((state) =>
    swappableFromTokensByNetworkIdSelector(state, [pool.networkId])
  )

  const eligibleSwappableTokens = useMemo(
    () =>
      swappableTokens.filter(
        ({ tokenId, balance }) =>
          tokenId !== pool.dataProps.depositTokenId &&
          tokenId !== pool.dataProps.withdrawTokenId &&
          balance.gt(0)
      ),
    [swappableTokens, pool.dataProps.depositTokenId, pool.dataProps.withdrawTokenId]
  )

  if (!depositToken) {
    // should never happen
    throw new Error(`Token info not found for token ID ${pool.dataProps.depositTokenId}`)
  }

  if (!withdrawToken) {
    // should never happen
    throw new Error(`Token info not found for token ID ${pool.dataProps.withdrawTokenId}`)
  }

  return {
    depositToken,
    withdrawToken,
    eligibleSwappableTokens,
  }
}

export default function EarnEnterAmount({ route }: Props) {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()

  const { pool, mode = 'deposit' } = route.params
  const isWithdrawal = mode === 'withdraw'
  const { depositToken, withdrawToken, eligibleSwappableTokens } = useTokens({ pool })

  const availableInputTokens = useMemo(() => {
    switch (mode) {
      case 'deposit':
      case 'withdraw':
        return [depositToken]
      case 'swap-deposit':
      default:
        return eligibleSwappableTokens
    }
  }, [mode])

  const [inputToken, setInputToken] = useState(() => availableInputTokens[0])

  const inputRef = useRef<RNTextInput>(null)
  const bottomSheetRef = useRef<BottomSheetModalRefType>(null)
  const reviewBottomSheetRef = useRef<BottomSheetModalRefType>(null)
  const feeDetailsBottomSheetRef = useRef<BottomSheetModalRefType>(null)
  const swapDetailsBottomSheetRef = useRef<BottomSheetModalRefType>(null)

  const [maxPressed] = useState(false)
  const [selectedPercentage, setSelectedPercentage] = useState<number | null>(null)
  const hooksApiUrl = useSelector(hooksApiUrlSelector)
  const walletAddress = useSelector(walletAddressSelector)

  const {
    prepareTransactionsResult: { prepareTransactionsResult, swapTransaction } = {},
    refreshPreparedTransactions,
    clearPreparedTransactions,
    prepareTransactionError,
    isPreparingTransactions,
  } = usePrepareEnterAmountTransactionsCallback(mode)

  const {
    amount,
    setAmount,
    amountType,
    processedAmounts,
    handleAmountInputChange,
    handleToggleAmountType,
  } = useEnterAmount({
    token: inputToken,
    inputRef,
    onAmountChange: () => {
      setSelectedPercentage(null)
    },
  })

  const onOpenTokenPicker = () => {
    bottomSheetRef.current?.snapToIndex(0)
    AppAnalytics.track(SendEvents.token_dropdown_opened, {
      currentTokenId: inputToken.tokenId,
      currentTokenAddress: inputToken.address,
      currentNetworkId: inputToken.networkId,
    })
  }

  const onSelectToken: TokenBottomSheetProps['onTokenSelected'] = (selectedToken) => {
    setInputToken(selectedToken)
    setAmount('')
    bottomSheetRef.current?.close()
    // NOTE: analytics is already fired by the bottom sheet, don't need one here
  }

  const handleRefreshPreparedTransactions = (
    amount: BigNumber,
    token: TokenBalance,
    feeCurrencies: TokenBalance[]
  ) => {
    if (!walletAddress || !isAddress(walletAddress)) {
      Logger.error(TAG, 'Wallet address not set. Cannot refresh prepared transactions.')
      return
    }

    return refreshPreparedTransactions({
      amount: amount.toString(),
      token,
      walletAddress,
      feeCurrencies,
      pool,
      hooksApiUrl,
      shortcutId: mode,
      useMax: selectedPercentage === 1,
    })
  }

  // This is for withdrawals as we want the user to be able to input the amounts in the deposit token
  const { transactionToken, transactionTokenAmount } = useMemo(() => {
    const transactionToken = isWithdrawal ? withdrawToken : inputToken
    const transactionTokenAmount = isWithdrawal
      ? processedAmounts.token.bignum &&
        processedAmounts.token.bignum.dividedBy(pool.pricePerShare[0])
      : processedAmounts.token.bignum

    return {
      transactionToken,
      transactionTokenAmount,
    }
  }, [inputToken, withdrawToken, processedAmounts.token.bignum, isWithdrawal, pool])

  const balanceInInputToken = useMemo(
    () =>
      isWithdrawal
        ? transactionToken.balance.multipliedBy(pool.pricePerShare[0])
        : transactionToken.balance,
    [transactionToken, isWithdrawal, pool]
  )

  const feeCurrencies = useSelector((state) =>
    feeCurrenciesSelector(state, transactionToken.networkId)
  )

  useEffect(() => {
    clearPreparedTransactions()

    if (
      !processedAmounts.token.bignum ||
      !transactionTokenAmount ||
      processedAmounts.token.bignum.isLessThanOrEqualTo(0) ||
      processedAmounts.token.bignum.isGreaterThan(balanceInInputToken)
    ) {
      return
    }
    const debouncedRefreshTransactions = setTimeout(() => {
      return handleRefreshPreparedTransactions(
        transactionTokenAmount,
        transactionToken,
        feeCurrencies
      )
    }, FETCH_UPDATED_TRANSACTIONS_DEBOUNCE_TIME_MS)
    return () => clearTimeout(debouncedRefreshTransactions)
  }, [processedAmounts.token.bignum, mode, transactionToken, feeCurrencies])

  const { estimatedFeeAmount, feeCurrency, maxFeeAmount } =
    getFeeCurrencyAndAmounts(prepareTransactionsResult)

  const isAmountLessThanBalance =
    processedAmounts.token.bignum !== null && processedAmounts.token.bignum.lte(balanceInInputToken)
  const showLowerAmountError = processedAmounts.token.bignum && !isAmountLessThanBalance
  const showNotEnoughBalanceForGasWarning =
    isAmountLessThanBalance &&
    prepareTransactionsResult &&
    prepareTransactionsResult.type === 'not-enough-balance-for-gas'
  const transactionIsPossible =
    isAmountLessThanBalance &&
    prepareTransactionsResult &&
    prepareTransactionsResult.type === 'possible' &&
    prepareTransactionsResult.transactions.length > 0

  const allPositionsWithBalance = useSelector(positionsWithBalanceSelector)

  const rewardsPositions = useMemo(
    () =>
      allPositionsWithBalance.filter((position) =>
        pool.dataProps.rewardsPositionIds?.includes(position.positionId)
      ),
    [allPositionsWithBalance, pool.dataProps.rewardsPositionIds]
  )

  const disabled =
    // Should disable if the user enters 0, has enough balance but the transaction is not possible, or does not have enough balance
    !!processedAmounts.token.bignum?.isZero() || !transactionIsPossible

  const onSelectPercentageAmount = (percentage: number) => {
    const balance =
      amountType === 'token' ? inputToken.balance : processedAmounts.local.balance?.decimalPlaces(2)

    if (!balance) {
      return
    }

    const percentageAmount = balance.multipliedBy(percentage).toString()
    setAmount(percentageAmount)
    setSelectedPercentage(percentage)

    AppAnalytics.track(SendEvents.send_percentage_selected, {
      tokenId: inputToken.tokenId,
      tokenAddress: inputToken.address,
      networkId: inputToken.networkId,
      percentage: percentage * 100,
      flow: 'earn',
    })
  }

  const onPressContinue = () => {
    if (!processedAmounts.token.bignum || !transactionToken) {
      // should never happen
      return
    }
    AppAnalytics.track(EarnEvents.earn_enter_amount_continue_press, {
      // TokenAmount is always deposit token
      amountInUsd: processedAmounts.token.bignum.multipliedBy(inputToken.priceUsd ?? 0).toFixed(2),
      amountEnteredIn: amountType,
      depositTokenId: pool.dataProps.depositTokenId,
      networkId: inputToken.networkId,
      providerId: pool.appId,
      poolId: pool.positionId,
      fromTokenId: inputToken.tokenId,
      fromTokenAmount: processedAmounts.token.bignum.toString(),
      mode,
      depositTokenAmount: isWithdrawal
        ? undefined
        : swapTransaction
          ? getSwapToAmountInDecimals({
              swapTransaction,
              fromAmount: processedAmounts.token.bignum,
            }).toString()
          : processedAmounts.token.bignum.toString(),
    })

    if (isWithdrawal) {
      navigate(Screens.EarnConfirmationScreen, {
        pool,
        mode,
        inputAmount: processedAmounts.token.bignum.toString(),
        useMax: maxPressed,
      })
    } else {
      reviewBottomSheetRef.current?.snapToIndex(0)
    }
  }

  const dropdownEnabled = availableInputTokens.length > 1

  return (
    <SafeAreaView style={styles.safeAreaContainer} edges={['top']}>
      <CustomHeader style={{ paddingHorizontal: Spacing.Thick24 }} left={<BackButton />} />
      <KeyboardAwareScrollView
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingBottom: Math.max(insets.bottom, Spacing.Thick24),
          },
        ]}
        onScrollBeginDrag={() => {
          Keyboard.dismiss()
        }}
      >
        <View style={styles.inputContainer}>
          <Text style={styles.title}>
            {isWithdrawal
              ? t('earnFlow.enterAmount.titleWithdraw')
              : t('earnFlow.enterAmount.title')}
          </Text>
          <TokenEnterAmount
            autoFocus
            testID="EarnEnterAmount"
            token={inputToken}
            inputValue={amount}
            inputRef={inputRef}
            tokenAmount={processedAmounts.token.displayAmount}
            localAmount={processedAmounts.local.displayAmount}
            onInputChange={handleAmountInputChange}
            amountType={amountType}
            toggleAmountType={handleToggleAmountType}
            onOpenTokenPicker={dropdownEnabled ? onOpenTokenPicker : undefined}
            tokenBalance={isWithdrawal ? balanceInInputToken : inputToken.balance}
          />
          {processedAmounts.token.bignum && prepareTransactionsResult && !isWithdrawal && (
            <TransactionDepositDetails
              pool={pool}
              token={inputToken}
              tokenAmount={processedAmounts.token.bignum}
              prepareTransactionsResult={prepareTransactionsResult}
              feeDetailsBottomSheetRef={feeDetailsBottomSheetRef}
              swapDetailsBottomSheetRef={swapDetailsBottomSheetRef}
              swapTransaction={swapTransaction}
            />
          )}
          {processedAmounts.token.bignum && isWithdrawal && (
            <TransactionWithdrawDetails
              pool={pool}
              token={transactionToken}
              prepareTransactionsResult={prepareTransactionsResult}
              feeDetailsBottomSheetRef={feeDetailsBottomSheetRef}
              balanceInInputToken={balanceInInputToken}
              rewardsPositions={rewardsPositions}
            />
          )}
        </View>

        {showNotEnoughBalanceForGasWarning && (
          <InLineNotification
            variant={NotificationVariant.Warning}
            title={t('earnFlow.enterAmount.notEnoughBalanceForGasWarning.title', {
              feeTokenSymbol: prepareTransactionsResult.feeCurrencies[0].symbol,
            })}
            description={t('earnFlow.enterAmount.notEnoughBalanceForGasWarning.description', {
              feeTokenSymbol: prepareTransactionsResult.feeCurrencies[0].symbol,
              network: NETWORK_NAMES[prepareTransactionsResult.feeCurrencies[0].networkId],
            })}
            ctaLabel={t('earnFlow.enterAmount.notEnoughBalanceForGasWarning.noGasCta', {
              feeTokenSymbol: feeCurrencies[0].symbol,
              network: NETWORK_NAMES[prepareTransactionsResult.feeCurrencies[0].networkId],
            })}
            onPressCta={() => {
              AppAnalytics.track(EarnEvents.earn_deposit_add_gas_press, {
                gasTokenId: feeCurrencies[0].tokenId,
                depositTokenId: pool.dataProps.depositTokenId,
                networkId: pool.networkId,
                providerId: pool.appId,
                poolId: pool.positionId,
              })
              navigate(Screens.FiatExchangeAmount, {
                tokenId: prepareTransactionsResult.feeCurrencies[0].tokenId,
                flow: CICOFlow.CashIn,
                tokenSymbol: prepareTransactionsResult.feeCurrencies[0].symbol,
              })
            }}
            style={styles.warning}
            testID="EarnEnterAmount/NotEnoughForGasWarning"
          />
        )}
        {showLowerAmountError && (
          <InLineNotification
            variant={NotificationVariant.Warning}
            title={t('sendEnterAmountScreen.insufficientBalanceWarning.title', {
              tokenSymbol: inputToken.symbol,
            })}
            description={t('sendEnterAmountScreen.insufficientBalanceWarning.description', {
              tokenSymbol: inputToken.symbol,
            })}
            style={styles.warning}
            testID="EarnEnterAmount/NotEnoughBalanceWarning"
          />
        )}
        {prepareTransactionError && (
          <InLineNotification
            variant={NotificationVariant.Error}
            title={t('sendEnterAmountScreen.prepareTransactionError.title')}
            description={t('sendEnterAmountScreen.prepareTransactionError.description')}
            style={styles.warning}
            testID="EarnEnterAmount/PrepareTransactionError"
          />
        )}
        {isWithdrawal && pool.dataProps.withdrawalIncludesClaim && rewardsPositions.length > 0 && (
          <InLineNotification
            variant={NotificationVariant.Info}
            title={t('earnFlow.enterAmount.withdrawingAndClaimingCard.title')}
            description={t('earnFlow.enterAmount.withdrawingAndClaimingCard.description', {
              providerName: pool.appName,
            })}
            style={styles.warning}
            testID="EarnEnterAmount/WithdrawingAndClaimingCard"
          />
        )}
        <EnterAmountOptions
          onPressAmount={onSelectPercentageAmount}
          selectedAmount={selectedPercentage}
          testID="EarnEnterAmount/AmountOptions"
        />
        <Button
          onPress={onPressContinue}
          text={t('earnFlow.enterAmount.continue')}
          size={BtnSizes.FULL}
          disabled={disabled}
          style={styles.continueButton}
          showLoading={isPreparingTransactions}
          testID="EarnEnterAmount/Continue"
        />
      </KeyboardAwareScrollView>
      {processedAmounts.token.bignum && (
        <FeeDetailsBottomSheet
          forwardedRef={feeDetailsBottomSheetRef}
          testID="FeeDetailsBottomSheet"
          feeCurrency={feeCurrency}
          estimatedFeeAmount={estimatedFeeAmount}
          maxFeeAmount={maxFeeAmount}
          swapTransaction={swapTransaction}
          pool={pool}
          token={inputToken}
          tokenAmount={processedAmounts.token.bignum}
          isWithdrawal={isWithdrawal}
        />
      )}
      {swapTransaction && processedAmounts.token.bignum && (
        <SwapDetailsBottomSheet
          forwardedRef={swapDetailsBottomSheetRef}
          testID="SwapDetailsBottomSheet"
          swapTransaction={swapTransaction}
          token={inputToken}
          pool={pool}
          tokenAmount={processedAmounts.token.bignum}
          parsedTokenAmount={processedAmounts.token.bignum}
        />
      )}
      {processedAmounts.token.bignum && prepareTransactionsResult?.type === 'possible' && (
        <EarnDepositBottomSheet
          forwardedRef={reviewBottomSheetRef}
          preparedTransaction={prepareTransactionsResult}
          inputAmount={processedAmounts.token.bignum}
          pool={pool}
          mode={mode}
          swapTransaction={swapTransaction}
          inputTokenId={inputToken.tokenId}
        />
      )}
      <TokenBottomSheet
        forwardedRef={bottomSheetRef}
        origin={TokenPickerOrigin.Earn}
        onTokenSelected={onSelectToken}
        tokens={availableInputTokens}
        title={t('sendEnterAmountScreen.selectToken')}
        titleStyle={styles.title}
      />
    </SafeAreaView>
  )
}

function TransactionWithdrawDetails({
  pool,
  prepareTransactionsResult,
  feeDetailsBottomSheetRef,
  balanceInInputToken,
  rewardsPositions,
}: {
  pool: EarnPosition
  token: TokenBalance
  prepareTransactionsResult?: PreparedTransactionsResult
  feeDetailsBottomSheetRef: React.RefObject<BottomSheetModalRefType>
  balanceInInputToken: BigNumber
  rewardsPositions: Position[]
}) {
  const { t } = useTranslation()
  const { maxFeeAmount, feeCurrency } = getFeeCurrencyAndAmounts(prepareTransactionsResult)

  return (
    <View style={styles.txDetailsContainer} testID="EnterAmountWithdrawInfoCard">
      <View style={styles.txDetailsLineItem}>
        <LabelWithInfo
          label={t('earnFlow.enterAmount.available')}
          testID="LabelWithInfo/AvailableLabel"
        />
        <View style={styles.txDetailsValue}>
          <TokenDisplay
            tokenId={pool.dataProps.depositTokenId}
            testID="EarnEnterAmount/Withdraw/Fiat"
            amount={balanceInInputToken}
            showLocalAmount={true}
            style={styles.txDetailsValueText}
          />
          <Text style={[styles.txDetailsValueText, styles.gray4]}>
            {'('}
            <TokenDisplay
              testID="EarnEnterAmount/Withdraw/Crypto"
              tokenId={pool.dataProps.depositTokenId}
              amount={balanceInInputToken}
              showLocalAmount={false}
            />
            {')'}
          </Text>
        </View>
      </View>
      {pool.dataProps.withdrawalIncludesClaim &&
        rewardsPositions.map((position, index) => (
          <View key={index} style={styles.txDetailsLineItem}>
            <LabelWithInfo
              label={t('earnFlow.enterAmount.claimingReward')}
              testID={`LabelWithInfo/ClaimingReward-${index}`}
            />
            <View style={{ ...styles.txDetailsValue, flex: 1 }}>
              <TokenDisplay
                testID={`EarnEnterAmount/Reward-${index}`}
                tokenId={position.tokens[0].tokenId}
                amount={position.tokens[0].balance.toString()}
                style={styles.txDetailsValueText}
              />
              <Text style={[styles.txDetailsValueText, styles.gray4]}>
                {'('}
                <TokenDisplay
                  testID={`EarnEnterAmount/Reward-${index}-crypto`}
                  tokenId={position.tokens[0].tokenId}
                  amount={position.tokens[0].balance.toString()}
                  showLocalAmount={false}
                />
                {')'}
              </Text>
            </View>
          </View>
        ))}
      {feeCurrency && maxFeeAmount && (
        <View style={styles.txDetailsLineItem}>
          <LabelWithInfo
            label={t('earnFlow.enterAmount.fees')}
            onPress={() => {
              feeDetailsBottomSheetRef?.current?.snapToIndex(0)
            }}
            testID="LabelWithInfo/FeeLabel"
          />
          <View style={styles.txDetailsValue}>
            <TokenDisplay
              testID="EarnEnterAmount/Fees"
              tokenId={feeCurrency.tokenId}
              amount={maxFeeAmount.toString()}
              style={styles.txDetailsValueText}
            />
          </View>
        </View>
      )}
    </View>
  )
}

function TransactionDepositDetails({
  pool,
  token,
  tokenAmount,
  prepareTransactionsResult,
  swapTransaction,
  feeDetailsBottomSheetRef,
  swapDetailsBottomSheetRef,
}: {
  pool: EarnPosition
  token: TokenBalance
  tokenAmount: BigNumber
  prepareTransactionsResult: PreparedTransactionsResult
  swapTransaction?: SwapTransaction
  feeDetailsBottomSheetRef: React.RefObject<BottomSheetModalRefType>
  swapDetailsBottomSheetRef: React.RefObject<BottomSheetModalRefType>
}) {
  const { t } = useTranslation()
  const { maxFeeAmount, feeCurrency } = getFeeCurrencyAndAmounts(prepareTransactionsResult)

  const depositAmount = useMemo(
    () =>
      swapTransaction
        ? getSwapToAmountInDecimals({ swapTransaction, fromAmount: tokenAmount }).toString()
        : tokenAmount.toString(),
    [tokenAmount, swapTransaction]
  )

  return (
    feeCurrency &&
    maxFeeAmount && (
      <View style={styles.txDetailsContainer} testID="EnterAmountDepositInfoCard">
        {swapTransaction && (
          <View style={styles.txDetailsLineItem}>
            <LabelWithInfo
              label={t('earnFlow.enterAmount.swap')}
              onPress={() => {
                swapDetailsBottomSheetRef?.current?.snapToIndex(0)
              }}
              testID="LabelWithInfo/SwapLabel"
            />
            <View style={styles.txDetailsValue}>
              <TokenDisplay
                testID="EarnEnterAmount/Swap/From"
                tokenId={token.tokenId}
                amount={tokenAmount.toString()}
                showLocalAmount={false}
                style={styles.txDetailsValueText}
              />
              <ArrowRightThick size={20} color={Colors.black} />
              <TokenDisplay
                testID="EarnEnterAmount/Swap/To"
                tokenId={pool.dataProps.depositTokenId}
                amount={depositAmount}
                showLocalAmount={false}
                style={styles.txDetailsValueText}
              />
            </View>
          </View>
        )}
        <View style={styles.txDetailsLineItem}>
          <LabelWithInfo label={t('earnFlow.enterAmount.deposit')} />
          <View style={styles.txDetailsValue}>
            <TokenDisplay
              tokenId={pool.dataProps.depositTokenId}
              testID="EarnEnterAmount/Deposit/Crypto"
              amount={depositAmount}
              showLocalAmount={false}
              style={styles.txDetailsValueText}
            />
            <Text style={[styles.txDetailsValueText, styles.gray4]}>
              {'('}
              <TokenDisplay
                testID="EarnEnterAmount/Deposit/Fiat"
                tokenId={pool.dataProps.depositTokenId}
                amount={depositAmount}
                showLocalAmount={true}
              />
              {')'}
            </Text>
          </View>
        </View>
        <View style={styles.txDetailsLineItem}>
          <LabelWithInfo
            label={t('earnFlow.enterAmount.fees')}
            onPress={() => {
              feeDetailsBottomSheetRef?.current?.snapToIndex(0)
            }}
            testID="LabelWithInfo/FeeLabel"
          />
          <View style={styles.txDetailsValue}>
            <TokenDisplay
              testID="EarnEnterAmount/Fees"
              tokenId={feeCurrency.tokenId}
              // TODO: add swap fees to this amount
              amount={maxFeeAmount.toString()}
              style={styles.txDetailsValueText}
            />
          </View>
        </View>
      </View>
    )
  )
}

// Might be sharable with src/swap/FeeInfoBottomSheet.tsx
function FeeDetailsBottomSheet({
  forwardedRef,
  testID,
  feeCurrency,
  estimatedFeeAmount,
  maxFeeAmount,
  swapTransaction,
  pool,
  token,
  tokenAmount,
  isWithdrawal,
}: {
  forwardedRef: React.RefObject<BottomSheetModalRefType>
  testID: string
  feeCurrency?: TokenBalance
  estimatedFeeAmount?: BigNumber
  maxFeeAmount?: BigNumber
  swapTransaction?: SwapTransaction | undefined
  pool: EarnPosition
  token: TokenBalance
  tokenAmount: BigNumber
  isWithdrawal: boolean
}) {
  const { t } = useTranslation()
  const inputToken = useTokenInfo(pool.dataProps.depositTokenId)

  if (!inputToken) {
    // should never happen
    throw new Error(`Token info not found for token ID ${pool.dataProps.depositTokenId}`)
  }

  const swapFeeAmount = useMemo(() => {
    if (swapTransaction && swapTransaction.appFeePercentageIncludedInPrice) {
      return tokenAmount.multipliedBy(
        new BigNumber(swapTransaction.appFeePercentageIncludedInPrice).shiftedBy(-2) // To convert from percentage to decimal
      )
    }
  }, [swapTransaction, token])

  const descriptionContainerStyle = [
    styles.bottomSheetDescriptionContainer,
    !swapFeeAmount && { marginTop: Spacing.Regular16 },
  ]

  const handleClose = () => forwardedRef.current?.close()
  return (
    <BottomSheet
      forwardedRef={forwardedRef}
      title={t('earnFlow.enterAmount.feeBottomSheet.feeDetails')}
      testId={testID}
    >
      <View style={styles.bottomSheetTextContent}>
        <View style={styles.gap8}>
          <View style={styles.bottomSheetLineItem} testID="EstNetworkFee">
            <Text style={styles.bottomSheetLineLabel}>
              {t('earnFlow.enterAmount.feeBottomSheet.estNetworkFee')}
            </Text>
            {feeCurrency && estimatedFeeAmount && (
              <Text style={styles.bottomSheetLineLabelText} testID="EstNetworkFee/Value">
                {'≈ '}
                <TokenDisplay
                  tokenId={feeCurrency.tokenId}
                  amount={estimatedFeeAmount.toString()}
                />
                {' ('}
                <TokenDisplay
                  tokenId={feeCurrency.tokenId}
                  showLocalAmount={false}
                  amount={estimatedFeeAmount.toString()}
                />
                {')'}
              </Text>
            )}
          </View>
          <View style={styles.bottomSheetLineItem} testID="MaxNetworkFee">
            <Text style={styles.bottomSheetLineLabel}>
              {t('earnFlow.enterAmount.feeBottomSheet.maxNetworkFee')}
            </Text>
            {feeCurrency && maxFeeAmount && (
              <Text style={styles.bottomSheetLineLabelText} testID="MaxNetworkFee/Value">
                {'≈ '}
                <TokenDisplay tokenId={feeCurrency.tokenId} amount={maxFeeAmount.toString()} />
                {' ('}
                <TokenDisplay
                  tokenId={feeCurrency.tokenId}
                  showLocalAmount={false}
                  amount={maxFeeAmount.toString()}
                />
                {')'}
              </Text>
            )}
          </View>
        </View>
        <RowDivider />
        {swapFeeAmount && (
          <View style={styles.bottomSheetLineItem} testID="SwapFee">
            <Text style={styles.bottomSheetLineLabel}>
              {t('earnFlow.enterAmount.feeBottomSheet.appSwapFee')}
            </Text>
            <Text style={styles.bottomSheetLineLabelText} testID="SwapFee/Value">
              {'≈ '}
              <TokenDisplay tokenId={token.tokenId} amount={swapFeeAmount.toString()} />
              {' ('}
              <TokenDisplay
                tokenId={token.tokenId}
                showLocalAmount={false}
                amount={swapFeeAmount.toString()}
              />
              {')'}
            </Text>
          </View>
        )}
        <View style={descriptionContainerStyle}>
          <Text style={styles.bottomSheetDescriptionTitle}>
            {t('earnFlow.enterAmount.feeBottomSheet.moreInformation')}
          </Text>
          {swapFeeAmount ? (
            <Text style={styles.bottomSheetDescriptionText}>
              {t('earnFlow.enterAmount.feeBottomSheet.networkSwapFeeDescription', {
                appFeePercentage: swapTransaction?.appFeePercentageIncludedInPrice,
              })}
            </Text>
          ) : (
            <Text style={styles.bottomSheetDescriptionText}>
              {isWithdrawal
                ? t('earnFlow.enterAmount.feeBottomSheet.networkFeeDescriptionWithdrawal')
                : t('earnFlow.enterAmount.feeBottomSheet.networkFeeDescription')}
            </Text>
          )}
        </View>
      </View>
      <Button
        onPress={handleClose}
        text={t('earnFlow.poolInfoScreen.infoBottomSheet.gotIt')}
        size={BtnSizes.FULL}
        type={BtnTypes.SECONDARY}
        testID="FeeDetailsBottomSheet/GotIt"
      />
    </BottomSheet>
  )
}

function SwapDetailsBottomSheet({
  forwardedRef,
  testID,
  swapTransaction,
  pool,
  token,
  tokenAmount,
  parsedTokenAmount,
}: {
  forwardedRef: React.RefObject<BottomSheetModalRefType>
  testID: string
  swapTransaction: SwapTransaction
  pool: EarnPosition
  token: TokenBalance
  tokenAmount: BigNumber
  parsedTokenAmount: BigNumber
}) {
  const { t } = useTranslation()
  const inputToken = useTokenInfo(pool.dataProps.depositTokenId)

  if (!inputToken) {
    // should never happen
    throw new Error(`Token info not found for token ID ${pool.dataProps.depositTokenId}`)
  }

  const swapToAmount = useMemo(
    () => getSwapToAmountInDecimals({ swapTransaction, fromAmount: tokenAmount }).toString(),
    [tokenAmount, swapTransaction]
  )

  const handleClose = () => forwardedRef.current?.close()

  return (
    <BottomSheet
      forwardedRef={forwardedRef}
      title={t('earnFlow.enterAmount.swapBottomSheet.swapDetails')}
      testId={testID}
    >
      <View style={styles.bottomSheetTextContent}>
        <View style={styles.gap8}>
          <View style={styles.bottomSheetLineItem} testID="SwapFrom">
            <Text style={styles.bottomSheetLineLabel}>
              {t('earnFlow.enterAmount.swapBottomSheet.swapFrom')}
            </Text>
            <Text style={styles.bottomSheetLineLabelText} testID="SwapFrom/Value">
              <TokenDisplay
                tokenId={token.tokenId}
                showLocalAmount={false}
                amount={parsedTokenAmount}
              />
              {' ('}
              <TokenDisplay tokenId={token.tokenId} amount={parsedTokenAmount} />
              {')'}
            </Text>
          </View>
          <View style={styles.bottomSheetLineItem} testID="SwapTo">
            <Text style={styles.bottomSheetLineLabel}>
              {t('earnFlow.enterAmount.swapBottomSheet.swapTo')}
            </Text>
            <Text style={styles.bottomSheetLineLabelText} testID="SwapTo/Value">
              <TokenDisplay
                tokenId={inputToken.tokenId}
                showLocalAmount={false}
                amount={swapToAmount}
              />
              {' ('}
              <TokenDisplay tokenId={inputToken.tokenId} amount={swapToAmount} />
              {')'}
            </Text>
          </View>
        </View>
        <View style={styles.bottomSheetDescriptionContainer}>
          <Text style={styles.bottomSheetDescriptionTitle}>
            {t('earnFlow.enterAmount.swapBottomSheet.whySwap')}
          </Text>
          <Text style={styles.bottomSheetDescriptionText}>
            {t('earnFlow.enterAmount.swapBottomSheet.swapDescription')}
          </Text>
        </View>
      </View>
      <Button
        onPress={handleClose}
        text={t('earnFlow.poolInfoScreen.infoBottomSheet.gotIt')}
        size={BtnSizes.FULL}
        type={BtnTypes.SECONDARY}
        testID="SwapDetailsBottomSheet/GotIt"
      />
    </BottomSheet>
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
    color: Colors.black,
    marginBottom: Spacing.Thick24,
  },
  inputContainer: {
    flex: 1,
  },
  continueButton: {
    paddingTop: Spacing.Thick24,
    marginTop: 'auto',
  },
  warning: {
    marginTop: Spacing.Regular16,
    paddingHorizontal: Spacing.Regular16,
    borderRadius: 16,
  },
  txDetailsContainer: {
    marginVertical: Spacing.Regular16,
    padding: Spacing.Regular16,
    borderColor: Colors.gray2,
    borderWidth: 1,
    borderRadius: 12,
    gap: Spacing.Smallest8,
  },
  txDetailsLineItem: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  txDetailsValue: {
    flexShrink: 1,
    flexDirection: 'row',
    gap: Spacing.Tiny4,
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  txDetailsValueText: {
    ...typeScale.bodyMedium,
    color: Colors.black,
    flexWrap: 'wrap',
    textAlign: 'right',
  },
  gray4: {
    color: Colors.gray4,
  },
  gap8: {
    gap: Spacing.Smallest8,
  },
  bottomSheetDescriptionContainer: {
    gap: Spacing.Smallest8,
    marginTop: Spacing.Large32,
  },
  bottomSheetTextContent: {
    marginBottom: Spacing.XLarge48,
    marginTop: Spacing.Smallest8,
  },
  bottomSheetLineItem: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bottomSheetLineLabel: {
    maxWidth: '40%',
    textAlign: 'left',
  },
  bottomSheetLineLabelText: {
    maxWidth: '60%',
    textAlign: 'right',
  },
  bottomSheetDescriptionTitle: {
    ...typeScale.labelSemiBoldSmall,
    color: Colors.black,
  },
  bottomSheetDescriptionText: {
    ...typeScale.bodySmall,
    color: Colors.black,
  },
})
