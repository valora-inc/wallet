import { StackScreenProps } from '@react-navigation/stack'
import BigNumber from 'bignumber.js'
import qs from 'qs'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PixelRatio, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
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
import CustomHeader from 'src/components/header/CustomHeader'
import TokenDisplay, { formatValueToDisplay } from 'src/components/TokenDisplay'
import InfoIcon from 'src/icons/InfoIcon'
import LoadingSpinner from 'src/icons/LoadingSpinner'
import Times from 'src/icons/Times'
import { noHeader } from 'src/navigator/Headers'
import { navigateBack, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButton, TopBarTextButton } from 'src/navigator/TopBarButton'
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

type Props = StackScreenProps<StackParamList, Screens.SwapReviewScreen>

const TAG = 'SWAP_REVIEW_SCREEN'

export function SwapReviewScreen(props: Props) {
  const { toToken, fromToken, swapAmount, updatedField } = props.route.params
  const [swapInfo, setSwapInfo] = useState(null as any)
  const [loading, setLoading] = useState(false)
  const [fetchSwapQuoteError, setFetchSwapQuoteError] = useState(false)
  const [estimatedModalVisible, setEstimatedDialogVisible] = useState(false)
  const coreTokens = useSelector(coreTokensSelector)
  const maxSlippagePercent = `${useSelector(maxSwapSlippagePercentageSelector) / 100}`

  const { t } = useTranslation()
  const dispatch = useDispatch()

  // Token Symbols
  const toTokenSymbol = coreTokens.find((token) => token.address === toToken)?.symbol
  const fromTokenSymbol = coreTokens.find((token) => token.address === fromToken)?.symbol

  useEffect(() => {
    if (fetchSwapQuoteError) {
      dispatch(showError(ErrorMessages.FETCH_SWAP_QUOTE_FAILED))
      setTimeout(() => {
        navigateBack()
      }, 300)
    }
  }, [fetchSwapQuoteError])

  useEffect(() => {
    ValoraAnalytics.track(SwapEvents.swap_review_screen_open, {
      toToken,
      fromToken,
      swapAmount,
    })

    void getSwapInfo().then((data) => {
      setSwapInfo(data)
    })
  }, [])

  const getSwapInfo = async () => {
    try {
      setLoading(true)
      const swapAmountInWei = multiplyByWei(swapAmount[updatedField]!)
      const swapAmountParam = updatedField === Field.FROM ? 'sellAmount' : 'buyAmount'
      const params = {
        buyToken: toToken,
        sellToken: fromToken,
        [swapAmountParam]: swapAmountInWei.toString().split('.')[0],
        slippagePercentage: maxSlippagePercent,
      }
      const response = await fetch(`${networkConfig.quoteSwapUrl}${qs.stringify(params)}`)
      if (!response.ok) {
        Logger.error(TAG, `Failure response fetching token Swap: ${response}`)
        throw new Error(
          `Failure response fetching token swap quote. ${response.status}  ${response.statusText}`
        )
      }
      return await response.json()
    } catch (error) {
      setFetchSwapQuoteError(true)
      Logger.error(TAG, `Error fetching token swap quote: ${error}`)
    } finally {
      setTimeout(() => {
        setLoading(false)
      }, 300)
    }
  }

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <CustomHeader
        title={t('swapReviewScreen.title')}
        left={<BackButton />}
        // handle large text size to avoid overlaps in header
        right={
          PixelRatio.getFontScale() > 1.35 ? (
            <TopBarIconButton
              icon={<Times />}
              testID="CancelButton"
              onPress={navigateHome}
              style={{ paddingRight: Spacing.Regular16 }}
            />
          ) : (
            <TopBarTextButton
              title={t('cancel')}
              onPress={navigateHome}
              titleStyle={{ color: colors.gray4 }}
            />
          )
        }
      />
      <DisconnectBanner />
      {loading || fetchSwapQuoteError ? (
        <View style={styles.loadingContentContainer}>
          <LoadingSpinner />
        </View>
      ) : (
        <ScrollView style={styles.contentContainer}>
          <View style={styles.subContentContainer}>
            <View style={styles.tallRow}>
              <View style={styles.column}>
                <Text style={styles.label}>{t('swapReviewScreen.swapFrom')}</Text>
              </View>
              <View style={[styles.column, styles.tokenDisplayView]}>
                <TokenDisplay
                  style={styles.tokenText}
                  amount={divideByWei(swapInfo?.sellAmount)}
                  tokenAddress={fromToken}
                  showLocalAmount={false}
                  testID={'FromSwapAmountToken'}
                />
                <TokenDisplay
                  style={styles.tokenSubText}
                  amount={divideByWei(swapInfo?.sellAmount)}
                  tokenAddress={fromToken}
                  showLocalAmount={true}
                  testID={`FromSwapAmountTokenLocal`}
                />
              </View>
            </View>
            <View style={styles.tallRow}>
              <View style={styles.column}>
                <Text style={styles.label}>{t('swapReviewScreen.swapTo')}</Text>
              </View>
              <View style={[styles.column, styles.tokenDisplayView]}>
                <TokenDisplay
                  style={[styles.tokenText, { color: colors.greenUI }]}
                  amount={divideByWei(swapInfo?.buyAmount - swapInfo?.gas)}
                  tokenAddress={toToken}
                  showLocalAmount={false}
                  testID={'ToSwapAmountToken'}
                />
                <TouchableOpacity
                  style={styles.touchableRow}
                  onPress={() => setEstimatedDialogVisible(true)}
                  hitSlop={variables.iconHitslop}
                >
                  <Text style={[styles.tokenSubText, { marginRight: 4 }]}>
                    {t('swapReviewScreen.estimatedGas')}
                  </Text>
                  <InfoIcon size={12} color={colors.gray4} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.separator} />
          </View>
          <View style={styles.subContentContainer}>
            <Text style={styles.transactionDetailsLabel}>
              {t('swapReviewScreen.transactionDetails')}
            </Text>
            <View style={styles.row}>
              <View style={styles.column}>
                <Text style={styles.label}>{t('exchangeRate')}</Text>
              </View>
              <View style={styles.column}>
                <Text style={styles.transactionDetailsRightText}>
                  {`1 ${fromTokenSymbol} ≈ ${formatValueToDisplay(
                    new BigNumber(swapInfo?.price)
                  )} ${toTokenSymbol}`}
                </Text>
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.column}>
                <Text style={styles.label}>{t('swapReviewScreen.estimatedGas')}</Text>
              </View>
              <View style={[styles.column, styles.tokenDisplayView]}>
                <TokenDisplay
                  style={styles.transactionDetailsRightText}
                  amount={divideByWei(swapInfo?.gas)}
                  tokenAddress={fromToken}
                  showLocalAmount={false}
                  testID={'EstimatedGas'}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      )}
      <Button
        style={{ padding: Spacing.Regular16 }}
        onPress={() => Logger.debug('TODO Perform Swap!!!')}
        text={t('swapReviewScreen.complete')}
        size={BtnSizes.FULL}
        disabled={loading}
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
        {t('swapReviewScreen.estimatedAmountBody')}
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
    justifyContent: 'center',
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
  // Used for large text display
  column: {
    maxWidth: '50%',
  },
  tokenDisplayView: {
    justifyContent: 'space-between',
  },
  separator: {
    height: 1,
    width: '100%',
    backgroundColor: colors.gray2,
  },
  // No shared font styles for this label - done manually
  transactionDetailsRightText: {
    alignSelf: 'flex-end',
    textAlign: 'right',
    textAlignVertical: 'center',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Inter',
    fontStyle: 'normal',
  },
  touchableRow: {
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
    ...fontStyles.regular,
  },
  tokenText: {
    alignSelf: 'flex-end',
    textAlign: 'right',
    ...fontStyles.large,
  },
  tokenSubText: {
    alignSelf: 'flex-end',
    textAlign: 'right',
    ...fontStyles.small,
    color: colors.gray4,
  },
})

SwapReviewScreen.navOptions = {
  ...noHeader,
}

export default SwapReviewScreen
