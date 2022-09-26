import { useState } from 'react'
import { useAsync } from 'react-async-hook'
import { Platform } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { useDispatch, useSelector } from 'react-redux'
import { setPhoneNumber } from 'src/account/actions'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
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
  VERIFYING,
  SUCCESSFUL,
  FAILED,
}

export function useVerifyPhoneNumber(phoneNumber: string, countryCode: string) {
  const dispatch = useDispatch()
  const address = useSelector(walletAddressSelector)

  const [verificationStatus, setVerificationStatus] = useState(PhoneNumberVerificationStatus.NONE)
  const [verificationId, setVerificationId] = useState('')

  const requestVerificationCode = async () => {
    Logger.debug(`${TAG}/requestVerificationCode`, 'Initiating request to verifyPhoneNumber')
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
      Logger.debug(
        `${TAG}/requestVerificationCode`,
        'Successfully initiated phone number verification with verificationId: ',
        verificationId
      )
      const result = await response.json()
      setVerificationId(result.verificationId)
    } else {
      Logger.debug(
        `${TAG}/requestVerificationCode`,
        'Received error from verifyPhoneNumber service'
      )
      setVerificationStatus(PhoneNumberVerificationStatus.FAILED)
      dispatch(showError(ErrorMessages.PHONE_NUMBER_VERIFICATION_FAILURE))
    }
  }

  const validateVerificationCode = async (smsCode: string) => {
    Logger.debug(`${TAG}/validateVerificationCode`, 'Initiating request to verifySmsCode')
    setVerificationStatus(PhoneNumberVerificationStatus.VERIFYING)

    const signedMessage = await retrieveSignedMessage()
    const response: Response = await fetch(networkConfig.verifySmsCodeUrl, {
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
      Logger.debug(`${TAG}/validateVerificationCode`, 'Successfully verified phone number')
      setVerificationStatus(PhoneNumberVerificationStatus.SUCCESSFUL)
      dispatch(setPhoneNumber(phoneNumber, countryCode))
      // TODO store verification status in new redux variable so that the
      // existing one can be used for background migration
    } else {
      Logger.debug(TAG, 'Received error from verifySmsCode service')
      setVerificationStatus(PhoneNumberVerificationStatus.FAILED)
      dispatch(showError(ErrorMessages.PHONE_NUMBER_VERIFICATION_FAILURE))
    }
  }

  return {
    requestVerificationCode,
    validateVerificationCode,
    verificationStatus,
  }
}
