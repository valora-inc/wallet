import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button'
import PhoneNumberWithFlag from '@celo/react-components/components/PhoneNumberWithFlag'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import AccountNumber from 'src/components/AccountNumber'
import { Namespaces } from 'src/i18n'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import { selectPendingSession } from 'src/walletConnect/selectors'

const TAG = 'WalletConnect/RequestScreen'

type RouteProps = StackScreenProps<StackParamList, Screens.WalletConnectSessionRequest>
type Props = RouteProps

export default function WalletConnectRequestScreen(props: Props) {
  useSelector(selectPendingSession)
  const { t } = useTranslation(Namespaces.global)

  console.log('rendering WalletConnectRequestScreen')

  const linkBack = () => {
    // const { account, route, phoneNumber } = this.props
    // const request = route.params.dappKitRequest
    // if (!request) {
    //   Logger.error(TAG, 'No request found in navigation props')
    //   return
    // }
    // if (!account) {
    //   Logger.error(TAG, 'No account set up for this wallet')
    //   return
    // }
    // if (!phoneNumber) {
    //   Logger.error(TAG, 'No phone number set up for this wallet')
    //   return
    // }
    // navigateHome({ onAfterNavigate: () => this.props.approveAccountAuth(request) })
  }

  const cancel = () => {
    // navigateBack()
  }

  // const { dappName } = route.params.dappKitRequest
  return (
    <SafeAreaView style={styles.container}>
      <TopBarTextButton title={t('cancel')} onPress={cancel} titleStyle={styles.cancelButton} />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.header}>{t('connectToWallet', { dappName: 'helo' })}</Text>

        <Text style={styles.share}>{t('shareInfo')}</Text>

        <View style={styles.sectionDivider}>
          <Text style={styles.sectionHeaderText}>{t('phoneNumber')}</Text>
          <PhoneNumberWithFlag e164PhoneNumber={''} />
          <Text style={styles.sectionHeaderText}>{t('address')}</Text>
          <AccountNumber address={''} location={Screens.DrawerNavigator} />
        </View>
        <Button
          style={styles.button}
          type={BtnTypes.PRIMARY}
          size={BtnSizes.MEDIUM}
          text={t('allow')}
          onPress={linkBack}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    ...fontStyles.h1,
    textAlign: 'center',
    paddingBottom: 16,
  },
  share: {
    ...fontStyles.regular,
    color: colors.gray4,
    textAlign: 'center',
  },
  sectionDivider: {
    alignItems: 'center',
    width: 200,
  },
  sectionHeaderText: {
    ...fontStyles.label,
    marginTop: 16,
    marginBottom: 4,
  },
  button: {
    marginTop: 24,
  },
  cancelButton: {
    color: colors.dark,
  },
})
