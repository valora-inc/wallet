import { StackScreenProps } from '@react-navigation/stack'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import { fiatConnectTransferSelector } from 'src/fiatconnect/selectors'
import { useSelector } from 'react-redux'
import variables from 'src/styles/variables'
import fontStyles from 'src/styles/fonts'
import React from 'react'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import BackButton from 'src/components/BackButton'
import TextButton from 'src/components/TextButton'
import { emptyHeader } from 'src/navigator/Headers'
import { Spacing } from 'src/styles/styles'
import { useTranslation } from 'react-i18next'
import { navigate, navigateBack, navigateHome } from 'src/navigator/NavigationService'
import CheckmarkCircle from 'src/icons/CheckmarkCircle'
import OpenLinkIcon from 'src/icons/OpenLinkIcon'
import Touchable from 'src/components/Touchable'
import networkConfig from 'src/web3/networkConfig'
import colors from 'src/styles/colors'
import { FiatConnectTransfer } from 'src/fiatconnect/slice'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'

type Props = StackScreenProps<StackParamList, Screens.FiatConnectTransferStatus>

function onBack() {
  // TODO: navigate to ReviewFetchScreen once #2699 is merged
  navigateBack()
}

function FiatConnectWithdrawFailureSection() {
  const { t } = useTranslation()

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('fiatConnectStatusScreen.requestNotCompleted.title')}</Text>
      <Text style={styles.description}>
        {t('fiatConnectStatusScreen.requestNotCompleted.description')}
      </Text>
      <Button
        style={styles.button}
        testID="TryAgain"
        onPress={onBack}
        text={t('fiatConnectStatusScreen.tryAgain')}
        type={BtnTypes.PRIMARY}
        size={BtnSizes.MEDIUM}
      />
      <Button
        style={styles.button}
        testID="SupportContactLink"
        onPress={() => {
          navigate(Screens.SupportContact, {
            prefilledText: t('fiatConnectStatusScreen.requestNotCompleted.contactSupportPrefill'),
          })
        }}
        text={t('contactSupport')}
        type={BtnTypes.SECONDARY}
        size={BtnSizes.MEDIUM}
      />
    </View>
  )
}

function FiatConnectWithdrawSuccessSection({
  fiatConnectTransfer,
  normalizedQuote,
}: {
  fiatConnectTransfer: FiatConnectTransfer
  normalizedQuote: FiatConnectQuote
}) {
  const { t } = useTranslation()
  const timeEstimation = normalizedQuote.getTimeEstimation()!

  const onPressTxDetails = () => {
    navigate(Screens.WebViewScreen, {
      uri: `${networkConfig.celoExplorerBaseTxUrl}${fiatConnectTransfer?.txHash}`,
    })
  }

  return (
    <View style={styles.container}>
      <View style={styles.checkmarkContainer}>
        <CheckmarkCircle />
      </View>
      <Text style={styles.title}>{t('fiatConnectStatusScreen.withdraw.success.title')}</Text>
      <Text style={styles.description}>
        {t('fiatConnectStatusScreen.withdraw.success.description', { duration: timeEstimation })}
      </Text>
      <Touchable testID={'txDetails'} borderless={true} onPress={onPressTxDetails}>
        <View style={styles.txDetailsContainer}>
          <Text style={styles.txDetails}>
            {t('fiatConnectStatusScreen.withdraw.success.txDetails')}
          </Text>
          <OpenLinkIcon color={colors.gray4} />
        </View>
      </Touchable>
      <Button
        style={styles.button}
        testID="Continue"
        onPress={() => navigateHome()}
        text={t('fiatConnectStatusScreen.withdraw.success.continue')}
        type={BtnTypes.SECONDARY}
        size={BtnSizes.MEDIUM}
      />
    </View>
  )
}

export default function FiatConnectTransferStatusScreen({ route, navigation }: Props) {
  const { t } = useTranslation()
  const { normalizedQuote } = route.params

  const fiatConnectTransfer = useSelector(fiatConnectTransferSelector)!

  if (fiatConnectTransfer.failed) {
    navigation.setOptions({
      ...emptyHeader,
      headerLeft: () => <BackButton testID="Back" onPress={onBack} />,
      headerRight: () => (
        <TextButton testID="Cancel" style={styles.cancelBtn} onPress={() => navigateHome()}>
          {t('fiatConnectStatusScreen.withdraw.cancel')}
        </TextButton>
      ),
    })
  } else if (fiatConnectTransfer.txHash) {
    // TODO: This success check only works for cash outs, since no on-chain TX is performed for
    // cash-ins. Update this when we support cash-ins.
    navigation.setOptions({
      ...emptyHeader,
      headerLeft: () => <View />,
      headerTitle: t('fiatConnectStatusScreen.withdraw.success.header'),
    })
  }

  if (fiatConnectTransfer.isSending) {
    return (
      <View style={styles.activityIndicatorContainer}>
        <ActivityIndicator size="large" color={colors.greenBrand} />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.content}>
      {fiatConnectTransfer.failed ? (
        <FiatConnectWithdrawFailureSection />
      ) : (
        <FiatConnectWithdrawSuccessSection
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
