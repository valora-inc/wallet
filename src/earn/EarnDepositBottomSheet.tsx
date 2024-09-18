import BigNumber from 'bignumber.js'
import React, { RefObject, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { useDispatch } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import BottomSheet, { BottomSheetModalRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import TokenDisplay from 'src/components/TokenDisplay'
import Touchable from 'src/components/Touchable'
import { getTotalYieldRate } from 'src/earn/poolInfo'
import { depositStatusSelector } from 'src/earn/selectors'
import { depositStart } from 'src/earn/slice'
import { EarnDepositMode } from 'src/earn/types'
import { getSwapToAmountInDecimals, isGasSubsidizedForNetwork } from 'src/earn/utils'
import ArrowRightThick from 'src/icons/ArrowRightThick'
import InfoIcon from 'src/icons/InfoIcon'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { EarnPosition } from 'src/positions/types'
import { useSelector } from 'src/redux/hooks'
import { NETWORK_NAMES } from 'src/shared/conts'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { SwapTransaction } from 'src/swap/types'
import {
  PreparedTransactionsPossible,
  getFeeCurrencyAndAmounts,
} from 'src/viem/prepareTransactions'
import { getSerializablePreparedTransactions } from 'src/viem/preparedTransactionSerialization'

export default function EarnDepositBottomSheet({
  forwardedRef,
  preparedTransaction,
  inputAmount,
  inputTokenId,
  pool,
  mode,
  swapTransaction,
}: {
  forwardedRef: RefObject<BottomSheetModalRefType>
  preparedTransaction: PreparedTransactionsPossible
  inputTokenId: string
  inputAmount: BigNumber
  pool: EarnPosition
  mode: EarnDepositMode
  swapTransaction?: SwapTransaction
}) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const depositStatus = useSelector(depositStatusSelector)
  const transactionSubmitted = depositStatus === 'loading'

  const depositAmount = useMemo(
    () =>
      mode === 'swap-deposit' && swapTransaction
        ? getSwapToAmountInDecimals({ swapTransaction, fromAmount: inputAmount })
        : inputAmount,
    [inputAmount, swapTransaction]
  )

  const commonAnalyticsProperties = {
    providerId: pool.appId,
    depositTokenId: pool.dataProps.depositTokenId,
    tokenAmount: inputAmount.toString(),
    networkId: pool.networkId,
    poolId: pool.positionId,
  }

  const { estimatedFeeAmount, feeCurrency } = getFeeCurrencyAndAmounts(preparedTransaction)

  if (!estimatedFeeAmount || !feeCurrency) {
    // should never happen since a possible prepared tx should include fee currency and amount
    return null
  }

  const isGasSubsidized = isGasSubsidizedForNetwork(pool.networkId)
  const { termsUrl } = pool.dataProps

  const onPressProviderIcon = () => {
    AppAnalytics.track(EarnEvents.earn_deposit_provider_info_press, commonAnalyticsProperties)
    termsUrl && navigate(Screens.WebViewScreen, { uri: termsUrl })
  }

  const onPressTermsAndConditions = () => {
    AppAnalytics.track(
      EarnEvents.earn_deposit_terms_and_conditions_press,
      commonAnalyticsProperties
    )
    termsUrl && navigate(Screens.WebViewScreen, { uri: termsUrl })
  }

  const onPressComplete = () => {
    dispatch(
      depositStart({
        amount: depositAmount.toString(),
        pool,
        preparedTransactions: getSerializablePreparedTransactions(preparedTransaction.transactions),
      })
    )
    AppAnalytics.track(EarnEvents.earn_deposit_complete, commonAnalyticsProperties)
  }

  const onPressCancel = () => {
    AppAnalytics.track(EarnEvents.earn_deposit_cancel, commonAnalyticsProperties)
    forwardedRef.current?.close()
  }

  return (
    <BottomSheet forwardedRef={forwardedRef} testId="EarnDepositBottomSheet">
      <View style={styles.container}>
        <Text style={styles.title}>{t('earnFlow.depositBottomSheet.title')}</Text>
        <Text style={styles.description}>
          {t('earnFlow.depositBottomSheet.descriptionV1_93', { providerName: pool.appName })}
        </Text>
        <LabelledItem label={t('earnFlow.depositBottomSheet.yieldRate')}>
          <Text style={styles.value}>
            {t('earnFlow.depositBottomSheet.apy', {
              apy: getTotalYieldRate(pool).toFixed(2),
            })}
          </Text>
        </LabelledItem>
        <LabelledItem label={t('earnFlow.depositBottomSheet.amount')}>
          <View style={styles.valueRow} testID="EarnDeposit/Amount">
            <TokenDisplay
              testID="EarnDeposit/AmountCrypto"
              amount={depositAmount}
              tokenId={pool.dataProps.depositTokenId}
              style={styles.value}
              showLocalAmount={false}
            />
            <Text style={styles.valueSecondary}>
              {'('}
              <TokenDisplay
                testID="EarnDeposit/AmountFiat"
                amount={depositAmount}
                tokenId={pool.dataProps.depositTokenId}
                showLocalAmount={true}
              />
              {')'}
            </Text>
          </View>
          {mode === 'swap-deposit' && (
            <View style={styles.valueRow}>
              <TokenDisplay
                testID="EarnDeposit/Swap/From"
                tokenId={inputTokenId}
                amount={inputAmount.toString()}
                showLocalAmount={false}
                style={styles.valueSecondary}
              />
              <ArrowRightThick size={20} color={Colors.gray3} />
              <TokenDisplay
                testID="EarnDeposit/Swap/To"
                tokenId={pool.dataProps.depositTokenId}
                amount={depositAmount}
                showLocalAmount={false}
                style={styles.valueSecondary}
              />
            </View>
          )}
        </LabelledItem>
        <LabelledItem label={t('earnFlow.depositBottomSheet.fee')}>
          <View style={styles.valueRow} testID="EarnDeposit/Fee">
            <TokenDisplay
              testID="EarnDeposit/FeeFiat"
              amount={estimatedFeeAmount}
              tokenId={feeCurrency.tokenId}
              style={[styles.value, isGasSubsidized && { textDecorationLine: 'line-through' }]}
              showLocalAmount={true}
            />
            <Text style={styles.valueSecondary}>
              {'('}
              <TokenDisplay
                testID="EarnDeposit/FeeCrypto"
                amount={estimatedFeeAmount}
                tokenId={feeCurrency.tokenId}
                showLocalAmount={false}
              />
              {')'}
            </Text>
          </View>
          {isGasSubsidized && (
            <Text style={styles.gasSubsidized} testID={'EarnDeposit/GasSubsidized'}>
              {t('earnFlow.gasSubsidized')}
            </Text>
          )}
        </LabelledItem>
        <LabelledItem label={t('earnFlow.depositBottomSheet.provider')}>
          <View style={styles.providerNameContainer}>
            <Text style={styles.value}>{pool.appName}</Text>
            {!!termsUrl && (
              <Touchable
                testID="EarnDeposit/ProviderInfo"
                borderRadius={24}
                onPress={onPressProviderIcon}
              >
                <InfoIcon size={12} />
              </Touchable>
            )}
          </View>
        </LabelledItem>
        <LabelledItem label={t('earnFlow.depositBottomSheet.network')}>
          <Text style={styles.value}>
            {NETWORK_NAMES[preparedTransaction.feeCurrency.networkId]}
          </Text>
        </LabelledItem>
        {!!termsUrl && (
          <Text style={styles.footer}>
            <Trans
              i18nKey="earnFlow.depositBottomSheet.footerV1_93"
              tOptions={{ providerName: pool.appName }}
            >
              <Text
                testID="EarnDeposit/TermsAndConditions"
                style={styles.termsLink}
                onPress={onPressTermsAndConditions}
              />
            </Trans>
          </Text>
        )}
        <View style={styles.ctaContainer}>
          <Button
            testID="EarnDeposit/SecondaryCta"
            size={BtnSizes.FULL}
            text={t('earnFlow.depositBottomSheet.secondaryCta')}
            type={BtnTypes.SECONDARY}
            style={styles.cta}
            onPress={onPressCancel}
            disabled={transactionSubmitted}
          />
          <Button
            testID="EarnDeposit/PrimaryCta"
            size={BtnSizes.FULL}
            text={t('earnFlow.depositBottomSheet.primaryCta')}
            style={styles.cta}
            onPress={onPressComplete}
            disabled={transactionSubmitted}
            showLoading={transactionSubmitted}
          />
        </View>
      </View>
    </BottomSheet>
  )
}

function LabelledItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.labelledItem}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: Spacing.Regular16,
  },
  title: {
    ...typeScale.titleSmall,
    color: Colors.black,
  },
  description: {
    ...typeScale.bodySmall,
    color: Colors.black,
  },
  labelledItem: {
    gap: Spacing.Tiny4,
  },
  label: {
    ...typeScale.labelXSmall,
    color: Colors.gray3,
  },
  value: {
    ...typeScale.labelSemiBoldSmall,
    color: Colors.black,
  },
  valueRow: {
    flexDirection: 'row',
    gap: Spacing.Tiny4,
  },
  valueSecondary: {
    ...typeScale.bodySmall,
    color: Colors.gray3,
  },
  providerNameContainer: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  footer: {
    ...typeScale.bodySmall,
    color: Colors.gray3,
  },
  termsLink: {
    textDecorationLine: 'underline',
  },
  ctaContainer: {
    marginTop: Spacing.Smallest8,
    flexDirection: 'row',
    gap: Spacing.Smallest8,
  },
  cta: {
    flexGrow: 1,
    flexBasis: 0,
  },
  gasSubsidized: {
    ...typeScale.labelXSmall,
    color: Colors.primary,
  },
})
