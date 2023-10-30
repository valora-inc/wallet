import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React, { useEffect, useRef, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { showError } from 'src/alert/actions'
import { SwapEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { maxSwapSlippagePercentageSelector } from 'src/app/selectors'
import BackButton from 'src/components/BackButton'
import Button, { BtnSizes } from 'src/components/Button'
import Dialog from 'src/components/Dialog'
import LegacyTokenDisplay from 'src/components/LegacyTokenDisplay'
import { formatValueToDisplay } from 'src/components/TokenDisplay'
import Touchable from 'src/components/Touchable'
import CustomHeader from 'src/components/header/CustomHeader'
import { useFeeCurrency } from 'src/fees/hooks'
import InfoIcon from 'src/icons/InfoIcon'
import { noHeader } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import { swapUserInputSelector } from 'src/swap/selectors'
import { swapStart, swapStartPrepared } from 'src/swap/slice'
import { FetchQuoteResponse, Field } from 'src/swap/types'
import { QuoteResult } from 'src/swap/useSwapQuote'
import { celoAddressSelector, tokensByAddressSelector } from 'src/tokens/selectors'
import Logger from 'src/utils/Logger'
import { divideByWei } from 'src/utils/formatting'
import networkConfig from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'
import { getMaxGasCost } from 'src/viem/prepareTransactions'

const TAG = 'SWAP_REVIEW_SCREEN'
const initialUserInput = {
  toToken: '',
  fromToken: '',
  swapAmount: {
    [Field.FROM]: null,
    [Field.TO]: null,
  },
  updatedField: Field.TO,
}

function getFeeCurrency(quote: QuoteResult) {
  if (quote.preparedTransactions?.type !== 'possible') {
    return undefined
  }
  // The prepared transactions always use the same fee currency
  return quote.preparedTransactions.transactions[0].feeCurrency
}

type Props = NativeStackScreenProps<StackParamList, Screens.SwapReviewScreen>

export function SwapReviewScreen({ route }: Props) {
  const userInput = useSelector(swapUserInputSelector)
  const { toToken, fromToken, swapAmount, updatedField } = userInput || initialUserInput
  // Existing quote from previous screen with the new flow for viem
  const quote = route.params?.quote
  const [shouldFetch, setShouldFetch] = useState(!quote)
  const [estimatedModalVisible, setEstimatedDialogVisible] = useState(false)
  const [swapFeeModalVisible, setSwapFeeModalVisible] = useState(false)
  const [swapResponse, setSwapResponse] = useState<FetchQuoteResponse | null>(
    route.params?.quote?.rawSwapResponse ?? null
  )
  const [fetchError, setFetchError] = useState(false)
  const tokensByAddress = useSelector(tokensByAddressSelector)
  const walletAddress = useSelector(walletAddressSelector)
  const celoAddress = useSelector(celoAddressSelector)
  const feeCurrencyFromHook = useFeeCurrency()
  const feeCurrency = (quote ? getFeeCurrency(quote) : feeCurrencyFromHook) ?? celoAddress
  const quoteReceivedAtRef = useRef<number | undefined>()

  const estimateFeeAmount = () => {
    if (!feeCurrency || !swapResponse || !celoAddress || !tokensByAddress) {
      return new BigNumber(0)
    }

    const celoPriceUsd = tokensByAddress[celoAddress]?.priceUsd
    const feeCurrencyPriceUsd = tokensByAddress[feeCurrency]?.priceUsd

    if (!celoPriceUsd || !feeCurrencyPriceUsd) {
      return new BigNumber(0)
    }

    const estimatedCeloFeeAmount = divideByWei(
      new BigNumber(swapResponse.unvalidatedSwapTransaction.gas).multipliedBy(
        new BigNumber(swapResponse.unvalidatedSwapTransaction.gasPrice)
      )
    )

    if (!tokensByAddress[feeCurrency]?.priceUsd || !tokensByAddress[celoAddress]?.priceUsd) {
      return new BigNumber(0)
    }

    // This is only an estimate, we are assuming the estimated fee in non celo token
    // should be the same as the estimated fee in celo token in usd value.
    return estimatedCeloFeeAmount.dividedBy(feeCurrencyPriceUsd).multipliedBy(celoPriceUsd)
  }

  function getEstimatedMaxFee() {
    if (!feeCurrency || quote?.preparedTransactions?.type !== 'possible') {
      return new BigNumber(0)
    }
    const feeCurrencyToken = tokensByAddress[feeCurrency]
    if (!feeCurrencyToken?.priceUsd) {
      return new BigNumber(0)
    }

    return getMaxGasCost(quote.preparedTransactions.transactions)
      .shiftedBy(-feeCurrencyToken.decimals)
      .times(feeCurrencyToken.priceUsd)
  }

  const estimatedFeeAmount = quote ? getEstimatedMaxFee() : estimateFeeAmount()

  // Items set from remote config
  const maxSlippagePercent = useSelector(maxSwapSlippagePercentageSelector)

  const { t } = useTranslation()
  const dispatch = useDispatch()

  // Token Symbols
  const toTokenSymbol = tokensByAddress[toToken]?.symbol
  const fromTokenSymbol = tokensByAddress[fromToken]?.symbol

  // Decimals
  const toTokenDecimals = tokensByAddress[toToken]?.decimals ?? 0
  const fromTokenDecimals = tokensByAddress[fromToken]?.decimals ?? 0
  const swapAmountDecimals = updatedField === Field.FROM ? fromTokenDecimals : toTokenDecimals

  // BuyAmount or SellAmount
  const swapAmountParam = updatedField === Field.FROM ? 'sellAmount' : 'buyAmount'
  const swapAmountInWei = new BigNumber(swapAmount[updatedField] ?? 0).shiftedBy(swapAmountDecimals)

  useEffect(() => {
    ValoraAnalytics.track(SwapEvents.swap_review_screen_open, {
      toToken,
      fromToken,
      amount: swapAmount[updatedField],
      amountType: swapAmountParam,
    })
  }, [])

  // We refetch from the API to ensure the quote is most up to date and the user can refresh if the quote is stale
  useAsync(
    async () => {
      if (!shouldFetch) return
      const params = {
        buyToken: toToken,
        sellToken: fromToken,
        [swapAmountParam]: swapAmountInWei.toString().split('.')[0],
        // Enable when supported by 0xAPI & valora-rest-api
        // Current Support - https://docs.0x.org/0x-api-swap/advanced-topics/slippage-protection
        // slippagePercentage: maxSlippageDecimal,
        userAddress: walletAddress ?? '',
      }
      const queryParams = new URLSearchParams({ ...params }).toString()
      const requestUrl = `${networkConfig.approveSwapUrl}?${queryParams}`
      const response = await fetch(requestUrl)
      quoteReceivedAtRef.current = Date.now()
      if (!response.ok) {
        throw new Error(
          `Failure response fetching token swap quote. ${response.status}  ${response.statusText}`
        )
      }
      const json: FetchQuoteResponse = await response.json()
      setSwapResponse(json)
      setShouldFetch(false)
      setFetchError(false)
    },
    [shouldFetch],
    {
      onError: (error) => {
        setShouldFetch(false)
        setFetchError(true)
        dispatch(showError(ErrorMessages.FETCH_SWAP_QUOTE_FAILED))
        Logger.debug(TAG, 'Error while fetching swap quote', error)
      },
    }
  )

  const submitSwap = () => {
    // Check for swapResponse prior to submitting swap
    if (!swapResponse) {
      dispatch(showError(ErrorMessages.SWAP_SUBMIT_FAILED))
      Logger.error(TAG, 'No swap response found')
      return
    }

    const { estimatedPriceImpact, price, allowanceTarget } = swapResponse.unvalidatedSwapTransaction

    // Analytics for swap submission
    ValoraAnalytics.track(SwapEvents.swap_review_submit, {
      toToken,
      fromToken,
      amount: swapAmount[updatedField],
      amountType: swapAmountParam,
      usdTotal: new BigNumber(swapResponse.unvalidatedSwapTransaction[swapAmountParam])
        .shiftedBy(-swapAmountDecimals)
        .multipliedBy(swapResponse.unvalidatedSwapTransaction.price)
        .toNumber(),
      allowanceTarget,
      estimatedPriceImpact,
      price,
      provider: swapResponse.details.swapProvider,
    })

    // New flow for viem
    if (quote && userInput) {
      dispatch(
        swapStartPrepared({
          quote,
          userInput,
        })
      )
      return
    }
    // Dispatch swap submission
    if (userInput && quoteReceivedAtRef.current) {
      dispatch(
        swapStart({
          ...swapResponse,
          userInput,
          quoteReceivedAt: quoteReceivedAtRef.current,
        })
      )
    }
  }

  const fromAmountInWei = swapResponse
    ? new BigNumber(swapResponse.unvalidatedSwapTransaction.sellAmount).shiftedBy(
        -fromTokenDecimals
      )
    : 0
  const toAmountInWei = swapResponse
    ? new BigNumber(swapResponse.unvalidatedSwapTransaction.buyAmount).shiftedBy(-toTokenDecimals)
    : 0

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <CustomHeader
        style={{ paddingHorizontal: variables.contentPadding }}
        title={t('swapReviewScreen.title')}
        left={<BackButton />}
      />
      <DisconnectBanner />
      <ScrollView
        style={styles.contentContainer}
        refreshControl={
          // Pull to refresh only for the old flow
          !quote ? (
            <RefreshControl
              tintColor={colors.greenBrand}
              colors={[colors.greenBrand]}
              style={{ backgroundColor: colors.light }}
              refreshing={shouldFetch}
              onRefresh={() => setShouldFetch(true)}
            />
          ) : undefined
        }
      >
        {swapResponse !== null && (
          <>
            <View style={styles.subContentContainer}>
              <View style={styles.tallRow}>
                <Text style={styles.label}>{t('swapReviewScreen.swapFrom')}</Text>
                <View style={styles.tokenDisplayView}>
                  <LegacyTokenDisplay
                    style={styles.amountText}
                    amount={fromAmountInWei}
                    tokenAddress={fromToken}
                    showLocalAmount={false}
                    testID={'FromSwapAmountToken'}
                  />
                  <LegacyTokenDisplay
                    style={styles.amountSubText}
                    amount={fromAmountInWei}
                    tokenAddress={fromToken}
                    showLocalAmount={true}
                    testID={'FromSwapAmountTokenLocal'}
                  />
                </View>
              </View>
              <View style={styles.tallRow}>
                <Text style={styles.label}>{t('swapReviewScreen.swapTo')}</Text>
                <View style={styles.tokenDisplayView}>
                  <LegacyTokenDisplay
                    style={[styles.amountText, { color: colors.greenUI }]}
                    amount={toAmountInWei}
                    tokenAddress={toToken}
                    showLocalAmount={false}
                    testID={'ToSwapAmountToken'}
                  />
                  <Touchable
                    style={styles.touchableRow}
                    onPress={() => setEstimatedDialogVisible(true)}
                    hitSlop={variables.iconHitslop}
                  >
                    <>
                      <Text style={[styles.amountSubText, { marginRight: 4 }]}>
                        {t('swapReviewScreen.estimatedAmountTitle')}
                      </Text>
                      <InfoIcon size={12} color={colors.gray4} />
                    </>
                  </Touchable>
                </View>
              </View>
              <View style={styles.separator} />
            </View>
            <View style={styles.subContentContainer}>
              <Text style={styles.transactionDetailsLabel}>
                {t('swapReviewScreen.transactionDetails')}
              </Text>
              <View style={styles.row}>
                <Text style={styles.label}>{t('exchangeRate')}</Text>
                <Text testID="ExchangeRate" style={styles.transactionDetailsRightText}>
                  {swapAmountParam === 'buyAmount'
                    ? `${formatValueToDisplay(
                        new BigNumber(swapResponse.unvalidatedSwapTransaction.price)
                      )} ${fromTokenSymbol} ≈ 1 ${toTokenSymbol}`
                    : `1 ${fromTokenSymbol} ≈ ${formatValueToDisplay(
                        new BigNumber(swapResponse.unvalidatedSwapTransaction.price)
                      )} ${toTokenSymbol}`}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>{t('swapReviewScreen.estimatedGas')}</Text>
                <View style={styles.tokenDisplayView}>
                  <LegacyTokenDisplay
                    style={styles.transactionDetailsRightText}
                    amount={estimatedFeeAmount}
                    tokenAddress={feeCurrency}
                    showLocalAmount={false}
                    testID={'EstimatedGas'}
                  />
                </View>
              </View>
              <View style={styles.row}>
                <Touchable
                  style={styles.touchableRow}
                  onPress={() => setSwapFeeModalVisible(true)}
                  hitSlop={variables.iconHitslop}
                >
                  <>
                    <Text style={{ marginRight: 4, ...fontStyles.regular }}>
                      {t('swapReviewScreen.swapFee')}
                    </Text>
                    <InfoIcon size={12} color={colors.gray4} />
                  </>
                </Touchable>
                <Text testID={'SwapFee'} style={styles.transactionDetailsRightText}>
                  {t('swapReviewScreen.free')}
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
      <Button
        style={{ padding: Spacing.Regular16 }}
        onPress={submitSwap}
        text={t('swapReviewScreen.complete')}
        size={BtnSizes.FULL}
        disabled={shouldFetch || fetchError}
      />
      {/** Estimated amount dialog */}
      <Dialog
        title={t('swapReviewScreen.estimatedAmountTitle')}
        isVisible={estimatedModalVisible}
        actionText={t('dismiss')}
        actionPress={() => setEstimatedDialogVisible(false)}
        isActionHighlighted={false}
        onBackgroundPress={() => setEstimatedDialogVisible(false)}
      >
        {t('swapReviewScreen.estimatedAmountBody', {
          slippagePercent: maxSlippagePercent,
        })}
      </Dialog>
      {/** App fee dialog */}
      <Dialog
        title={t('swapReviewScreen.swapFeeTitle')}
        isVisible={swapFeeModalVisible}
        actionText={t('dismiss')}
        actionPress={() => setSwapFeeModalVisible(false)}
        isActionHighlighted={false}
        onBackgroundPress={() => setSwapFeeModalVisible(false)}
      >
        {t('swapReviewScreen.swapFeeBodyFree')}
      </Dialog>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.Regular16,
    flexGrow: 1,
  },
  subContentContainer: {
    paddingBottom: Spacing.Regular16,
  },
  tallRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: Spacing.Regular16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: Spacing.Smallest8,
  },
  tokenDisplayView: {
    flex: 1,
    justifyContent: 'space-between',
  },
  separator: {
    height: 1,
    width: '100%',
    backgroundColor: colors.gray2,
  },
  transactionDetailsRightText: {
    ...fontStyles.regular,
    flex: 1,
    textAlign: 'right',
    fontWeight: '400',
    lineHeight: 24,
  },
  touchableRow: {
    flex: 1,
    alignSelf: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  transactionDetailsLabel: {
    ...fontStyles.label,
    paddingBottom: Spacing.Smallest8,
    color: colors.gray4,
  },
  label: {
    flex: 1,
    ...fontStyles.regular,
  },
  amountText: {
    textAlign: 'right',
    ...fontStyles.large,
  },
  amountSubText: {
    textAlign: 'right',
    ...fontStyles.small,
    color: colors.gray4,
  },
})

SwapReviewScreen.navOptions = {
  ...noHeader,
}

export default SwapReviewScreen
