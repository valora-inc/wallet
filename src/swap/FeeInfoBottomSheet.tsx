import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import BottomSheet, { BottomSheetRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import TokenDisplay from 'src/components/TokenDisplay'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { AppFeeAmount, SwapFeeAmount } from 'src/swap/types'

interface Props {
  forwardedRef: React.RefObject<BottomSheetRefType>
  appFee?: AppFeeAmount
  crossChainFee?: SwapFeeAmount
  networkFee?: SwapFeeAmount
  fetchingSwapQuote: boolean
  enableAppFee: boolean
}

function FeeAmount({
  fee,
  showMaxAmount,
  isLoading,
}: {
  fee: SwapFeeAmount | undefined
  showMaxAmount?: boolean
  isLoading: boolean
}) {
  const { t } = useTranslation()

  const displayAmount = showMaxAmount ? fee?.maxAmount : fee?.amount
  const loadingText = t('loading')
  const fallbackText = t('unknown')

  return (
    <Text style={styles.bodyText}>
      {isLoading ? (
        loadingText
      ) : fee && fee.token && displayAmount ? (
        <>
          {`≈ `}
          {fee.token.priceUsd ? (
            <>
              <TokenDisplay
                amount={displayAmount}
                tokenId={fee.token.tokenId}
                style={styles.bodyText}
              />
              {` (`}
              <TokenDisplay
                amount={displayAmount}
                tokenId={fee.token.tokenId}
                showLocalAmount={false}
                style={styles.bodyText}
              />
              {`)`}
            </>
          ) : (
            <TokenDisplay
              amount={displayAmount}
              tokenId={fee.token.tokenId}
              showLocalAmount={false}
              style={styles.bodyText}
            />
          )}
        </>
      ) : (
        fallbackText
      )}
    </Text>
  )
}

function FeeInfoBottomSheet({
  forwardedRef,
  crossChainFee,
  appFee,
  networkFee,
  fetchingSwapQuote,
  enableAppFee,
}: Props) {
  const { t } = useTranslation()

  return (
    <BottomSheet
      forwardedRef={forwardedRef}
      title={t('swapScreen.transactionDetails.fees')}
      testId="FeeInfoBottomSheet"
    >
      <Text style={styles.label}>{t('swapScreen.transactionDetails.feesBreakdown')}</Text>
      <View style={styles.row}>
        <Text style={styles.bodyText}>
          {t('swapScreen.transactionDetails.estimatedNetworkFee')}
        </Text>
        <FeeAmount fee={networkFee} isLoading={fetchingSwapQuote} />
      </View>
      <View style={styles.row}>
        <Text style={styles.bodyText}>{t('swapScreen.transactionDetails.maxNetworkFee')}</Text>
        <FeeAmount fee={networkFee} showMaxAmount isLoading={fetchingSwapQuote} />
      </View>

      {enableAppFee && (
        <>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.bodyText}>{t('swapScreen.transactionDetails.appFee')}</Text>
            <FeeAmount fee={appFee} isLoading={fetchingSwapQuote} />
          </View>
        </>
      )}

      {crossChainFee && (
        <>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.bodyText}>
              {t('swapScreen.transactionDetails.estimatedCrossChainFee')}
            </Text>
            <FeeAmount fee={crossChainFee} isLoading={fetchingSwapQuote} />
          </View>
          <View style={styles.row}>
            <Text style={styles.bodyText}>
              {t('swapScreen.transactionDetails.maxCrossChainFee')}
            </Text>
            <FeeAmount fee={crossChainFee} showMaxAmount isLoading={fetchingSwapQuote} />
          </View>
        </>
      )}

      <View style={styles.moreInfoContainer}>
        <Text style={styles.label}>{t('swapScreen.transactionDetails.feesMoreInfoLabel')}</Text>
        <Text style={styles.infoText}>
          <Trans
            i18nKey={'swapScreen.transactionDetails.feesInfo'}
            context={crossChainFee ? 'crossChain' : 'sameChain'}
          />
          {enableAppFee && (
            <>
              {' '}
              <Trans
                i18nKey={'swapScreen.transactionDetails.appFeesInfo'}
                context={appFee?.percentage ? 'withPercentage' : ''}
                tOptions={{ appFeePercentage: appFee?.percentage.toFormat() }}
              />
            </>
          )}
        </Text>
      </View>

      <Button
        type={BtnTypes.SECONDARY}
        size={BtnSizes.FULL}
        onPress={() => {
          forwardedRef.current?.close()
        }}
        text={t('swapScreen.transactionDetails.infoDismissButton')}
      />
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.Tiny4,
  },
  divider: {
    marginVertical: Spacing.Small12,
    height: 1,
    backgroundColor: Colors.gray2,
    width: '100%',
  },
  label: {
    ...typeScale.labelSemiBoldSmall,
    paddingVertical: Spacing.Tiny4,
  },
  bodyText: {
    ...typeScale.bodySmall,
  },
  infoText: {
    ...typeScale.bodySmall,
    color: Colors.gray3,
  },
  moreInfoContainer: {
    marginTop: Spacing.Large32,
    marginBottom: Spacing.XLarge48,
    gap: Spacing.Smallest8,
  },
})

export default FeeInfoBottomSheet
