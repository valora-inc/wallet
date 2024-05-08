import React, { RefObject } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { ResizeMode } from 'react-native-video'
import { EarnEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BottomSheet, { BottomSheetRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import TokenDisplay from 'src/components/TokenDisplay'
import Touchable from 'src/components/Touchable'
import InfoIcon from 'src/icons/InfoIcon'
import Logo from 'src/icons/Logo'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { NETWORK_NAMES } from 'src/shared/conts'
import { getDynamicConfigParams } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Shadow, Spacing, getShadowStyle } from 'src/styles/styles'
import {
  PreparedTransactionsPossible,
  getFeeCurrencyAndAmounts,
} from 'src/viem/prepareTransactions'

const LOGO_SIZE = 24

export default function EarnDepositBottomSheet({
  forwardedRef,
  preparedTransaction,
  amount,
  tokenId,
}: {
  forwardedRef: RefObject<BottomSheetRefType>
  preparedTransaction: PreparedTransactionsPossible
  amount: string
  tokenId: string
}) {
  const { t } = useTranslation()

  const { estimatedFeeAmount, feeCurrency } = getFeeCurrencyAndAmounts(preparedTransaction)

  if (!estimatedFeeAmount || !feeCurrency) {
    // should never happen since a possible prepared tx should include fee currency and amount
    return null
  }

  const { providerName, providerLogoUrl, providerTermsAndConditionsUrl } = getDynamicConfigParams(
    DynamicConfigs[StatsigDynamicConfigs.EARN_STABLECOIN_CONFIG]
  )

  const onPressProviderIcon = () => {
    ValoraAnalytics.track(EarnEvents.earn_deposit_provider_info_press)
    providerTermsAndConditionsUrl &&
      navigate(Screens.WebViewScreen, { uri: providerTermsAndConditionsUrl })
  }

  const onPressTermsAndConditions = () => {
    ValoraAnalytics.track(EarnEvents.earn_deposit_terms_and_conditions_press)
    providerTermsAndConditionsUrl &&
      navigate(Screens.WebViewScreen, { uri: providerTermsAndConditionsUrl })
  }

  const onPressComplete = () => {
    ValoraAnalytics.track(EarnEvents.earn_deposit_complete)
    // TODO(ACT-1178): submit tx
  }

  const onPressCancel = () => {
    ValoraAnalytics.track(EarnEvents.earn_deposit_cancel)
    forwardedRef.current?.close()
  }

  return (
    <BottomSheet forwardedRef={forwardedRef} testId="EarnDepositBottomSheet">
      <View style={styles.container}>
        <Logos providerUrl={providerLogoUrl} />
        <Text style={styles.title}>{t('earnFlow.depositBottomSheet.title')}</Text>
        <Text style={styles.description}>{t('earnFlow.depositBottomSheet.description')}</Text>
        <LabelValue
          label={t('earnFlow.depositBottomSheet.amount')}
          value={
            <TokenDisplay
              testID="EarnDeposit/Amount"
              amount={amount}
              tokenId={tokenId}
              style={styles.value}
              showLocalAmount={false}
            />
          }
        />
        <LabelValue
          label={t('earnFlow.depositBottomSheet.fee')}
          value={
            <TokenDisplay
              testID="EarnDeposit/Fee"
              amount={estimatedFeeAmount}
              tokenId={feeCurrency.tokenId}
              style={styles.value}
              showLocalAmount={false}
            />
          }
        />
        <LabelValue
          label={t('earnFlow.depositBottomSheet.provider')}
          value={
            <View style={styles.providerNameContainer}>
              <Text style={styles.value}>{providerName}</Text>
              <Touchable
                testID="EarnDeposit/ProviderInfo"
                borderRadius={24}
                onPress={onPressProviderIcon}
              >
                <InfoIcon size={12} />
              </Touchable>
            </View>
          }
        />
        <LabelValue
          label={t('earnFlow.depositBottomSheet.network')}
          value={
            <Text style={styles.value}>
              {NETWORK_NAMES[preparedTransaction.feeCurrency.networkId]}
            </Text>
          }
        />
        <Text style={styles.footer}>
          <Trans i18nKey="earnFlow.depositBottomSheet.footer">
            <Text
              testID="EarnDeposit/TermsAndConditions"
              style={styles.termsLink}
              onPress={onPressTermsAndConditions}
            />
          </Trans>
        </Text>
        <View style={styles.ctaContainer}>
          <Button
            testID="EarnDeposit/SecondaryCta"
            size={BtnSizes.FULL}
            text={t('earnFlow.depositBottomSheet.secondaryCta')}
            type={BtnTypes.GRAY_WITH_BORDER}
            style={styles.cta}
            onPress={onPressCancel}
          />
          <Button
            testID="EarnDeposit/PrimaryCta"
            size={BtnSizes.FULL}
            text={t('earnFlow.depositBottomSheet.primaryCta')}
            style={styles.cta}
            onPress={onPressComplete}
          />
        </View>
      </View>
    </BottomSheet>
  )
}

function LabelValue({ label, value }: { label: string; value: JSX.Element }) {
  return (
    <View style={styles.labelValue}>
      <Text style={styles.label}>{label}</Text>
      {value}
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
  labelValue: {
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
})
