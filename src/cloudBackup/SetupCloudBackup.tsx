import * as React from 'react'
import { useState } from 'react'
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { getTorusPrivateKey } from 'src/cloudBackup/index'
import Logger from 'src/utils/Logger'
import ThresholdKey from '@tkey/default'
import TorusServiceProviderBase from '@tkey/service-provider-base'
import TorusStorageLayer from '@tkey/storage-layer-torus'
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import auth from '@react-native-firebase/auth'

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

export async function getFirebaseToken(iosClientId: string) {
  GoogleSignin.configure({ iosClientId })
  const { idToken } = await GoogleSignin.signIn()
  Logger.info(TAG, `google idToken: ${idToken}`)
  const googleCredential = auth.GoogleAuthProvider.credential(idToken)
  await auth().signInWithCredential(googleCredential)
  const firebaseToken = await auth().currentUser?.getIdToken() // todo should probly skip the firebase auth step and just use the google id token directly
  Logger.info(TAG, `firebaseToken: ${firebaseToken}`)
  if (!firebaseToken) throw new Error('missing firebase token')
  return firebaseToken
}

export async function triggerLogin() {
  try {
    // login with firebase
    // const iosClientId = '1067724576910-t5anhsbi8gq2u1r91969ijbpc66kaqnk.apps.googleusercontent.com'
    // const firebaseToken = await getFirebaseToken(iosClientId)
    // const torusPrivateKey = await getTorusPrivateKey({
    //   verifier: 'firebase-oauth-alfajores',
    //   jwt: firebaseToken,
    //   network: 'testnet',
    // })

    // login with Valora-signed JWT
    const jwt = await getValoraVerifierJWT({
      phoneNumber: '15551234567',
      verificationCode: '123456',
    })
    const torusPrivateKey = await getTorusPrivateKey({
      verifier: 'phone-number-verification-alfajores',
      jwt,
      network: 'testnet',
    })

    Logger.debug(TAG, `torusPrivateKey: ${torusPrivateKey}`)

    // initialize tkey
    // const postboxKey = new BN(privateKey, 16)
    // tKey.serviceProvider.postboxKey = postboxKey
    // const keyDetails = await tKey.initialize() // fixme somehow this starts off with 2 shares instead of 1.. (??)
    // Logger.info(TAG, `tkey initialized with keyDetails: ${JSON.stringify(keyDetails)}`)
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
