import * as React from 'react'
import { useState } from 'react'
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
// import {
//   useSelector,
// } from 'react-redux'
import Logger from 'src/utils/Logger'
import Web3Auth, { OPENLOGIN_NETWORK } from '@web3auth/react-native-sdk'
import * as WebBrowser from '@toruslabs/react-native-web-browser'
import ThresholdKey from '@tkey/default'
import TorusServiceProviderBase from '@tkey/service-provider-base'
import TorusStorageLayer from '@tkey/storage-layer-torus'
import { BN } from 'ethereumjs-util'
// import {OpenloginAdapter} from '@web3auth/openlogin-adapter'

// import { navigateHome } from 'src/navigator/NavigationService'
// import { e164NumberSelector } from 'src/account/selectors'

const TAG = 'SetupCloudBackup'

const tKey = new ThresholdKey({
  serviceProvider: new TorusServiceProviderBase({
    enableLogging: true,
  }),
  storageLayer: new TorusStorageLayer({
    hostUrl: 'https://metadata.tor.us',
  }),
})

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
    const web3auth = new Web3Auth(WebBrowser, {
      // TODO try out UI white-labeling
      // sdkUrl: '',  // TODO see if this can be used to remove the annoying blue loading circles
      clientId, // fixme replace with real client id from env vars
      network: OPENLOGIN_NETWORK.TESTNET,
      loginConfig: {
        google: {
          verifier: 'google-oauth-alfajores',
          typeOfLogin: 'google',
          clientId: '1067724576910-j7aqq89gfe5c30lnd9u8jkt7837fsprm.apps.googleusercontent.com',
          // logoLight: 'todo',
          // logoDark: 'todo',
        },
      },
      redirectUrl: 'celo://wallet',
    })
    // await web3auth.logout({clientId})
    const loginDetails = await web3auth.login({
      loginProvider: 'google',
      mfaLevel: 'none',
      // redirectUrl: 'celo://wallet',
    })
    Logger.info(TAG, `name: ${loginDetails.userInfo?.name}`)
    if (!loginDetails.privKey) throw new Error('No private key returned from web3auth')

    // initialize tkey
    const postboxKey = new BN(loginDetails.privKey, 16)
    tKey.serviceProvider.postboxKey = postboxKey
    const keyDetails = await tKey.initialize() // fixme somehow this starts off with 2 shares instead of 1.. (??)
    Logger.info(TAG, `tkey initialized with keyDetails: ${JSON.stringify(keyDetails)}`)
  } catch (error) {
    Logger.error(TAG, 'triggerLogin failed', error)
  }
}

export async function getTKeyDetails() {
  try {
    await tKey.initialize()
    Logger.info(TAG, `tKey details: ${JSON.stringify(tKey.getKeyDetails())}`)
  } catch (error) {
    Logger.error(TAG, 'getTKeyDetails failed', error)
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

  const onPressDetails = () => {
    void getTKeyDetails()
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
      <Button
        text={'Get details'}
        onPress={onPressDetails}
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
