import * as React from 'react'
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
// import {
//   useSelector,
// } from 'react-redux'
import Logger from 'src/utils/Logger'
import { useState } from 'react'
import Web3Auth, { OPENLOGIN_NETWORK } from '@web3auth/react-native-sdk'
import * as WebBrowser from '@toruslabs/react-native-web-browser'
// import {OpenloginAdapter} from '@web3auth/openlogin-adapter'

// import { navigateHome } from 'src/navigator/NavigationService'
// import { e164NumberSelector } from 'src/account/selectors'

const TAG = 'SetupCloudBackup'

export async function getValoraVerifierJWT({
  phoneNumber,
  verificationCode,
}: {
  phoneNumber: string
  verificationCode: string
}) {
  const url =
    'https://us-central1-celo-mobile-alfajores.cloudfunctions.net/verifyPhoneNumberForWeb3Auth'
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ phoneNumberIdentifier: phoneNumber, authCode: verificationCode }),
  }
  Logger.info(TAG, 'about to fetch jwt')
  try {
    const response = await fetch(url, requestOptions)
    if (!response.ok) {
      throw new Error(`Error posting to verifyPhoneNumberForWeb3Auth: ${response.status}`)
    }
    const { jwt } = await response.json()
    return jwt
  } catch (e) {
    Logger.error(TAG, `Error getting valora verifier jwt: ${e}`)
    throw e
  }
}

export async function triggerLogin() {
  try {
    const clientId = 'my-client-id' // fixme replace with real client id (probly from env vars)
    // const openloginAdapter = new OpenloginAdapter({
    //   adapterSettings: {
    //     clientId, //Optional - Provide only if you haven't provided it in the Web3Auth Instantiation Code
    //     network: "cyan", // Optional - Provide only if you haven't provided it in the Web3Auth Instantiation Code
    //     uxMode: "popup",
    //     whiteLabel: {
    //       name: "Your app Name",
    //       logoLight: "https://web3auth.io/images/w3a-L-Favicon-1.svg",
    //       logoDark: "https://web3auth.io/images/w3a-D-Favicon-1.svg",
    //       defaultLanguage: "en",
    //       dark: true, // whether to enable dark mode. defaultValue: false
    //     },
    //   },
    // });
    const web3auth = new Web3Auth(WebBrowser, {
      // TODO check if modal looks lightweight enough (just 'sign in with google')
      clientId,
      network: OPENLOGIN_NETWORK.TESTNET,
      loginConfig: {
        google: {
          verifier: 'google-lrc', // todo replace with our own custom verifier
          typeOfLogin: 'google',
          clientId: '221898609709-obfn3p63741l5333093430j3qeiinaa8.apps.googleusercontent.com', // todo replace with our own google client id
        },
      },
    })
    const loginDetails = await web3auth.login({
      loginProvider: 'google',
      mfaLevel: 'none',
      redirectUrl: 'celo://wallet',
    })
    Logger.info(TAG, `name: ${loginDetails.userInfo?.name}`)
    // todo set private key on tKey
  } catch (error) {
    Logger.error(TAG, 'triggerLogin failed', error)
  }
}

function SetupCloudBackup() {
  // const dispatch = useDispatch()
  // const phoneNumber = useSelector(e164NumberSelector) ?? '+11234567890'
  const [backupButtonClickable, setBackupButtonClickable] = useState(true)

  const onPressBackup = () => {
    setBackupButtonClickable(false)
    void triggerLogin().then(() => {
      setBackupButtonClickable(true)
    })
  }

  // const onPressGroovy = () => {
  //   navigateHome()
  // }

  // const doneSettingUpContents = (
  //   <>
  //     <Text style={styles.importWalletFromCloudTitle}>
  //       {'Your account is backed up in the cloud'}
  //     </Text>
  //     <Text style={styles.importWalletFromCloudBody}>
  //       You backed up your Valora account with your Google account.
  //     </Text>
  //     <Text style={styles.importWalletFromCloudBody}>
  //       If you lose your phone or forget your PIN, you can always restore your account by logging in
  //       with Google and verifying your phone number.
  //     </Text>
  //     <Button text={'Groovy'} onPress={onPressGroovy} />
  //   </>
  // )

  const beginSetupContents = (
    <>
      <Text style={styles.importWalletFromCloudTitle}>{'Never lose access to your account'}</Text>
      <Text style={styles.importWalletFromCloudBody}>
        {
          'Connect your Google account to make sure you can still access your funds if you lose your phone or forget your 24-word recovery phrase.'
        }
      </Text>
      <Text style={styles.importWalletFromCloudBody}>
        {
          'Secured with multi-factor authentication and non-custodial encrypted storage. No one but you will be able to access your funds.'
        }
      </Text>
      <Button
        text={'Back up with Google'}
        onPress={onPressBackup}
        showLoading={!backupButtonClickable}
        testID="BackUpWithGoogle"
        type={BtnTypes.PRIMARY}
        size={BtnSizes.MEDIUM}
      />
    </>
  )
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View testID="SetupCloudBackupContainer" style={styles.importWalletFromCloudContainer}>
          {beginSetupContents}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  importWalletFromCloudContainer: {
    flexGrow: 1,
    paddingTop: Spacing.Thick24,
    paddingHorizontal: Spacing.Regular16,
  },
  importWalletFromCloudTitle: {
    ...fontStyles.h1,
  },
  importWalletFromCloudBody: {
    ...fontStyles.regular,
    marginVertical: Spacing.Regular16,
    flexGrow: 1,
  },
})

export default SetupCloudBackup
