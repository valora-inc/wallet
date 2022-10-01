import { KycStatus as FiatConnectKycStatus } from '@fiatconnect/fiatconnect-types'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import getNavigationOptions from 'src/fiatconnect/kyc/getNavigationOptions'
import { kycTryAgainLoadingSelector } from 'src/fiatconnect/selectors'
import { kycTryAgain } from 'src/fiatconnect/slice'
import { convertCurrencyToLocalAmount } from 'src/localCurrency/convert'
import { localCurrencyExchangeRatesSelector } from 'src/localCurrency/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'

type Props = StackScreenProps<StackParamList, Screens.KycDenied>

function KycDenied({ route, navigation }: Props) {
  const { quote, flow, retryable } = route.params
  const dispatch = useDispatch()
  const tryAgainLoading = useSelector(kycTryAgainLoadingSelector)

  const exchangeRates = useSelector(localCurrencyExchangeRatesSelector)
  useMemo(() => {
    navigation.setOptions(
      getNavigationOptions({
        fiatConnectKycStatus: FiatConnectKycStatus.KycDenied,
        quote,
        exchangeRates,
      })
    )
  }, [exchangeRates])

  const { t } = useTranslation()

  const onPressTryAgain = () => {
    ValoraAnalytics.track(FiatExchangeEvents.cico_fc_kyc_status_try_again, {
      provider: quote.getProviderId(),
      flow,
      fiatConnectKycStatus: FiatConnectKycStatus.KycDenied,
    })
    dispatch(kycTryAgain({ quote, flow }))
  }
  const onPressSwitch = () => {
    ValoraAnalytics.track(FiatExchangeEvents.cico_fc_kyc_status_switch_method, {
      provider: quote.getProviderId(),
      flow,
      fiatConnectKycStatus: FiatConnectKycStatus.KycDenied,
    })
    navigate(Screens.SelectProvider, {
      flow,
      selectedCrypto: quote.getCryptoType(),
      amount: {
        crypto: Number(quote.getCryptoAmount()),
        fiat: Number(
          convertCurrencyToLocalAmount(
            quote.getCryptoAmount(),
            exchangeRates[quote.getCryptoType()]
          )
        ),
      },
    })
  }
  if (tryAgainLoading) {
    return (
      <View style={styles.activityIndicatorContainer}>
        <ActivityIndicator size="large" color={colors.greenBrand} />
      </View>
    )
  }
  if (retryable) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>{t('fiatConnectKycStatusScreen.denied.retryable.title')}</Text>
        <Text testID="descriptionText" style={styles.description}>
          {t('fiatConnectKycStatusScreen.denied.retryable.description')}
        </Text>
        <Button
          style={styles.tryAgainButton}
          testID="tryAgainButton"
          onPress={onPressTryAgain}
          text={t('fiatConnectKycStatusScreen.denied.retryable.tryAgain')}
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
  } else {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>{t('fiatConnectKycStatusScreen.denied.final.title')}</Text>
        <Text testID="descriptionText" style={styles.description}>
          {t('fiatConnectKycStatusScreen.denied.final.description')}
        </Text>
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
  },
  activityIndicatorContainer: {
    paddingVertical: variables.contentPadding,
    flex: 1,
    alignContent: 'center',
    justifyContent: 'center',
  },
})

export default KycDenied
