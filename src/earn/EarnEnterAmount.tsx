import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { TextInput as RNTextInput, StyleSheet, Text, View } from 'react-native'
import { getNumberFormatSettings } from 'react-native-localize'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents, SendEvents } from 'src/analytics/Events'
import BackButton from 'src/components/BackButton'
import BottomSheet, { BottomSheetRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import InLineNotification, { NotificationVariant } from 'src/components/InLineNotification'
import KeyboardAwareScrollView from 'src/components/KeyboardAwareScrollView'
import KeyboardSpacer from 'src/components/KeyboardSpacer'
import TokenDisplay from 'src/components/TokenDisplay'
import TokenIcon, { IconSize } from 'src/components/TokenIcon'
import Touchable from 'src/components/Touchable'
import CustomHeader from 'src/components/header/CustomHeader'
import EarnDepositBottomSheet from 'src/earn/EarnDepositBottomSheet'
import { Card } from 'src/earn/EarnPoolInfoScreen'
import { usePrepareSupplyTransactions } from 'src/earn/prepareTransactions'
import { CICOFlow } from 'src/fiatExchanges/utils'
import InfoIcon from 'src/icons/InfoIcon'
import { LocalCurrencySymbol } from 'src/localCurrency/consts'
import { getLocalCurrencySymbol } from 'src/localCurrency/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { hooksApiUrlSelector } from 'src/positions/selectors'
import { useSelector } from 'src/redux/hooks'
import { AmountInput, ProceedArgs } from 'src/send/EnterAmount'
import { AmountEnteredIn } from 'src/send/types'
import { NETWORK_NAMES } from 'src/shared/conts'
import { getDynamicConfigParams } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { useLocalToTokenAmount, useTokenInfo, useTokenToLocalAmount } from 'src/tokens/hooks'
import { feeCurrenciesSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import Logger from 'src/utils/Logger'
import { parseInputAmount } from 'src/utils/parsing'
import { getFeeCurrencyAndAmounts } from 'src/viem/prepareTransactions'
import { walletAddressSelector } from 'src/web3/selectors'
import { isAddress } from 'viem'

type Props = NativeStackScreenProps<StackParamList, Screens.EarnEnterAmount>

const TAG = 'EarnEnterAmount'

const TOKEN_SELECTOR_BORDER_RADIUS = 100
const MAX_BORDER_RADIUS = 96
const FETCH_UPDATED_TRANSACTIONS_DEBOUNCE_TIME = 250

function EarnEnterAmount({ route }: Props) {
  const { t } = useTranslation()

  const { pool } = route.params
  const token = useTokenInfo(pool.dataProps.depositTokenId)

  if (!token) {
    throw new Error(`Token info not found for token ID ${pool.dataProps.depositTokenId}`)
  }

  const infoBottomSheetRef = useRef<BottomSheetRefType>(null)
  const reviewBottomSheetRef = useRef<BottomSheetRefType>(null)
  const tokenAmountInputRef = useRef<RNTextInput>(null)
  const localAmountInputRef = useRef<RNTextInput>(null)

  const [tokenAmountInput, setTokenAmountInput] = useState<string>('')
  const [localAmountInput, setLocalAmountInput] = useState<string>('')
  const [enteredIn, setEnteredIn] = useState<AmountEnteredIn>('token')
  // this should never be null, just adding a default to make TS happy
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol) ?? LocalCurrencySymbol.USD
  const hooksApiUrl = useSelector(hooksApiUrlSelector)

  const {
    prepareTransactionsResult,
    refreshPreparedTransactions,
    clearPreparedTransactions,
    prepareTransactionError,
    isPreparingTransactions,
  } = usePrepareSupplyTransactions()

  const walletAddress = useSelector(walletAddressSelector)

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
    })
  }

  const { decimalSeparator, groupingSeparator } = getNumberFormatSettings()
  // only allow numbers, one decimal separator, and two decimal places
  const localAmountRegex = new RegExp(
    `^(\\d+([${decimalSeparator}])?\\d{0,2}|[${decimalSeparator}]\\d{0,2}|[${decimalSeparator}])$`
  )
  // only allow numbers, one decimal separator
  const tokenAmountRegex = new RegExp(
    `^(?:\\d+[${decimalSeparator}]?\\d*|[${decimalSeparator}]\\d*|[${decimalSeparator}])$`
  )
  const parsedTokenAmount = useMemo(
    () => parseInputAmount(tokenAmountInput, decimalSeparator),
    [tokenAmountInput]
  )
  const parsedLocalAmount = useMemo(
    () =>
      parseInputAmount(
        localAmountInput.replaceAll(groupingSeparator, '').replace(localCurrencySymbol, ''),
        decimalSeparator
      ),
    [localAmountInput]
  )

  const tokenToLocal = useTokenToLocalAmount(parsedTokenAmount, token.tokenId)
  const localToToken = useLocalToTokenAmount(parsedLocalAmount, token.tokenId)
  const { tokenAmount, localAmount } = useMemo(() => {
    if (enteredIn === 'token') {
      setLocalAmountInput(
        tokenToLocal && tokenToLocal.gt(0)
          ? `${localCurrencySymbol}${tokenToLocal.toFormat(2)}` // automatically adds grouping separators
          : ''
      )
      return {
        tokenAmount: parsedTokenAmount,
        localAmount: tokenToLocal,
      }
    } else {
      setTokenAmountInput(
        localToToken && localToToken.gt(0)
          ? // no group separator for token amount, round to token.decimals and strip trailing zeros
            localToToken
              .toFormat(token.decimals, { decimalSeparator })
              .replace(new RegExp(`[${decimalSeparator}]?0+$`), '')
          : ''
      )
      return {
        tokenAmount: localToToken,
        localAmount: parsedLocalAmount,
      }
    }
  }, [tokenAmountInput, localAmountInput, enteredIn, token])

  const feeCurrencies = useSelector((state) => feeCurrenciesSelector(state, token.networkId))

  useEffect(() => {
    clearPreparedTransactions()

    if (
      !tokenAmount ||
      tokenAmount.isLessThanOrEqualTo(0) ||
      tokenAmount.isGreaterThan(token.balance)
    ) {
      return
    }
    const debouncedRefreshTransactions = setTimeout(() => {
      return handleRefreshPreparedTransactions(tokenAmount, token, feeCurrencies)
    }, FETCH_UPDATED_TRANSACTIONS_DEBOUNCE_TIME)
    return () => clearTimeout(debouncedRefreshTransactions)
  }, [tokenAmount, token])

  const { maxFeeAmount, feeCurrency } = getFeeCurrencyAndAmounts(prepareTransactionsResult)

  const isAmountLessThanBalance = tokenAmount && tokenAmount.lte(token.balance)
  const showNotEnoughBalanceForGasWarning =
    isAmountLessThanBalance &&
    prepareTransactionsResult &&
    prepareTransactionsResult.type === 'not-enough-balance-for-gas'
  const transactionIsPossible =
    isAmountLessThanBalance &&
    prepareTransactionsResult &&
    prepareTransactionsResult.type === 'possible' &&
    prepareTransactionsResult.transactions.length > 0

  const disabled =
    // Should disable if the user enters 0 or has enough balance but the transaction is not possible,
    // shouldn't disable if they enter an amount larger than their balance as they will go to add flow
    !!tokenAmount?.isZero() || !transactionIsPossible

  const onTokenAmountInputChange = (value: string) => {
    if (!value) {
      setTokenAmountInput('')
      setEnteredIn('token')
    } else {
      if (value.startsWith(decimalSeparator)) {
        value = `0${value}`
      }
      if (value.match(tokenAmountRegex)) {
        setTokenAmountInput(value)
        setEnteredIn('token')
      }
    }
  }

  const onLocalAmountInputChange = (value: string) => {
    // remove leading currency symbol and grouping separators
    if (value.startsWith(localCurrencySymbol)) {
      value = value.slice(1)
    }
    value = value.replaceAll(groupingSeparator, '')
    if (!value) {
      setLocalAmountInput('')
      setEnteredIn('local')
    } else {
      if (value.startsWith(decimalSeparator)) {
        value = `0${value}`
      }
      if (value.match(localAmountRegex)) {
        // add back currency symbol and grouping separators
        setLocalAmountInput(
          `${localCurrencySymbol}${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, groupingSeparator)
        )
        setEnteredIn('local')
      }
    }
  }

  const onMaxAmountPress = async () => {
    // eventually we may want to do something smarter here, like subtracting gas fees from the max amount if
    // this is a gas-paying token. for now, we are just showing a warning to the user prompting them to lower the amount
    // if there is not enough for gas
    setTokenAmountInput(token.balance.toFormat({ decimalSeparator }))
    setEnteredIn('token')
    tokenAmountInputRef.current?.blur()
    localAmountInputRef.current?.blur()
    AppAnalytics.track(SendEvents.max_pressed, {
      tokenId: token.tokenId,
      tokenAddress: token.address,
      networkId: token.networkId,
    })
  }

  const onPressContinue = ({ tokenAmount, token, amountEnteredIn }: ProceedArgs) => {
    AppAnalytics.track(EarnEvents.earn_enter_amount_continue_press, {
      userHasFunds: !!isAmountLessThanBalance,
      tokenAmount: tokenAmount.toString(),
      amountInUsd: tokenAmount.multipliedBy(token.priceUsd ?? 0).toFixed(2),
      amountEnteredIn,
      depositTokenId: token.tokenId,
      networkId: token.networkId,
      providerId: pool.appId,
      poolId: pool.positionId,
    })
    reviewBottomSheetRef.current?.snapToIndex(0)
  }

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <CustomHeader style={{ paddingHorizontal: Spacing.Thick24 }} left={<BackButton />} />
      <KeyboardAwareScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.inputContainer}>
          <Text style={styles.title}>{t('sendEnterAmountScreen.title')}</Text>
          <View style={styles.inputBox}>
            <View style={styles.inputRow}>
              <AmountInput
                inputRef={tokenAmountInputRef}
                inputValue={tokenAmountInput}
                onInputChange={onTokenAmountInputChange}
                inputStyle={styles.inputText}
                autoFocus
                placeholder={new BigNumber(0).toFormat(2)}
                testID="EarnEnterAmount/TokenAmountInput"
              />
              <View style={styles.tokenView} testID="EarnEnterAmount/TokenSelect">
                <>
                  <TokenIcon token={token} size={IconSize.SMALL} />
                  <Text style={styles.tokenName}>{token.symbol}</Text>
                </>
              </View>
            </View>
            <View style={styles.localAmountRow}>
              <AmountInput
                inputValue={token.priceUsd ? localAmountInput : '-'}
                onInputChange={onLocalAmountInputChange}
                inputRef={localAmountInputRef}
                inputStyle={styles.localAmount}
                placeholder={`${localCurrencySymbol}${new BigNumber(0).toFormat(2)}`}
                testID="EarnEnterAmount/LocalAmountInput"
                editable={!!token.priceUsd}
              />
              {!token.balance.isZero() && (
                <Touchable
                  borderRadius={MAX_BORDER_RADIUS}
                  onPress={onMaxAmountPress}
                  style={styles.maxTouchable}
                  testID="EarnEnterAmount/Max"
                >
                  <Text style={styles.maxText}>{t('max')}</Text>
                </Touchable>
              )}
            </View>
          </View>
          {tokenAmount && feeCurrency && maxFeeAmount && (
            <Card cardStyle={styles.card} testID="EnterAmountInfoCard">
              <View style={styles.cardLineContainer}>
                <View style={styles.cardLineLabel}>
                  <Text
                    testID="EarnEnterAmount/Deposit"
                    numberOfLines={1}
                    style={styles.depositLabel}
                  >
                    {t('earnFlow.enterAmount.deposit')}
                  </Text>
                </View>
                <View style={styles.flexShrink}>
                  <Text style={styles.depositAndEarningsCardValueText}>
                    <TokenDisplay
                      tokenId={token.tokenId}
                      testID="EarnEnterAmount/Deposit/Crypto"
                      amount={tokenAmount.toString()}
                      showLocalAmount={false}
                    />
                    <Text style={styles.gray4}>
                      {' ('}
                      <TokenDisplay
                        testID="EarnEnterAmount/Deposit/Fiat"
                        tokenId={token.tokenId}
                        amount={tokenAmount.toString()}
                        showLocalAmount={true}
                      />
                      {')'}
                    </Text>
                  </Text>
                </View>
              </View>
              <View style={styles.cardLineContainer}>
                <View style={styles.cardLineLabel}>
                  <Text numberOfLines={1} style={styles.depositLabel}>
                    {t('earnFlow.enterAmount.fees')}
                  </Text>
                  <Touchable borderRadius={24} testID={'DepositInfoIcon'}>
                    <InfoIcon size={16} color={Colors.gray3} />
                  </Touchable>
                </View>
                <View style={styles.flexShrink}>
                  <Text style={styles.depositAndEarningsCardValueText}>
                    <TokenDisplay tokenId={feeCurrency.tokenId} amount={maxFeeAmount.toString()} />
                  </Text>
                </View>
              </View>
            </Card>
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
        {!isAmountLessThanBalance && (
          <InLineNotification
            variant={NotificationVariant.Warning}
            title={t('sendEnterAmountScreen.insufficientBalanceWarning.title', {
              tokenSymbol: token.symbol,
            })}
            description={t('sendEnterAmountScreen.insufficientBalanceWarning.description', {
              tokenSymbol: token.symbol,
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
        <Button
          onPress={() =>
            tokenAmount &&
            onPressContinue({ tokenAmount, localAmount, token, amountEnteredIn: enteredIn })
          }
          text={t('earnFlow.enterAmount.continue')}
          size={BtnSizes.FULL}
          disabled={disabled}
          style={styles.continueButton}
          showLoading={isPreparingTransactions}
          testID="EarnEnterAmount/Continue"
        />
        <KeyboardSpacer />
      </KeyboardAwareScrollView>
      <InfoBottomSheet infoBottomSheetRef={infoBottomSheetRef} />
      {tokenAmount && prepareTransactionsResult?.type === 'possible' && (
        <EarnDepositBottomSheet
          forwardedRef={reviewBottomSheetRef}
          preparedTransaction={prepareTransactionsResult}
          amount={tokenAmount}
          pool={pool}
        />
      )}
    </SafeAreaView>
  )
}

function InfoBottomSheet({
  infoBottomSheetRef,
}: {
  infoBottomSheetRef: React.RefObject<BottomSheetRefType>
}) {
  const { t } = useTranslation()

  const { moreAavePoolsUrl } = getDynamicConfigParams(
    DynamicConfigs[StatsigDynamicConfigs.EARN_STABLECOIN_CONFIG]
  )
  const onPressDismiss = () => {
    infoBottomSheetRef.current?.close()
  }
  const onPressMorePools = () => {
    AppAnalytics.track(EarnEvents.earn_enter_amount_info_more_pools)
    moreAavePoolsUrl && navigate(Screens.WebViewScreen, { uri: moreAavePoolsUrl })
  }

  return (
    <BottomSheet
      forwardedRef={infoBottomSheetRef}
      title={t('earnFlow.enterAmount.infoBottomSheet.title')}
      testId={'Earn/EnterAmount/InfoBottomSheet'}
      titleStyle={styles.infoBottomSheetTitle}
    >
      <Text style={styles.infoBottomSheetText}>
        <Trans i18nKey="earnFlow.enterAmount.infoBottomSheet.description">
          <Text
            testID={'Earn/EnterAmount/InfoBottomSheet/Link'}
            onPress={onPressMorePools}
            style={styles.linkText}
          />
        </Trans>
      </Text>
      <Button
        onPress={onPressDismiss}
        text={t('earnFlow.enterAmount.infoBottomSheet.dismiss')}
        size={BtnSizes.FULL}
        type={BtnTypes.SECONDARY}
      />
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  infoBottomSheetTitle: {
    ...typeScale.titleSmall,
    color: Colors.black,
  },
  infoBottomSheetText: {
    ...typeScale.bodySmall,
    marginBottom: Spacing.Thick24,
    color: Colors.black,
  },
  linkText: {
    textDecorationLine: 'underline',
  },
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
    color: Colors.black,
  },
  inputContainer: {
    flex: 1,
  },
  continueButton: {
    paddingTop: Spacing.Regular16,
  },
  inputBox: {
    marginTop: Spacing.Large32,
    backgroundColor: Colors.gray1,
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
  inputText: {
    ...typeScale.titleMedium,
    color: Colors.black,
  },
  tokenView: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
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
    color: Colors.black,
  },
  localAmount: {
    ...typeScale.labelMedium,
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
    color: Colors.black,
  },
  warning: {
    marginTop: Spacing.Regular16,
    paddingHorizontal: Spacing.Regular16,
    borderRadius: 16,
  },
  card: {
    marginVertical: Spacing.Regular16,
  },
  cardLineContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLineLabel: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.Tiny4,
    alignItems: 'center',
    paddingRight: 20, // Prevents Icon from being cut off on long labels
    minWidth: '35%',
  },
  depositLabel: {
    ...typeScale.bodyMedium,
    color: Colors.gray4,
    flexWrap: 'wrap',
    textAlign: 'left',
  },
  flexShrink: {
    flexShrink: 1,
  },
  gray4: {
    color: Colors.gray4,
  },
  depositAndEarningsCardValueText: {
    ...typeScale.bodyMedium,
    color: Colors.black,
    flexWrap: 'wrap',
    textAlign: 'right',
  },
})

export default EarnEnterAmount
