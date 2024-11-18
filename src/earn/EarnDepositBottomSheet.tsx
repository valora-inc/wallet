import BigNumber from 'bignumber.js'
import React, { RefObject, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import { openUrl } from 'src/app/actions'
import BottomSheet, { BottomSheetModalRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { LabelWithInfo } from 'src/components/LabelWithInfo'
import TokenDisplay from 'src/components/TokenDisplay'
import { depositStatusSelector } from 'src/earn/selectors'
import { depositStart } from 'src/earn/slice'
import { EarnActiveMode } from 'src/earn/types'
import {
  getSwapToAmountInDecimals,
  getTotalYieldRate,
  isGasSubsidizedForNetwork,
} from 'src/earn/utils'
import ArrowRightThick from 'src/icons/ArrowRightThick'
import { EarnPosition } from 'src/positions/types'
import { useDispatch, useSelector } from 'src/redux/hooks'
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

const APP_ID_TO_PROVIDER_DOCUMENTS_URL: Record<string, string | undefined> = {
  beefy: 'https://docs.beefy.finance/',
}
const APP_TERMS_AND_CONDITIONS_URL = 'https://valora.xyz/terms'

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
  mode: EarnActiveMode
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
    depositTokenAmount: depositAmount.toString(),
    fromTokenId: inputTokenId,
    fromTokenAmount: inputAmount.toString(),
    networkId: pool.networkId,
    poolId: pool.positionId,
    mode,
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
    termsUrl && dispatch(openUrl(termsUrl, true))
  }

  const onPressTermsAndConditions = () => {
    AppAnalytics.track(EarnEvents.earn_deposit_terms_and_conditions_press, {
      type: 'providerTermsAndConditions',
      ...commonAnalyticsProperties,
    })
    termsUrl && dispatch(openUrl(termsUrl, true))
  }

  const onPressProviderDocuments = () => {
    AppAnalytics.track(EarnEvents.earn_deposit_terms_and_conditions_press, {
      type: 'providerDocuments',
      ...commonAnalyticsProperties,
    })
    const providerDocumentsUrl = APP_ID_TO_PROVIDER_DOCUMENTS_URL[pool.appId]
    providerDocumentsUrl && dispatch(openUrl(providerDocumentsUrl, true))
  }

  const onPressAppTermsAndConditions = () => {
    AppAnalytics.track(EarnEvents.earn_deposit_terms_and_conditions_press, {
      type: 'appTermsAndConditions',
      ...commonAnalyticsProperties,
    })
    dispatch(openUrl(APP_TERMS_AND_CONDITIONS_URL, true))
  }

  const onPressComplete = () => {
    dispatch(
      depositStart({
        amount: depositAmount.toString(),
        pool,
        preparedTransactions: getSerializablePreparedTransactions(preparedTransaction.transactions),
        mode,
        fromTokenId: inputTokenId,
        fromTokenAmount: inputAmount.toString(),
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
            {termsUrl ? (
              <LabelWithInfo
                label={pool.appName}
                labelStyle={styles.value}
                onPress={onPressProviderIcon}
                iconSize={12}
                testID="EarnDeposit/ProviderInfo"
              />
            ) : (
              <Text style={styles.value}>{pool.appName}</Text>
            )}
          </View>
        </LabelledItem>
        <LabelledItem label={t('earnFlow.depositBottomSheet.network')}>
          <Text style={styles.value}>
            {NETWORK_NAMES[preparedTransaction.feeCurrency.networkId]}
          </Text>
        </LabelledItem>
        {termsUrl ? (
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
        ) : (
          APP_ID_TO_PROVIDER_DOCUMENTS_URL[pool.appId] && (
            <Text style={styles.footer}>
              <Trans
                i18nKey="earnFlow.depositBottomSheet.noTermsUrlFooter"
                tOptions={{ providerName: pool.appName }}
              >
                <Text
                  testID="EarnDeposit/ProviderDocuments"
                  style={styles.termsLink}
                  onPress={onPressProviderDocuments}
                />
                <Text
                  testID="EarnDeposit/AppTermsAndConditions"
                  style={styles.termsLink}
                  onPress={onPressAppTermsAndConditions}
                />
              </Trans>
            </Text>
          )
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
    color: Colors.accent,
  },
})
