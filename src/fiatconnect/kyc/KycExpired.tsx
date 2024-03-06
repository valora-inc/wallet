import { KycStatus as FiatConnectKycStatus } from '@fiatconnect/fiatconnect-types'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import getNavigationOptions from 'src/fiatconnect/kyc/getNavigationOptions'
import { kycTryAgainLoadingSelector } from 'src/fiatconnect/selectors'
import { kycTryAgain } from 'src/fiatconnect/slice'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { useDispatch, useSelector } from 'src/redux/hooks'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'

type Props = NativeStackScreenProps<StackParamList, Screens.KycExpired>

function KycExpired({ route, navigation }: Props) {
  const { quote, flow } = route.params
  const dispatch = useDispatch()
  const tryAgainLoading = useSelector(kycTryAgainLoadingSelector)

  navigation.setOptions(
    getNavigationOptions({
      fiatConnectKycStatus: FiatConnectKycStatus.KycExpired,
      quote,
    })
  )

  const { t } = useTranslation()

  const onPressTryAgain = () => {
    ValoraAnalytics.track(FiatExchangeEvents.cico_fc_kyc_status_try_again, {
      provider: quote.getProviderId(),
      flow,
      fiatConnectKycStatus: FiatConnectKycStatus.KycExpired,
    })
    dispatch(kycTryAgain({ quote, flow }))
  }
  const onPressSwitch = () => {
    ValoraAnalytics.track(FiatExchangeEvents.cico_fc_kyc_status_switch_method, {
      provider: quote.getProviderId(),
      flow,
      fiatConnectKycStatus: FiatConnectKycStatus.KycExpired,
    })
    navigate(Screens.SelectProvider, {
      flow,
      tokenId: quote.getTokenId(),
      amount: {
        crypto: Number(quote.getCryptoAmount()),
        fiat: Number(quote.getFiatAmount()),
      },
    })
  }

  if (tryAgainLoading) {
    return (
      <View testID="spinnerContainer" style={styles.activityIndicatorContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{t('fiatConnectKycStatusScreen.expired.title')}</Text>
      <Text testID="descriptionText" style={styles.description}>
        {t('fiatConnectKycStatusScreen.expired.description')}
      </Text>
      <Button
        style={styles.tryAgainButton}
        testID="tryAgainButton"
        onPress={onPressTryAgain}
        text={t('fiatConnectKycStatusScreen.expired.tryAgain')}
        type={BtnTypes.PRIMARY}
        size={BtnSizes.MEDIUM}
      />
      <Button
        style={styles.switchButton}
        testID="switchButton"
        onPress={onPressSwitch}
        text={t('fiatConnectKycStatusScreen.expired.switch')}
        type={BtnTypes.SECONDARY}
        size={BtnSizes.MEDIUM}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...fontStyles.h2,
    marginHorizontal: 16,
  },
  description: {
    ...fontStyles.regular,
    textAlign: 'center',
    marginVertical: 12,
    marginHorizontal: 24,
  },
  tryAgainButton: {
    marginTop: 12,
  },
  switchButton: {
    marginTop: 12,
    marginBottom: 100,
  },
  activityIndicatorContainer: {
    paddingVertical: variables.contentPadding,
    flex: 1,
    alignContent: 'center',
    justifyContent: 'center',
  },
})

export default KycExpired
