import { StackScreenProps } from '@react-navigation/stack'
import BigNumber from 'bignumber.js'
import React, { useEffect, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { showError } from 'src/alert/actions'
import { SwapEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import {
  maxSwapSlippagePercentageSelector,
  swapFeeEnabledSelector,
  swapFeePercentageSelector,
} from 'src/app/selectors'
import BackButton from 'src/components/BackButton'
import Button, { BtnSizes } from 'src/components/Button'
import Dialog from 'src/components/Dialog'
import CustomHeader from 'src/components/header/CustomHeader'
import TokenDisplay, { formatValueToDisplay } from 'src/components/TokenDisplay'
import Touchable from 'src/components/Touchable'
import InfoIcon from 'src/icons/InfoIcon'
import { noHeader } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import { Field } from 'src/swap/useSwapQuote'
import { coreTokensSelector } from 'src/tokens/selectors'
import { divideByWei, multiplyByWei } from 'src/utils/formatting'
import Logger from 'src/utils/Logger'
import networkConfig from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'

type Props = StackScreenProps<StackParamList, Screens.SwapReviewScreen>

const TAG = 'SWAP_REVIEW_SCREEN'

interface SwapInfo {
  unvalidatedSwapTransaction: {
    sellToken: string
    buyToken: string
    buyAmount: string
    sellAmount: string
    price: string
    gas: string
    gasPrice: string
  }
}

export function SwapReviewScreen(props: Props) {
  const { toToken, fromToken, swapAmount, updatedField } = props.route.params
  const [shouldFetch, setShouldFetch] = useState(true)
  const [estimatedModalVisible, setEstimatedDialogVisible] = useState(false)
  const [swapFeeModalVisible, setSwapFeeModalVisible] = useState(false)
  const [swapInfo, setSwapInfo] = useState<SwapInfo | null>(null)
  const [fetchError, setFetchError] = useState(false)
  const coreTokens = useSelector(coreTokensSelector)
  const walletAddress = useSelector(walletAddressSelector)

  // Items set for remote config
  const maxSlippagePercent = useSelector(maxSwapSlippagePercentageSelector)
  const swapFeeEnabled = useSelector(swapFeeEnabledSelector)
  const swapFeePercentage = useSelector(swapFeePercentageSelector)

  // Remote configs converted to decimals strings
  // const maxSlippageDecimal = `${maxSlippagePercent / 100}`
  const swapFeeDecimal = `${swapFeePercentage / 100}`

  const { t } = useTranslation()
  const dispatch = useDispatch()

  // Token Symbols
  const toTokenSymbol = coreTokens.find((token) => token.address === toToken)?.symbol
  const fromTokenSymbol = coreTokens.find((token) => token.address === fromToken)?.symbol

  useEffect(() => {
    ValoraAnalytics.track(SwapEvents.swap_review_screen_open, {
      toToken,
      fromToken,
      buyAmount: swapAmount[Field.TO] ?? '',
    })
  }, [])

  useAsync(
    async () => {
      if (!shouldFetch) return
      const swapAmountInWei = multiplyByWei(swapAmount[updatedField]!)
      const swapAmountParam = updatedField === Field.FROM ? 'sellAmount' : 'buyAmount'
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
      if (!response.ok) {
        throw new Error(
          `Failure response fetching token swap quote. ${response.status}  ${response.statusText}`
        )
      }
      setSwapInfo(await response.json())
      setShouldFetch(false)
      setFetchError(false)
    },
    [shouldFetch],
    {
      onError: (error) => {
        setShouldFetch(false)
        setFetchError(true)
        dispatch(showError(ErrorMessages.FETCH_SWAP_QUOTE_FAILED))
        Logger.debug(TAG, 'Error while fetching transactions', error)
      },
    }
  )

  const submitSwap = () => {
    // Check for swapInfo prior to submitting swap
    if (!swapInfo) return
    // Analytics for swap submission
    ValoraAnalytics.track(SwapEvents.swap_review_submit, {
      toToken,
      fromToken,
      // TODO: Add fee to total when enabled
      usdTotal: +divideByWei(swapInfo.unvalidatedSwapTransaction.buyAmount).multipliedBy(
        swapInfo.unvalidatedSwapTransaction.price
      ),
      fee: +divideByWei(swapInfo.unvalidatedSwapTransaction.sellAmount).multipliedBy(
        swapFeeDecimal
      ),
    })
    // TODO: dispatch swap submission
  }

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <CustomHeader title={t('swapReviewScreen.title')} left={<BackButton />} />
      <DisconnectBanner />
      {shouldFetch && swapInfo === null ? (
        <View style={styles.loadingContentContainer}>
          <ActivityIndicator
            size="large"
            color={colors.greenBrand}
            testID="SwapReviewScreen/loading"
          />
        </View>
      ) : (
        <ScrollView
          style={styles.contentContainer}
          refreshControl={
            <RefreshControl
              tintColor="transparent"
              colors={['transparent']}
              style={{ backgroundColor: 'transparent' }}
              refreshing={shouldFetch}
              onRefresh={() => setShouldFetch(true)}
            />
          }
        >
          {shouldFetch && (
            <View style={styles.loadingContentContainer}>
              <ActivityIndicator
                size="large"
                color={colors.greenBrand}
                testID="SwapReviewScreen/loading"
              />
            </View>
          )}
          {swapInfo !== null && (
            <>
              <View style={styles.subContentContainer}>
                <View style={styles.tallRow}>
                  <Text style={styles.label}>{t('swapReviewScreen.swapFrom')}</Text>
                  <View style={styles.tokenDisplayView}>
                    <TokenDisplay
                      style={styles.amountText}
                      amount={divideByWei(swapInfo.unvalidatedSwapTransaction.sellAmount)}
                      tokenAddress={fromToken}
                      showLocalAmount={false}
                      testID={'FromSwapAmountToken'}
                    />
                    <TokenDisplay
                      style={styles.amountSubText}
                      amount={divideByWei(swapInfo.unvalidatedSwapTransaction.sellAmount)}
                      tokenAddress={fromToken}
                      showLocalAmount={true}
                      testID={`FromSwapAmountTokenLocal`}
                    />
                  </View>
                </View>
                <View style={styles.tallRow}>
                  <Text style={styles.label}>{t('swapReviewScreen.swapTo')}</Text>
                  <View style={styles.tokenDisplayView}>
                    <TokenDisplay
                      style={[styles.amountText, { color: colors.greenUI }]}
                      amount={divideByWei(
                        new BigNumber(swapInfo.unvalidatedSwapTransaction.buyAmount).minus(
                          new BigNumber(swapInfo.unvalidatedSwapTransaction.gas)
                        )
                      )}
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
                  <Text style={styles.transactionDetailsRightText}>
                    {`1 ${fromTokenSymbol} ≈ ${formatValueToDisplay(
                      new BigNumber(swapInfo.unvalidatedSwapTransaction.price)
                    )} ${toTokenSymbol}`}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>{t('swapReviewScreen.estimatedGas')}</Text>
                  <View style={styles.tokenDisplayView}>
                    <TokenDisplay
                      style={styles.transactionDetailsRightText}
                      amount={divideByWei(
                        new BigNumber(swapInfo.unvalidatedSwapTransaction.gas).multipliedBy(
                          new BigNumber(swapInfo.unvalidatedSwapTransaction.gasPrice)
                        )
                      )}
                      tokenAddress={fromToken}
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
                  <TokenDisplay
                    style={[
                      styles.transactionDetailsRightText,
                      !swapFeeEnabled && styles.feeWaived,
                    ]}
                    amount={divideByWei(
                      swapInfo.unvalidatedSwapTransaction.sellAmount
                    ).multipliedBy(swapFeeDecimal)}
                    tokenAddress={fromToken}
                    showLocalAmount={true}
                    testID={'SwapFee'}
                  />
                </View>
              </View>
            </>
          )}
        </ScrollView>
      )}
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
        {t('swapReviewScreen.swapFeeBody', {
          swapFee: swapFeePercentage,
        })}
      </Dialog>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
  },
  loadingContentContainer: {
    alignItems: 'center',
    padding: Spacing.Regular16,
    flexGrow: 1,
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
    alignSelf: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  feeWaived: {
    textDecorationLine: 'line-through',
    textDecorationStyle: 'solid',
  },
})

SwapReviewScreen.navOptions = {
  ...noHeader,
}

export default SwapReviewScreen
