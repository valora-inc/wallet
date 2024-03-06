import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BackButton from 'src/components/BackButton'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import TextButton from 'src/components/TextButton'
import Touchable from 'src/components/Touchable'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { SettlementEstimation, SettlementTime } from 'src/fiatExchanges/quotes/constants'
import { getSettlementTimeString } from 'src/fiatExchanges/quotes/utils'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { fiatConnectTransferSelector } from 'src/fiatconnect/selectors'
import { FiatAccount, SendingTransferStatus } from 'src/fiatconnect/slice'
import CheckmarkCircle from 'src/icons/CheckmarkCircle'
import CircledIcon from 'src/icons/CircledIcon'
import ClockIcon from 'src/icons/ClockIcon'
import OpenLinkIcon from 'src/icons/OpenLinkIcon'
import { emptyHeader } from 'src/navigator/Headers'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { useSelector } from 'src/redux/hooks'
import appTheme from 'src/styles/appTheme'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import networkConfig, { blockExplorerUrls } from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'

const LOADING_DESCRIPTION_TIMEOUT_MS = 8000

const DESCRIPTION_STRINGS: Record<SettlementTime, string> = {
  [SettlementTime.LESS_THAN_ONE_HOUR]: 'fiatConnectStatusScreen.success.descriptionWithin1Hour',
  [SettlementTime.LESS_THAN_X_HOURS]: 'fiatConnectStatusScreen.success.descriptionWithinXHours',
  [SettlementTime.X_TO_Y_HOURS]: 'fiatConnectStatusScreen.success.descriptionInXtoYHours',
  [SettlementTime.LESS_THAN_X_DAYS]: 'fiatConnectStatusScreen.success.descriptionWithinXDays',
  [SettlementTime.X_TO_Y_DAYS]: 'fiatConnectStatusScreen.success.descriptionXtoYDays',
}

type Props = NativeStackScreenProps<StackParamList, Screens.FiatConnectTransferStatus>

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
          ? t('fiatConnectStatusScreen.cashIn.contactSupportPrefill')
          : t('fiatConnectStatusScreen.cashOut.contactSupportPrefill'),
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

function SuccessOrProcessingSection({
  status,
  flow,
  txHash,
  normalizedQuote,
}: {
  status: SendingTransferStatus.Completed | SendingTransferStatus.TxProcessing
  flow: CICOFlow
  txHash: string | null
  normalizedQuote: FiatConnectQuote
}) {
  const { t } = useTranslation()
  const provider = normalizedQuote.getProviderId()
  const address = useSelector(walletAddressSelector)
  const uri = txHash
    ? new URL(txHash, blockExplorerUrls[networkConfig.defaultNetworkId].baseTxUrl).toString()
    : new URL(
        String(address),
        blockExplorerUrls[networkConfig.defaultNetworkId].baseAddressUrl
      ).toString()

  let icon: JSX.Element
  let title: string
  let description: string
  let continueEvent:
    | FiatExchangeEvents.cico_fc_transfer_success_complete
    | FiatExchangeEvents.cico_fc_transfer_processing_continue
  let txDetailsEvent:
    | FiatExchangeEvents.cico_fc_transfer_success_view_tx
    | FiatExchangeEvents.cico_fc_transfer_processing_view_tx

  const getTransferSettlementTimeString = (settlementEstimation: SettlementEstimation) => {
    const { timeString, ...args } = getSettlementTimeString(
      settlementEstimation,
      DESCRIPTION_STRINGS
    )
    return timeString ? t(timeString, args) : t('fiatConnectStatusScreen.success.baseDescription')
  }

  if (status === SendingTransferStatus.Completed) {
    icon = <CheckmarkCircle />
    title = t('fiatConnectStatusScreen.success.title')
    description = getTransferSettlementTimeString(normalizedQuote.getTimeEstimation())
    continueEvent = FiatExchangeEvents.cico_fc_transfer_success_complete
    txDetailsEvent = FiatExchangeEvents.cico_fc_transfer_success_view_tx
  } else {
    icon = (
      <CircledIcon>
        <ClockIcon color={colors.white} height={22} width={22} />
      </CircledIcon>
    )
    title = t('fiatConnectStatusScreen.txProcessing.title')
    description = t('fiatConnectStatusScreen.txProcessing.description')
    continueEvent = FiatExchangeEvents.cico_fc_transfer_processing_continue
    txDetailsEvent = FiatExchangeEvents.cico_fc_transfer_processing_view_tx
  }

  const onPressTxDetails = () => {
    ValoraAnalytics.track(txDetailsEvent, {
      flow,
      provider,
      txHash,
    })
    navigate(Screens.WebViewScreen, { uri })
  }

  const onPressContinue = () => {
    ValoraAnalytics.track(continueEvent, {
      flow,
      provider,
      txHash,
    })
    navigateHome()
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>{icon}</View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {flow === CICOFlow.CashOut && (
        <Touchable testID={'txDetails'} borderless={true} onPress={onPressTxDetails}>
          <View style={styles.txDetailsContainer}>
            <Text style={styles.txDetails}>
              {t('fiatConnectStatusScreen.success.viewOnCeloScan')}
            </Text>
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

  // make loading description visible if sending is taking a while
  const [loadingDescriptionColor, setLoadingDescriptionColor] = useState(
    appTheme.colors.background.toString()
  )
  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoadingDescriptionColor(() => appTheme.colors.text)
    }, LOADING_DESCRIPTION_TIMEOUT_MS)
    return () => clearTimeout(timeout)
  }, [])

  switch (fiatConnectTransfer.status) {
    case SendingTransferStatus.Sending:
      return (
        <View style={styles.activityIndicatorContainer}>
          <ActivityIndicator testID="loadingTransferStatus" size="large" color={colors.primary} />
          <Text
            style={{ ...styles.loadingDescription, color: loadingDescriptionColor }}
            testID="loadingDescription"
          >
            {t('fiatConnectStatusScreen.stillProcessing')}
          </Text>
        </View>
      )
    case SendingTransferStatus.Failed:
      navigation.setOptions({
        ...emptyHeader,
        headerLeft: () => (
          <BackButton testID="Back" onPress={() => onBack(flow, normalizedQuote, fiatAccount)} />
        ),
        headerRight: () => (
          <TextButton testID="Cancel" style={styles.cancelBtn} onPress={onPressCancel}>
            {flow === CICOFlow.CashIn
              ? t('fiatConnectStatusScreen.cashIn.cancel')
              : t('fiatConnectStatusScreen.cashOut.cancel')}
          </TextButton>
        ),
      })
      return (
        <SafeAreaView style={styles.content}>
          <FailureSection flow={flow} normalizedQuote={normalizedQuote} fiatAccount={fiatAccount} />
        </SafeAreaView>
      )
    case SendingTransferStatus.Completed:
      navigation.setOptions({
        ...emptyHeader,
        headerLeft: () => <View />,
        headerTitle: t('fiatConnectStatusScreen.success.header') ?? undefined,
      })
    // intentionally falls thru since TxProcessing and Completed use the same component
    case SendingTransferStatus.TxProcessing:
      return (
        <SafeAreaView style={styles.content}>
          <SuccessOrProcessingSection
            status={fiatConnectTransfer.status}
            flow={flow}
            txHash={fiatConnectTransfer.txHash}
            normalizedQuote={normalizedQuote}
          />
        </SafeAreaView>
      )
    default:
      throw new Error('Invalid transfer status')
  }
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
  iconContainer: {
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
  loadingDescription: {
    ...fontStyles.large,
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
