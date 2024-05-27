import BigNumber from 'bignumber.js'
import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { SwapEvents } from 'src/analytics/Events'
import { SwapShowInfoType } from 'src/analytics/Properties'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { BottomSheetRefType } from 'src/components/BottomSheet'
import TextButton from 'src/components/TextButton'
import TokenDisplay, { formatValueToDisplay } from 'src/components/TokenDisplay'
import Touchable from 'src/components/Touchable'
import InfoIcon from 'src/icons/InfoIcon'
import { getLocalCurrencySymbol, usdToLocalCurrencyRateSelector } from 'src/localCurrency/selectors'
import { useSelector } from 'src/redux/hooks'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import ExchangeRateIcon from 'src/swap/icons/ExchangeRateIcon'
import FeesIcon from 'src/swap/icons/FeesIcon'
import { useTokenInfo } from 'src/tokens/hooks'
import { TokenBalance } from 'src/tokens/slice'
import { getTokenId } from 'src/tokens/utils'

// Temporary flag while we build the new design incrementally
const showNewCrossChainDesigns = false

interface Props {
  maxNetworkFee?: BigNumber
  estimatedNetworkFee?: BigNumber
  networkFeeInfoBottomSheetRef: React.RefObject<BottomSheetRefType>
  slippageInfoBottomSheetRef: React.RefObject<BottomSheetRefType>
  slippagePercentage: string
  feeTokenId: string
  fromToken?: TokenBalance
  toToken?: TokenBalance
  exchangeRatePrice?: string
  exchangeRateInfoBottomSheetRef: React.RefObject<BottomSheetRefType>
  swapAmount?: BigNumber
  fetchingSwapQuote: boolean
  appFee?: {
    amount: BigNumber
    token: TokenBalance
    percentage: BigNumber
  }
  appFeeInfoBottomSheetRef: React.RefObject<BottomSheetRefType>
}

function LabelWithInfo({
  label,
  onPress,
  testID,
}: {
  label: string
  onPress: () => void
  testID: string
}) {
  return (
    <Touchable style={styles.touchableRow} onPress={onPress} testID={testID}>
      <>
        <Text style={styles.label}>{label}</Text>
        <InfoIcon size={14} color={colors.gray4} testID={`${testID}/Icon`} />
      </>
    </Touchable>
  )
}

function NetworkFeeDetails({
  label,
  infoType,
  infoBottomSheetRef,
  fetchingSwapQuote,
  fee,
  feeTokenId,
  showLocalAmount,
  placeholder,
  testID,
}: {
  label: string
  infoType: SwapShowInfoType
  infoBottomSheetRef: React.RefObject<BottomSheetRefType>
  fetchingSwapQuote: boolean
  fee?: BigNumber
  feeTokenId: string
  showLocalAmount: boolean
  placeholder: string
  testID: string
}) {
  return (
    <View style={styles.row} testID={testID}>
      <LabelWithInfo
        onPress={() => {
          ValoraAnalytics.track(SwapEvents.swap_show_info, {
            type: infoType,
          })
          infoBottomSheetRef.current?.snapToIndex(0)
        }}
        label={label}
        testID={`${testID}/MoreInfo`}
      />
      {!fetchingSwapQuote && fee ? (
        <View style={styles.networkFeeContainer}>
          {showLocalAmount ? (
            <>
              <TokenDisplay
                style={styles.value}
                amount={fee}
                showApprox
                tokenId={feeTokenId}
                showLocalAmount={true}
              />
              <Text style={[styles.value, { fontWeight: '400' }]}>
                {` (`}
                <TokenDisplay
                  amount={fee}
                  tokenId={feeTokenId}
                  showSymbol={true}
                  showLocalAmount={false}
                />
                {')'}
              </Text>
            </>
          ) : (
            <TokenDisplay
              style={[styles.value, { fontWeight: '400' }]}
              amount={fee}
              tokenId={feeTokenId}
              showSymbol={true}
              showLocalAmount={false}
            />
          )}
        </View>
      ) : (
        <Text style={styles.value}>{placeholder}</Text>
      )}
    </View>
  )
}

export function SwapTransactionDetailsOld(props: Props) {
  const { t } = useTranslation()

  if (showNewCrossChainDesigns) {
    return <SwapTransactionDetails {...props} />
  }

  const {
    maxNetworkFee,
    estimatedNetworkFee,
    networkFeeInfoBottomSheetRef,
    slippageInfoBottomSheetRef,
    feeTokenId,
    slippagePercentage,
    fromToken,
    toToken,
    exchangeRatePrice,
    exchangeRateInfoBottomSheetRef,
    fetchingSwapQuote,
    appFee,
    appFeeInfoBottomSheetRef,
  } = props
  const placeholder = '-'
  return (
    <View style={styles.container} testID="SwapTransactionDetails">
      <View style={styles.row} testID="SwapTransactionDetails/ExchangeRate">
        <LabelWithInfo
          onPress={() => {
            ValoraAnalytics.track(SwapEvents.swap_show_info, {
              type: SwapShowInfoType.EXCHANGE_RATE,
            })
            exchangeRateInfoBottomSheetRef.current?.snapToIndex(0)
          }}
          label={t('swapScreen.transactionDetails.exchangeRate')}
          testID="SwapTransactionDetails/ExchangeRate/MoreInfo"
        />
        <Text style={styles.value}>
          {!fetchingSwapQuote && fromToken && toToken && exchangeRatePrice ? (
            <>
              {`1 ${fromToken.symbol} ≈ `}
              <Text style={styles.value}>
                {`${new BigNumber(exchangeRatePrice).toFormat(5, BigNumber.ROUND_DOWN)} ${
                  toToken.symbol
                }`}
              </Text>
            </>
          ) : (
            <Text style={styles.value}>
              {fromToken ? `1 ${fromToken.symbol} ≈ ` : ''}
              {placeholder}
            </Text>
          )}
        </Text>
      </View>
      {/* Estimated network fee */}
      <NetworkFeeDetails
        label={t(`swapScreen.transactionDetails.estimatedNetworkFee`)}
        infoType={SwapShowInfoType.ESTIMATED_NETWORK_FEE}
        infoBottomSheetRef={networkFeeInfoBottomSheetRef}
        fetchingSwapQuote={fetchingSwapQuote}
        fee={estimatedNetworkFee}
        feeTokenId={feeTokenId}
        showLocalAmount={true}
        placeholder={placeholder}
        testID={`SwapTransactionDetails/EstimatedNetworkFee`}
      />
      {/* Max network fee */}
      <NetworkFeeDetails
        label={t(`swapScreen.transactionDetails.maxNetworkFee`)}
        infoType={SwapShowInfoType.MAX_NETWORK_FEE}
        infoBottomSheetRef={networkFeeInfoBottomSheetRef}
        fetchingSwapQuote={fetchingSwapQuote}
        fee={maxNetworkFee}
        feeTokenId={feeTokenId}
        showLocalAmount={false}
        placeholder={placeholder}
        testID={`SwapTransactionDetails/MaxNetworkFee`}
      />
      <View style={styles.row}>
        <LabelWithInfo
          onPress={() => {
            ValoraAnalytics.track(SwapEvents.swap_show_info, {
              type: SwapShowInfoType.APP_FEE,
            })
            appFeeInfoBottomSheetRef.current?.snapToIndex(0)
          }}
          label={t('swapScreen.transactionDetails.appFee')}
          testID="SwapTransactionDetails/AppFee/MoreInfo"
        />
        <Text testID={'SwapTransactionDetails/AppFee'} style={styles.value}>
          <Trans
            i18nKey={'swapScreen.transactionDetails.appFeeValue'}
            context={
              !appFee || fetchingSwapQuote
                ? 'placeholder'
                : appFee.percentage.isLessThanOrEqualTo(0)
                  ? 'free'
                  : !appFee.token.priceUsd
                    ? 'withoutPriceUsd'
                    : undefined
            }
            tOptions={{ appFeePercentage: appFee?.percentage.toFormat() ?? '0' }}
          >
            {appFee && (
              <TokenDisplay
                amount={appFee.amount}
                tokenId={appFee.token.tokenId}
                showLocalAmount={!!appFee.token.priceUsd}
                showApprox={!!appFee.token.priceUsd}
                style={styles.value}
              />
            )}
            {appFee && !!appFee.token.priceUsd && (
              <Text style={styles.noBold}>
                <TokenDisplay
                  amount={appFee.amount}
                  tokenId={appFee.token.tokenId}
                  showLocalAmount={false}
                />
              </Text>
            )}
          </Trans>
        </Text>
      </View>
      <View style={styles.row} testID="SwapTransactionDetails/Slippage">
        <LabelWithInfo
          onPress={() => {
            ValoraAnalytics.track(SwapEvents.swap_show_info, {
              type: SwapShowInfoType.SLIPPAGE,
            })
            slippageInfoBottomSheetRef.current?.snapToIndex(0)
          }}
          label={t('swapScreen.transactionDetails.slippagePercentage')}
          testID="SwapTransactionDetails/Slippage/MoreInfo"
        />
        <Text style={styles.value}>{`${slippagePercentage}%`}</Text>
      </View>
    </View>
  )
}

const useTotalSwapFeesInLocalCurrency = (
  estimatedNetworkFee: BigNumber,
  feeTokenId: string,
  appFee: BigNumber,
  appFeeTokenId: string,
  estimatedCrossChainFee: BigNumber
) => {
  const networkFeeTokenInfo = useTokenInfo(feeTokenId)
  const appFeeTokenInfo = useTokenInfo(appFeeTokenId)
  const nativeTokenInfo = useTokenInfo(
    networkFeeTokenInfo ? getTokenId(networkFeeTokenInfo.networkId) : undefined
  )
  const usdToLocalRate = useSelector(usdToLocalCurrencyRateSelector)

  let totalFeesInUsd = new BigNumber(0)

  if (
    networkFeeTokenInfo &&
    networkFeeTokenInfo.priceUsd &&
    appFeeTokenInfo &&
    appFeeTokenInfo.priceUsd &&
    nativeTokenInfo &&
    nativeTokenInfo.priceUsd
  ) {
    totalFeesInUsd = totalFeesInUsd
      .plus(estimatedNetworkFee.multipliedBy(networkFeeTokenInfo.priceUsd))
      .plus(appFee.multipliedBy(appFeeTokenInfo.priceUsd))
      .plus(
        estimatedCrossChainFee
          .shiftedBy(-nativeTokenInfo.decimals) // TODO: check if this is needed
          .multipliedBy(nativeTokenInfo.priceUsd)
      )
  }

  return totalFeesInUsd.multipliedBy(usdToLocalRate ?? 0)
}

export function SwapTransactionDetails({
  estimatedNetworkFee,
  fromToken,
  toToken,
  exchangeRatePrice,
  appFee,
  feeTokenId: networkFeeTokenId,
}: Props) {
  const { t } = useTranslation()
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const totalFeesInLocalCurrency = useTotalSwapFeesInLocalCurrency(
    estimatedNetworkFee ?? new BigNumber(0),
    networkFeeTokenId,
    appFee?.amount ?? new BigNumber(0),
    appFee?.token.tokenId ?? '',
    new BigNumber(0) // TODO add cross chain fee
  )

  const handleShowMoreDetails = () => {
    // TODO: show more details
  }

  if (!fromToken || !toToken || !exchangeRatePrice) {
    return null
  }

  const exchangeRate = new BigNumber(exchangeRatePrice).toFormat(5, BigNumber.ROUND_DOWN)
  return (
    <>
      <View style={styles.detailsContainer}>
        <View style={styles.detailsRow}>
          <ExchangeRateIcon />
          <Text style={styles.detailsText}>
            {t('swapScreen.transactionDetails.approximateExchangeRate', {
              fromTokenSymbol: fromToken?.symbol,
              toTokenSymbol: toToken?.symbol,
              exchangeRate,
            })}
          </Text>
        </View>
        <View style={styles.detailsRow}>
          <FeesIcon />
          <Text style={styles.detailsText}>
            {t('swapScreen.transactionDetails.approximateFees', {
              localCurrencySymbol,
              feeAmountInLocalCurrency: formatValueToDisplay(totalFeesInLocalCurrency), // TODO handle when 0
            })}
          </Text>
        </View>
      </View>
      <TextButton style={styles.viewMoreDetailsText} onPress={handleShowMoreDetails}>
        {t('swapScreen.transactionDetails.viewAllDetailsCta')}
      </TextButton>
    </>
  )
}

const styles = StyleSheet.create({
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    padding: Spacing.Regular16,
    borderRadius: 12,
    borderColor: colors.gray2,
    borderWidth: 1,
    marginBottom: Spacing.Smallest8,
    gap: Spacing.Smallest8,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.Tiny4,
  },
  detailsText: {
    ...typeScale.labelXSmall,
    color: colors.gray3,
  },
  viewMoreDetailsText: {
    ...typeScale.labelXSmall,
    color: colors.primary,
    textAlign: 'center',
  },
  container: {
    paddingHorizontal: Spacing.Tiny4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: Spacing.Small12,
  },
  touchableRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    ...typeScale.bodyXSmall,
    color: colors.gray4,
    fontWeight: '600',
  },
  noBold: {
    fontWeight: '400',
  },
  label: {
    ...typeScale.bodyXSmall,
    color: colors.gray4,
    marginRight: Spacing.Tiny4,
  },
  networkFeeContainer: {
    flexDirection: 'row',
  },
})

export default SwapTransactionDetailsOld
