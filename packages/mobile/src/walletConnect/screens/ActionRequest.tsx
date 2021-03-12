import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button'
import PhoneNumberWithFlag from '@celo/react-components/components/PhoneNumberWithFlag'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AccountNumber from 'src/components/AccountNumber'
import { navigateBack, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import Logger from 'src/utils/Logger'

const TAG = 'WalletConnect/RequestScreen'

type RouteProps = StackScreenProps<StackParamList, Screens.WalletConnectRequest>
type Props = RouteProps

// yield put()
//   const {
//     topic,
//     // @ts-ignore todo: ask Pedro why this isn't typed
//     payload: { id, method },
//   } = payload;

//   let result: any

//   if (method === SupportedMethods.personalSign) {
//     const { payload, from } = parsePersonalSign(event)
//     result = await wallet.signPersonalMessage(from, payload)
//   } else if (method === SupportedMethods.signTypedData) {
//     const { from, payload } = parseSignTypedData(event)
//     result = await wallet.signTypedData(from, payload)
//   } else if (method === SupportedMethods.signTransaction) {
//     const tx = parseSignTransaction(event)
//     result = await wallet.signTransaction(tx)
//   } else if (method === SupportedMethods.computeSharedSecret) {
//     const { from, publicKey } = parseComputeSharedSecret(event)
//     result = (await wallet.computeSharedSecret(from, publicKey)).toString('hex')
//   } else if (method === SupportedMethods.decrypt) {
//     const { from, payload } = parseDecrypt(event)
//     result = (await wallet.decrypt(from, payload)).toString('hex')
//   } else {
//     // client.reject({})
//     // in memory wallet should always approve actions
//     debug('unknown method', method)
//     return
//   }

//   return client.respond({
//     topic,
//     response: {
//       id,
//       jsonrpc: '2.0',
//       result,
//     },
//   })
// }

export default function WalletConnectRequestScreen(props: Props) {
  const linkBack = () => {
    const { account, route, phoneNumber } = this.props

    const request = route.params.dappKitRequest

    if (!request) {
      Logger.error(TAG, 'No request found in navigation props')
      return
    }
    if (!account) {
      Logger.error(TAG, 'No account set up for this wallet')
      return
    }
    if (!phoneNumber) {
      Logger.error(TAG, 'No phone number set up for this wallet')
      return
    }
    navigateHome({ onAfterNavigate: () => this.props.approveAccountAuth(request) })
  }

  const cancel = () => {
    navigateBack()
  }

  const { t, account, phoneNumber, route } = this.props
  const { dappName } = route.params.dappKitRequest
  return (
    <SafeAreaView style={styles.container}>
      <TopBarTextButton title={t('cancel')} onPress={cancel} titleStyle={styles.cancelButton} />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {!!dappName && <Text style={styles.header}>{t('connectToWallet', { dappName })}</Text>}

        <Text style={styles.share}>{t('shareInfo')}</Text>

        <View style={styles.sectionDivider}>
          <Text style={styles.sectionHeaderText}>{t('phoneNumber')}</Text>
          <PhoneNumberWithFlag e164PhoneNumber={phoneNumber || ''} />
          <Text style={styles.sectionHeaderText}>{t('address')}</Text>
          <AccountNumber address={account || ''} location={Screens.DrawerNavigator} />
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
