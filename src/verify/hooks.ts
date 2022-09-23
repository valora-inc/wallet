import { useState } from 'react'
import { useAsync } from 'react-async-hook'
import { Platform } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { useSelector } from 'react-redux'
import { retrieveSignedMessage } from 'src/pincode/authentication'
import Logger from 'src/utils/Logger'
import networkConfig from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'

const TAG = 'verify/hooks'

const FETCH_TIMEOUT = 30 * 1000 // 30 secs

const delay = (timeout: number, error: Error) =>
  new Promise((resolve, reject) => setTimeout(() => reject(error), timeout))

// CB TEMPORARY HOTFIX: helper for Komenci endpoint to ensure availability
export function useAsyncKomenciReadiness() {
  return useAsync<boolean>(async () => {
    Logger.info(TAG, 'Determining komenci readiness...')
    try {
      const response = (await Promise.race([
        fetch(networkConfig.komenciLoadCheckEndpoint),
        delay(FETCH_TIMEOUT, new Error('Timeout Error')),
      ])) as Response
      const isReady = response.ok // status in the range 200-299
      Logger.info(TAG, `Komenci isReady=${isReady} (statusCode=${response.status})`)
      return isReady
    } catch (error) {
      Logger.error(TAG, 'Failed to determine komenci readiness', error)
      throw error
    }
  }, [])
}

export enum PhoneNumberVerificationStatus {
  NONE,
  REQUESTING_VERIFICATION_CODE,
  AWAITING_USER_INPUT,
  VERIFYING,
  SUCCESSFUL,
  FAILED,
}

export function useVerifyPhoneNumber(phoneNumber: string) {
  const address = useSelector(walletAddressSelector)

  const [verificationStatus, setVerificationStatus] = useState(PhoneNumberVerificationStatus.NONE)
  const [verificationId, setVerificationId] = useState('')

  const requestVerificationCode = async () => {
    setVerificationStatus(PhoneNumberVerificationStatus.REQUESTING_VERIFICATION_CODE)

    const signedMessage = await retrieveSignedMessage()
    const response: Response = await fetch(networkConfig.verifyPhoneNumberUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Valora ${address}:${signedMessage}`,
      },
      body: JSON.stringify({
        phoneNumber,
        clientPlatform: Platform.OS,
        clientVersion: DeviceInfo.getVersion(),
      }),
    })

    if (response.ok) {
      const result = await response.json()
      setVerificationId(result.verificationId)
      setVerificationStatus(PhoneNumberVerificationStatus.AWAITING_USER_INPUT)
    } else {
      Logger.debug(
        TAG,
        'startPhoneNumberVerificationSaga received error from verify phone number service'
      )
      setVerificationStatus(PhoneNumberVerificationStatus.FAILED)
      // dispatch(showError(ErrorMessages.START_PHONE_VERIFICATION_FAILURE))
    }
  }

  const validateVerificationCode = async (smsCode: string) => {
    setVerificationStatus(PhoneNumberVerificationStatus.VERIFYING)

    const signedMessage = await retrieveSignedMessage()
    const response: Response = await fetch(networkConfig.verifyPhoneNumberUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Valora ${address}:${signedMessage}`,
      },
      body: JSON.stringify({
        phoneNumber,
        verificationId,
        smsCode,
        clientPlatform: Platform.OS,
        clientVersion: DeviceInfo.getVersion(),
      }),
    })

    if (response.ok) {
      setVerificationStatus(PhoneNumberVerificationStatus.SUCCESSFUL)
    } else {
      Logger.debug(
        TAG,
        'startPhoneNumberVerificationSaga received error from verify phone number service'
      )
      setVerificationStatus(PhoneNumberVerificationStatus.FAILED)
      // dispatch(showError(ErrorMessages.START_PHONE_VERIFICATION_FAILURE))
    }
  }

  return {
    requestVerificationCode,
    validateVerificationCode,
    verificationStatus,
  }
}
