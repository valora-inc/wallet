import * as React from 'react'
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
// import {
//   useSelector,
// } from 'react-redux'
import Logger from 'src/utils/Logger'
import { useEffect, useState } from 'react'

// @ts-ignore // todo add types file for customauth
import CustomAuth from '@toruslabs/customauth-react-native-sdk'

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
    const loginDetails = await CustomAuth.triggerLogin({
      typeOfLogin: 'google',
      verifier: 'google-lrc',
      clientId: '221898609709-obfn3p63741l5333093430j3qeiinaa8.apps.googleusercontent.com',
      // jwtParams,
    })
    Logger.info(TAG, loginDetails)
  } catch (error) {
    Logger.error(TAG, 'getTorusKey failed', error)
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

  useEffect(() => {
    try {
      CustomAuth.init({
        browserRedirectUri: 'https://scripts.toruswallet.io/redirect.html',
        redirectUri: 'torusapp://org.torusresearch.customauthexample/redirect',
        network: 'testnet', // details for test net
        enableLogging: true,
        enableOneKey: false,
      })
    } catch (error) {
      Logger.error(TAG, 'error initializing customauth', error)
    }
  }, [])

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
