import BigNumber from 'bignumber.js'
import React, { RefObject } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { ResizeMode } from 'react-native-video'
import { useDispatch } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import BottomSheet, { BottomSheetModalRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import TokenDisplay from 'src/components/TokenDisplay'
import Touchable from 'src/components/Touchable'
import { EarnApyAndAmount } from 'src/earn/EarnApyAndAmount'
import { depositStatusSelector } from 'src/earn/selectors'
import { depositStart } from 'src/earn/slice'
import { isGasSubsidizedForNetwork } from 'src/earn/utils'
import InfoIcon from 'src/icons/InfoIcon'
import Logo from 'src/images/Logo'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { EarnPosition } from 'src/positions/types'
import { useSelector } from 'src/redux/hooks'
import { NETWORK_NAMES } from 'src/shared/conts'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Shadow, Spacing, getShadowStyle } from 'src/styles/styles'
import {
  PreparedTransactionsPossible,
  getFeeCurrencyAndAmounts,
} from 'src/viem/prepareTransactions'
import { getSerializablePreparedTransactions } from 'src/viem/preparedTransactionSerialization'

const LOGO_SIZE = 24

export default function EarnDepositBottomSheet({
  forwardedRef,
  preparedTransaction,
  amount,
  pool,
}: {
  forwardedRef: RefObject<BottomSheetModalRefType>
  preparedTransaction: PreparedTransactionsPossible
  amount: BigNumber
  pool: EarnPosition
}) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const depositStatus = useSelector(depositStatusSelector)
  const transactionSubmitted = depositStatus === 'loading'

  const commonAnalyticsProperties = {
    providerId: pool.appId,
    depositTokenId: pool.dataProps.depositTokenId,
    tokenAmount: amount.toString(),
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
        amount: amount.toString(),
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
        <Logos providerUrl={pool.displayProps.imageUrl} />
        <Text style={styles.title}>{t('earnFlow.depositBottomSheet.title')}</Text>
        <Text style={styles.description}>
          {t('earnFlow.depositBottomSheet.descriptionV1_93', { providerName: pool.appName })}
        </Text>
        <View style={styles.infoContainer}>
          <EarnApyAndAmount
            tokenAmount={amount}
            pool={pool}
            testIDPrefix={'EarnDepositBottomSheet'}
          />
        </View>
        <LabelledItem label={t('earnFlow.depositBottomSheet.amount')}>
          <TokenDisplay
            testID="EarnDeposit/Amount"
            amount={amount}
            tokenId={pool.dataProps.depositTokenId}
            style={styles.value}
            showLocalAmount={false}
          />
        </LabelledItem>
        <LabelledItem label={t('earnFlow.depositBottomSheet.fee')}>
          <TokenDisplay
            testID="EarnDeposit/Fee"
            amount={estimatedFeeAmount}
            tokenId={feeCurrency.tokenId}
            style={[styles.value, isGasSubsidized && { textDecorationLine: 'line-through' }]}
            showLocalAmount={false}
          />
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

function Logos({ providerUrl }: { providerUrl: string }) {
  return (
    <View style={styles.logoContainer}>
      <View style={styles.logoBackground}>
        <Logo size={LOGO_SIZE} />
      </View>
      <View style={[styles.logoBackground, { marginLeft: -4 }]}>
        <FastImage
          style={styles.providerImage}
          source={{ uri: providerUrl }}
          resizeMode={ResizeMode.COVER}
        />
      </View>
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
    color: Colors.gray4,
  },
  value: {
    ...typeScale.labelSemiBoldSmall,
    color: Colors.black,
  },
  logoContainer: {
    flexDirection: 'row',
  },
  logoBackground: {
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
    height: 40,
    width: 40,
    borderRadius: 100,
    backgroundColor: Colors.white,
    ...getShadowStyle(Shadow.SoftLight),
  },
  providerImage: {
    height: LOGO_SIZE,
    width: LOGO_SIZE,
    borderRadius: 100,
  },
  providerNameContainer: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  footer: {
    marginTop: Spacing.XLarge48,
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
  infoContainer: {
    padding: Spacing.Regular16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.gray2,
  },
  gasSubsidized: {
    ...typeScale.labelXSmall,
    color: Colors.primary,
  },
})
