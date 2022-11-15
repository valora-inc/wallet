import { StackScreenProps } from '@react-navigation/stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BackButton from 'src/components/BackButton'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import TextButton from 'src/components/TextButton'
import Touchable from 'src/components/Touchable'
import { fiatConnectTransferSelector } from 'src/fiatconnect/selectors'
import { FiatAccount, FiatConnectTransfer } from 'src/fiatconnect/slice'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { CICOFlow } from 'src/fiatExchanges/utils'
import CheckmarkCircle from 'src/icons/CheckmarkCircle'
import OpenLinkIcon from 'src/icons/OpenLinkIcon'
import { emptyHeader } from 'src/navigator/Headers'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import networkConfig from 'src/web3/networkConfig'
type Props = StackScreenProps<StackParamList, Screens.FiatConnectTransferStatus>

function onBack(flow: CICOFlow, normalizedQuote: FiatConnectQuote, fiatAccount: FiatAccount) {
  ValoraAnalytics.track(FiatExchangeEvents.cico_fc_transfer_error_retry, {
    flow,
    provider: normalizedQuote.getProviderId(),
  })
  navigate(Screens.FiatConnectReview, {
    flow,
    normalizedQuote,
    fiatAccount,
    shouldRefetchQuote: true,
  })
}

function FailureSection({
  normalizedQuote,
  flow,
  fiatAccount,
}: {
  normalizedQuote: FiatConnectQuote
  flow: CICOFlow
  fiatAccount: FiatAccount
}) {
  const { t } = useTranslation()
  const provider = normalizedQuote.getProviderId()

  const onPressSupport = () => {
    ValoraAnalytics.track(FiatExchangeEvents.cico_fc_transfer_error_contact_support, {
      flow,
      provider,
    })
    navigate(Screens.SupportContact, {
      prefilledText:
        flow === CICOFlow.CashIn
          ? t('fiatConnectStatusScreen.add.contactSupportPrefill')
          : t('fiatConnectStatusScreen.withdraw.contactSupportPrefill'),
    })
  }
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('fiatConnectStatusScreen.requestNotCompleted.title')}</Text>
      <Text style={styles.description}>
        {t('fiatConnectStatusScreen.requestNotCompleted.description')}
      </Text>
      <Button
        style={styles.button}
        testID="TryAgain"
        onPress={() => onBack(flow, normalizedQuote, fiatAccount)}
        text={t('fiatConnectStatusScreen.tryAgain')}
        type={BtnTypes.PRIMARY}
        size={BtnSizes.MEDIUM}
      />
      <Button
        style={styles.button}
        testID="SupportContactLink"
        onPress={onPressSupport}
        text={t('contactSupport')}
        type={BtnTypes.SECONDARY}
        size={BtnSizes.MEDIUM}
      />
    </View>
  )
}

function SuccessSection({
  flow,
  fiatConnectTransfer,
  normalizedQuote,
}: {
  flow: CICOFlow
  fiatConnectTransfer: FiatConnectTransfer
  normalizedQuote: FiatConnectQuote
}) {
  const { t } = useTranslation()
  // TODO: Make sure there's fallback text if we can't get the estimate
  const timeEstimation = normalizedQuote.getTimeEstimation()!
  const provider = normalizedQuote.getProviderId()

  const onPressTxDetails = () => {
    ValoraAnalytics.track(FiatExchangeEvents.cico_fc_transfer_success_view_tx, {
      flow,
      provider,
      txHash: fiatConnectTransfer.txHash!,
    })
    navigate(Screens.WebViewScreen, {
      uri: `${networkConfig.celoExplorerBaseTxUrl}${fiatConnectTransfer?.txHash}`,
    })
  }

  const onPressContinue = () => {
    ValoraAnalytics.track(FiatExchangeEvents.cico_fc_transfer_success_complete, {
      flow,
      provider,
      txHash: fiatConnectTransfer.txHash || undefined,
    })
    navigateHome()
  }

  return (
    <View style={styles.container}>
      <View style={styles.checkmarkContainer}>
        <CheckmarkCircle />
      </View>
      <Text style={styles.title}>{t('fiatConnectStatusScreen.success.title')}</Text>
      <Text style={styles.description}>
        {t('fiatConnectStatusScreen.success.description', { duration: timeEstimation })}
      </Text>
      {flow === CICOFlow.CashOut && (
        <Touchable testID={'txDetails'} borderless={true} onPress={onPressTxDetails}>
          <View style={styles.txDetailsContainer}>
            <Text style={styles.txDetails}>{t('fiatConnectStatusScreen.success.txDetails')}</Text>
            <OpenLinkIcon color={colors.gray4} />
          </View>
        </Touchable>
      )}
      <Button
        style={styles.button}
        testID="Continue"
        onPress={onPressContinue}
        text={t('fiatConnectStatusScreen.success.continue')}
        type={BtnTypes.SECONDARY}
        size={BtnSizes.MEDIUM}
      />
    </View>
  )
}

export default function FiatConnectTransferStatusScreen({ route, navigation }: Props) {
  const { t } = useTranslation()
  const { normalizedQuote, flow, fiatAccount } = route.params

  const fiatConnectTransfer = useSelector(fiatConnectTransferSelector)!

  const onPressCancel = () => {
    ValoraAnalytics.track(FiatExchangeEvents.cico_fc_transfer_error_cancel, {
      flow,
      provider: normalizedQuote.getProviderId(),
    })
    navigateHome()
  }

  if (fiatConnectTransfer.failed) {
    navigation.setOptions({
      ...emptyHeader,
      headerLeft: () => (
        <BackButton testID="Back" onPress={() => onBack(flow, normalizedQuote, fiatAccount)} />
      ),
      headerRight: () => (
        <TextButton testID="Cancel" style={styles.cancelBtn} onPress={onPressCancel}>
          {flow === CICOFlow.CashIn
            ? t('fiatConnectStatusScreen.add.cancel')
            : t('fiatConnectStatusScreen.withdraw.cancel')}
        </TextButton>
      ),
    })
  } else if (!fiatConnectTransfer.isSending) {
    navigation.setOptions({
      ...emptyHeader,
      headerLeft: () => <View />,
      headerTitle: t('fiatConnectStatusScreen.success.header'),
    })
  }

  if (fiatConnectTransfer.isSending) {
    return (
      <View style={styles.activityIndicatorContainer}>
        <ActivityIndicator testID="loadingTransferStatus" size="large" color={colors.greenBrand} />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.content}>
      {fiatConnectTransfer.failed ? (
        <FailureSection flow={flow} normalizedQuote={normalizedQuote} fiatAccount={fiatAccount} />
      ) : (
        <SuccessSection
          flow={flow}
          fiatConnectTransfer={fiatConnectTransfer}
          normalizedQuote={normalizedQuote}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  txDetailsContainer: {
    flexDirection: 'row',
  },
  txDetails: {
    color: colors.gray4,
  },
  checkmarkContainer: {
    marginBottom: 24,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...fontStyles.h2,
  },
  description: {
    ...fontStyles.regular,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 48,
    paddingBottom: 24,
  },
  activityIndicatorContainer: {
    paddingVertical: variables.contentPadding,
    flex: 1,
    alignContent: 'center',
    justifyContent: 'center',
  },
  button: {
    marginTop: 13,
  },
  cancelBtn: {
    ...fontStyles.regular,
    color: colors.gray3,
    paddingHorizontal: Spacing.Thick24,
  },
})
