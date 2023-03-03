import { createUser, verifyEmail } from '@usecapsule/react-native-wallet'
import { CapsuleBaseWallet } from '@usecapsule/react-native-wallet/src/CapsuleWallet'
import { login, verifyLogin } from '@usecapsule/react-native-wallet/src/helpers'
import { uploadKeyshare } from '@usecapsule/react-native-wallet/src/transmissionUtils'
import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { initializeAccount } from 'src/account/actions'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Logger from 'src/utils/Logger'
import { setCapsuleIdentity } from 'src/web3/actions'
import { getWalletAsync } from 'src/web3/contracts'
import { accountAddressSelector, capsuleAccountSelector } from 'src/web3/selectors'

const TAG = 'useCapsule'

export const SESSION_TIMEOUT = 5 * 60 * 1000

export const useCapsule = () => {
  const dispatch = useDispatch()
  const address = useSelector(accountAddressSelector)
  const [cachedSecret, setSecret] = useState<any>(null)
  const { email: cachedEmail, id: cachedId } = useSelector(capsuleAccountSelector)

  const authenticate = async (email: string) => {
    try {
      const { userId } = await createUser({ email })
      dispatch(setCapsuleIdentity(email, userId))
      navigate(Screens.CapsuleEmailVerification, {})
    } catch (error: any) {
      Logger.error(TAG, '@authenticate Unable to authenticate', error)
    }
  }

  const verify = async (code: string) => {
    try {
      await verifyEmail(cachedId!, { verificationCode: code })
      dispatch(initializeAccount())
      navigate(Screens.NameAndPicture)
    } catch (error: any) {
      Logger.error(TAG, '@verify Unable to verify', error)
    }
  }

  const initiateLogin = async (email: string) => {
    try {
      // @todo Call recovery veification with email, code,
      await login(email)
      dispatch(setCapsuleIdentity(email, cachedId || ''))
      navigate(Screens.CapsuleEmailVerification, { isExistingUser: true })
    } catch (error: any) {
      Logger.error(TAG, '@loginWithKeyshare Unable to send code', error)
      Logger.error(TAG, '@loginWithKeyshare Unable to send code', error.response.data)
    }
  }

  const loginWithKeyshare = async (code: string) => {
    try {
      if (!cachedEmail) {
        return
      }
      const { data: loginResponse } = await verifyLogin(code)
      dispatch(setCapsuleIdentity(cachedEmail, loginResponse.userId))
      navigate(Screens.KeyshareScanner)
    } catch (error: any) {
      Logger.error(TAG, '@loginWithKeyshare Unable to login', error)
      Logger.error(TAG, '@loginWithKeyshare Unable to login', error.response.data)
    }
  }

  const encryptAndShareSecret = async () => {
    const refreshSecret = async () => {
      try {
        const wallet: CapsuleBaseWallet = await getWalletAsync()
        if (!address) throw new Error('Account not yet initialized.')
        const secret = await uploadKeyshare(wallet, address)
        setSecret(secret)
      } catch (error: any) {
        Logger.error(`${TAG} @encryptAndShareSecret Failed`, JSON.stringify(error))
      }
    }
    await refreshSecret()
    return {
      refreshSecret,
    }
  }

  return {
    authenticate,
    verify,
    initiateLogin,
    loginWithKeyshare,
    encryptAndShareSecret,
    userKeyshareSecret: cachedSecret,
  }
}
