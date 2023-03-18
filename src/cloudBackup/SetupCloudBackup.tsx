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
import Web3Auth, {
  OPENLOGIN_NETWORK,
  WebBrowserAuthSessionResult,
  WebBrowserOpenOptions,
} from '@web3auth/react-native-sdk'
import ThresholdKey from '@tkey/default'
import TorusServiceProviderBase from '@tkey/service-provider-base'
import TorusStorageLayer from '@tkey/storage-layer-torus'
import { Web3AuthCore } from '@web3auth/core'
// import { BN } from 'ethereumjs-util'
import { OpenloginAdapter } from '@web3auth/openlogin-adapter'
// import firebase from '@react-native-firebase/app'
// import auth from '@react-native-firebase/auth'
// import { GoogleAuthProvider, getAuth, signInWithPopup } from '@react-native-firebase/auth'
import { WALLET_ADAPTERS } from '@web3auth/base'
import { GoogleSignin } from '@react-native-google-signin/google-signin'
import auth from '@react-native-firebase/auth'
import { IWebBrowser } from '@web3auth/react-native-sdk/src/types/IWebBrowser'

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

export async function getWeb3authCore(clientId: string) {
  const web3auth = new Web3AuthCore({
    // todo check if Web3AuthCore works on mobile. may need to use RN SDK instead.
    clientId: clientId,
    web3AuthNetwork: 'testnet',
    chainConfig: {
      chainNamespace: 'eip155',
      chainId: '44787', // todo set from env var. this is for alfajores. see https://docs.celo.org/network
      rpcTarget: 'https://alfajores-forno.celo-testnet.org', // todo set from env var
    },
  })
  await web3auth.init()
  Logger.info(TAG, 'web3auth initialized')
  const openLoginAdapter = new OpenloginAdapter({
    adapterSettings: {
      clientId: clientId,
      uxMode: 'redirect',
      loginConfig: {
        jwt: {
          // todo see if 'name' field is needed
          verifier: 'firebase-oauth-alfajores',
          typeOfLogin: 'jwt',
          clientId: '1067724576910-j7aqq89gfe5c30lnd9u8jkt7837fsprm.apps.googleusercontent.com',
        },
      },
    },
  })
  Logger.info(TAG, `created openlogin adapter with name ${openLoginAdapter.name}`)
  web3auth.clearCache()
  try {
    // todo be smarter about this. there are other statuses that could be relevant
    web3auth.configureAdapter(openLoginAdapter)
    Logger.info(TAG, 'configured adapter')
  } catch (e) {
    Logger.info(TAG, `error configuring adapter: ${e}`)
  }
  return web3auth
}

export async function loginWithWeb3authCore(web3auth: Web3AuthCore, firebaseToken: string) {
  // fixme getting this error: triggerLogin failed :: Wallet is not found, Please add wallet adapter for openlogin wallet, before connecting
  //  not sure why, because when I try to configureAdapter with an adapter named openLogin, I get this error: {"name":"WalletInitializationError","code":5003,"message":"Wallet is not ready yet, Adapter is already initialized"}
  await web3auth.connectTo(WALLET_ADAPTERS.OPENLOGIN, {
    loginProvider: 'jwt',
    extraLoginOptions: {
      id_token: firebaseToken,
      verifierIdField: 'sub',
      // todo check if 'domain' is needed
    },
  })
}

export class FakeWebBrowser implements IWebBrowser {
  async openAuthSessionAsync(
    url: string,
    redirectUrl: string,
    browserParams?: WebBrowserOpenOptions
  ): Promise<WebBrowserAuthSessionResult> {
    return {
      type: 'success',
      url: 'celo://wallet',
    }
  }
}

import * as WebBrowser from '@toruslabs/react-native-web-browser'
import { getTorusPrivateKey } from 'src/cloudBackup/index'

export async function getWeb3authRN(clientId: string) {
  return new Web3Auth(WebBrowser, {
    clientId,
    network: OPENLOGIN_NETWORK.TESTNET,
    loginConfig: {
      jwt: {
        verifier: 'firebase-oauth-alfajores',
        typeOfLogin: 'jwt',
        clientId: '1067724576910-j7aqq89gfe5c30lnd9u8jkt7837fsprm.apps.googleusercontent.com',
      },
    },
    redirectUrl: 'celo://wallet',
  })
}

export async function loginWithWeb3authRN(web3auth: Web3Auth, firebaseToken: string) {
  // fixme this works, but it gives the user ANOTHER sign-in prompt, this time with openlogin.com, and pulls up a webview just to give a stupid message like 'constructing your key on sdk.openlogin.com'. UGH
  //  tried using fake web browser implementation, but got this error: JSON Parse error: Unexpected EOF in parse@[native code]
  return web3auth.login({
    loginProvider: 'jwt',
    extraLoginOptions: {
      id_token: firebaseToken,
      verifierIdField: 'sub',
      domain: 'celo://wallet',
    },
  })
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
    const iosClientId = '1067724576910-t5anhsbi8gq2u1r91969ijbpc66kaqnk.apps.googleusercontent.com'
    // const clientId = 'my-client-id' // fixme replace with real client id (probly from env vars)

    // const web3auth = await getWeb3authCore(clientId)
    // const firebaseToken = await getFirebaseToken(iosClientId)
    // await loginWithWeb3authCore(web3auth, firebaseToken)

    // const web3auth = await getWeb3authRN(clientId)
    // const firebaseToken = await getFirebaseToken(iosClientId)
    // const userInfo = await loginWithWeb3authRN(web3auth, firebaseToken)
    // Logger.info(TAG, `userInfo: ${JSON.stringify(userInfo)}`)

    // DIY customAuth login
    const firebaseToken = await getFirebaseToken(iosClientId)
    const torusPrivateKey = await getTorusPrivateKey({
      verifier: 'firebase-oauth-alfajores',
      jwt: firebaseToken,
      network: 'testnet',
    })
    Logger.debug(TAG, `torusPrivateKey: ${torusPrivateKey}`) // for Charlie's email this starts with 4feb9 on testnet

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
