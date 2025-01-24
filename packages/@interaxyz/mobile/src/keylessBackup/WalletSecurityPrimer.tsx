import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, Image, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { KeylessBackupEvents } from 'src/analytics/Events'
import AppAnalytics from 'src/analytics/AppAnalytics'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { KeylessBackupFlow } from 'src/keylessBackup/types'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { walletSafe } from 'src/images/Images'

type Props = NativeStackScreenProps<StackParamList, Screens.WalletSecurityPrimer>

function WalletSecurityPrimer({ route }: Props) {
  const { t } = useTranslation()
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.imageContainer}>
          <Image testID="Email" source={walletSafe} />
        </View>
        <Text style={styles.title}>{t('walletSecurityPrimer.title')}</Text>
        <Text style={styles.description}>{t('walletSecurityPrimer.description')}</Text>
      </ScrollView>
      <Button
        testID="WalletSecurityPrimer/GetStarted"
        onPress={function () {
          AppAnalytics.track(KeylessBackupEvents.wallet_security_primer_get_started)
          navigate(Screens.KeylessBackupIntro, {
            keylessBackupFlow: KeylessBackupFlow.Setup,
          })
        }}
        text={t('getStarted')}
        size={BtnSizes.FULL}
        type={BtnTypes.PRIMARY}
        style={styles.button}
      />
    </SafeAreaView>
  )
}

export default WalletSecurityPrimer

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    height: '100%',
  },
  scrollContainer: {
    padding: Spacing.Thick24,
  },
  title: {
    ...typeScale.titleMedium,
    textAlign: 'center',
    marginTop: Spacing.Thick24,
    color: colors.black,
  },
  description: {
    ...typeScale.bodyMedium,
    textAlign: 'center',
    marginTop: Spacing.Regular16,
    color: colors.black,
  },
  button: {
    padding: Spacing.Thick24,
  },
  imageContainer: {
    alignItems: 'center',
    paddingTop: Spacing.Thick24,
  },
})
