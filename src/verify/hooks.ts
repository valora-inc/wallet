import { useRef, useState } from 'react'
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
  const verificationCodeRequested = useRef(false)

  const dispatch = useDispatch()
  const address = useSelector(walletAddressSelector)

  const [verificationStatus, setVerificationStatus] = useState(PhoneNumberVerificationStatus.NONE)
  const [verificationId, setVerificationId] = useState('')
  const [smsCode, setSmsCode] = useState('')

  const handleRequestVerificationCodeError = (error: Error) => {
    Logger.debug(
      `${TAG}/requestVerificationCode`,
      'Received error from verifyPhoneNumber service',
      error
    )
    dispatch(showError(ErrorMessages.PHONE_NUMBER_VERIFICATION_FAILURE))
  }

  const handleVerifySmsError = (error: Error) => {
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
      if (verificationCodeRequested.current) {
        Logger.debug(
          `${TAG}/requestVerificationCode`,
          'Skipping request to verifyPhoneNumber since a request was already initiated'
        )
        // prevent request from being fired multiple times
        return
      }

      Logger.debug(`${TAG}/requestVerificationCode`, 'Initiating request to verifyPhoneNumber')
      const signedMessage = await retrieveSignedMessage()

      return fetch(networkConfig.verifyPhoneNumberUrl, {
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
    },
    [],
    {
      onError: handleRequestVerificationCodeError,
      onSuccess: async (response?: Response) => {
        if (!response) {
          return
        }

        if (response.ok) {
          const { data } = await response.json()
          setVerificationId(data.verificationId)
          verificationCodeRequested.current = true
          Logger.debug(
            `${TAG}/requestVerificationCode`,
            'Successfully initiated phone number verification with verificationId: ',
            data.verificationId
          )
        } else {
          handleRequestVerificationCodeError(new Error(await response.text()))
        }
      },
    }
  )

  useAsync(
    async () => {
      if (!smsCode) {
        Logger.debug(
          `${TAG}/validateVerificationCode`,
          'Not initiating request to verifySmsCode since smsCode is empty'
        )
        return
      }

      Logger.debug(
        `${TAG}/validateVerificationCode`,
        'Initiating request to verifySmsCode with verificationId: ',
        verificationId
      )
      setVerificationStatus(PhoneNumberVerificationStatus.VERIFYING)

      const signedMessage = await retrieveSignedMessage()
      return fetch(networkConfig.verifySmsCodeUrl, {
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
    },
    [smsCode],
    {
      onSuccess: async (response?: Response) => {
        if (!response) {
          return
        }

        if (response.ok) {
          Logger.debug(`${TAG}/validateVerificationCode`, 'Successfully verified phone number')
          setVerificationStatus(PhoneNumberVerificationStatus.SUCCESSFUL)
          dispatch(setPhoneNumber(phoneNumber, countryCode))
          // TODO store verification status in new redux variable so that the
          // existing one can be used for background migration
        } else {
          handleVerifySmsError(new Error(await response.text()))
        }
      },
      onError: handleVerifySmsError,
    }
  )

  return {
    setSmsCode,
    verificationStatus,
  }
}
