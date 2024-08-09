import { KycStatus as FiatConnectKycStatus } from '@fiatconnect/fiatconnect-types'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { FiatExchangeEvents } from 'src/analytics/Events'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import getNavigationOptions from 'src/fiatconnect/kyc/getNavigationOptions'
import BankIcon from 'src/icons/BankIcon'
import CircledIcon from 'src/icons/CircledIcon'
import ClockIcon from 'src/icons/ClockIcon'
import { navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'

type Props = NativeStackScreenProps<StackParamList, Screens.KycPending>

function KycPending({ route, navigation }: Props) {
  navigation.setOptions(
    getNavigationOptions({
      fiatConnectKycStatus: FiatConnectKycStatus.KycPending,
      quote: route.params.quote,
    })
  )

  const { t } = useTranslation()

  const onPressClose = () => {
    AppAnalytics.track(FiatExchangeEvents.cico_fc_kyc_status_close, {
      provider: route.params.quote.getProviderId(),
      flow: route.params.flow,
      fiatConnectKycStatus: FiatConnectKycStatus.KycPending,
    })
    navigateHome()
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.iconContainer}>
        <CircledIcon radius={80} backgroundColor={colors.ivory} style={styles.bankIcon}>
          <BankIcon color={colors.black} height={24} width={24} />
        </CircledIcon>
        <CircledIcon radius={85} backgroundColor={colors.white} style={styles.clockIcon}>
          <CircledIcon radius={80}>
            <ClockIcon color={colors.white} height={24} width={24} />
          </CircledIcon>
        </CircledIcon>
      </View>
      <Text style={styles.title}>{t('fiatConnectKycStatusScreen.pending.title')}</Text>
      <Text testID="descriptionText" style={styles.description}>
        {t('fiatConnectKycStatusScreen.pending.description')}
      </Text>
      <Button
        style={styles.button}
        testID="closeButton"
        onPress={onPressClose}
        text={t('fiatConnectKycStatusScreen.pending.close')}
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
  clockIcon: {
    right: 10,
  },
  bankIcon: {
    left: 10,
  },
  iconContainer: {
    flexDirection: 'row',
    paddingBottom: 32,
  },
  title: {
    ...typeScale.titleSmall,
    marginHorizontal: 16,
  },
  description: {
    ...typeScale.bodyMedium,
    textAlign: 'center',
    marginVertical: 12,
    marginHorizontal: 24,
  },
  button: {
    marginTop: 12,
    marginBottom: 100,
  },
})

export default KycPending
