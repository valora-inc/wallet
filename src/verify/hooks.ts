import { hexToBuffer } from '@celo/utils/lib/address'
import { compressedPubKey } from '@celo/utils/lib/dataEncryptionKey'
import { useRef, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { Platform } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { useDispatch, useSelector } from 'react-redux'
import { showError } from 'src/alert/actions'
import { PhoneVerificationEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { phoneNumberVerificationCompleted } from 'src/app/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { retrieveSignedMessage } from 'src/pincode/authentication'
import Logger from 'src/utils/Logger'
import networkConfig from 'src/web3/networkConfig'
import { dataEncryptionKeySelector, walletAddressSelector } from 'src/web3/selectors'

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
  SUCCESSFUL,
  FAILED,
}

export function useVerifyPhoneNumber(phoneNumber: string, countryCallingCode: string) {
  const verificationCodeRequested = useRef(false)

  const dispatch = useDispatch()
  const address = useSelector(walletAddressSelector)
  const privateDataEncryptionKey = useSelector(dataEncryptionKeySelector)

  const [verificationStatus, setVerificationStatus] = useState(PhoneNumberVerificationStatus.NONE)
  const [verificationId, setVerificationId] = useState('')
  const [smsCode, setSmsCode] = useState('')
  const [shouldResendSms, setShouldResendSms] = useState(false)

  const resendSms = () => {
    verificationCodeRequested.current = false
    setShouldResendSms(true)
  }

  const handleRequestVerificationCodeError = (error: Error) => {
    Logger.debug(
      `${TAG}/requestVerificationCode`,
      'Received error from verifyPhoneNumber service',
      error
    )
    setShouldResendSms(false)
    dispatch(showError(ErrorMessages.PHONE_NUMBER_VERIFICATION_FAILURE))
  }

  const handleVerifySmsError = (error: Error) => {
    ValoraAnalytics.track(PhoneVerificationEvents.phone_verification_code_verify_error)
    Logger.debug(
      `${TAG}/validateVerificationCode`,
      `Received error from verifySmsCode service for verificationId: ${verificationId}`,
      error
    )
    setVerificationStatus(PhoneNumberVerificationStatus.FAILED)
    setSmsCode('')
  }

  useAsync(
    async () => {
      if (verificationCodeRequested.current && !shouldResendSms) {
        // verificationCodeRequested prevents the verification request from
        // being fired multiple times, due to hot reloading during development
        Logger.debug(
          `${TAG}/requestVerificationCode`,
          'Skipping request to verifyPhoneNumber since a request was already initiated'
        )
        return
      }

      if (!privateDataEncryptionKey) {
        throw new Error('No data encryption key was found in the store. This should never happen.')
      }

      Logger.debug(`${TAG}/requestVerificationCode`, 'Initiating request to verifyPhoneNumber')
      const signedMessage = await retrieveSignedMessage()

      const response = await fetch(networkConfig.verifyPhoneNumberUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Valora ${address}:${signedMessage}`,
        },
        body: JSON.stringify({
          phoneNumber,
          clientPlatform: Platform.OS,
          clientVersion: DeviceInfo.getVersion(),
          clientBundleId: DeviceInfo.getBundleId(),
          publicDataEncryptionKey: compressedPubKey(hexToBuffer(privateDataEncryptionKey)),
        }),
      })
      if (response.ok) {
        return response
      } else {
        throw new Error(await response.text())
      }
    },

    [phoneNumber, shouldResendSms],
    {
      onError: handleRequestVerificationCodeError,
      onSuccess: async (response?: Response) => {
        if (!response) {
          return
        }

        const { data } = await response.json()
        setVerificationId(data.verificationId)
        setShouldResendSms(false)
        verificationCodeRequested.current = true

        ValoraAnalytics.track(PhoneVerificationEvents.phone_verification_code_request_success)
        Logger.debug(
          `${TAG}/requestVerificationCode`,
          'Successfully initiated phone number verification with verificationId: ',
          data.verificationId
        )
      },
    }
  )

  useAsync(
    async () => {
      if (!smsCode) {
        return
      }

      ValoraAnalytics.track(PhoneVerificationEvents.phone_verification_code_verify_start)
      Logger.debug(
        `${TAG}/validateVerificationCode`,
        'Initiating request to verifySmsCode with verificationId: ',
        verificationId
      )

      const signedMessage = await retrieveSignedMessage()
      const response = await fetch(networkConfig.verifySmsCodeUrl, {
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
        return response
      } else {
        throw new Error(await response.text())
      }
    },
    [smsCode, phoneNumber],
    {
      onSuccess: async (response?: Response) => {
        if (!response) {
          return
        }

        ValoraAnalytics.track(PhoneVerificationEvents.phone_verification_code_verify_success)
        Logger.debug(`${TAG}/validateVerificationCode`, 'Successfully verified phone number')
        setVerificationStatus(PhoneNumberVerificationStatus.SUCCESSFUL)
        dispatch(phoneNumberVerificationCompleted(phoneNumber, countryCallingCode))
      },
      onError: handleVerifySmsError,
    }
  )

  return {
    resendSms,
    setSmsCode,
    verificationStatus,
  }
}
