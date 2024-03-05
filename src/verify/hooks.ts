import { compressedPubKey } from '@celo/cryptographic-utils/lib/dataEncryptionKey'
import getPhoneHash from '@celo/phone-utils/lib/getPhoneHash'
import { hexToBuffer } from '@celo/utils/lib/address'
import { useEffect, useRef, useState } from 'react'
import { useAsync, useAsyncCallback } from 'react-async-hook'
import { Platform } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { e164NumberSelector } from 'src/account/selectors'
import { showError } from 'src/alert/actions'
import { PhoneVerificationEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { phoneNumberRevoked, phoneNumberVerificationCompleted } from 'src/app/actions'
import { inviterAddressSelector } from 'src/app/selectors'
import { PHONE_NUMBER_VERIFICATION_CODE_LENGTH } from 'src/config'
import {
  SmsEvent,
  addSmsListener,
  removeSmsListener,
  startSmsRetriever,
} from 'src/identity/smsRetrieval'
import { retrieveSignedMessage } from 'src/pincode/authentication'
import { useDispatch, useSelector } from 'src/redux/hooks'
import Logger from 'src/utils/Logger'
import networkConfig from 'src/web3/networkConfig'
import { dataEncryptionKeySelector, walletAddressSelector } from 'src/web3/selectors'

const TAG = 'verify/hooks'

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
  const inviterAddress = useSelector(inviterAddressSelector)

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

  const handleAlreadyVerified = () => {
    Logger.debug(`${TAG}/requestVerificationCode`, 'Phone number already verified')

    setShouldResendSms(false)
    verificationCodeRequested.current = true
    ValoraAnalytics.track(PhoneVerificationEvents.phone_verification_restore_success)

    setVerificationStatus(PhoneNumberVerificationStatus.SUCCESSFUL)
    dispatch(phoneNumberVerificationCompleted(phoneNumber, countryCallingCode))
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
          inviterAddress: inviterAddress ?? undefined,
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
      onError: (error: Error) => {
        if (error?.message.includes('Phone number already verified')) {
          handleAlreadyVerified()
        } else {
          handleRequestVerificationCodeError(error)
        }
      },
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
      // add verificationId to this hook, in case the SMS is received by the
      // user before the successful response from verifyPhoneNumber service
      if (!smsCode || !verificationId) {
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
    [smsCode, phoneNumber, verificationId],
    {
      onSuccess: async (response?: Response) => {
        if (!response) {
          return
        }

        ValoraAnalytics.track(PhoneVerificationEvents.phone_verification_code_verify_success, {
          phoneNumberHash: getPhoneHash(phoneNumber),
          inviterAddress,
        })
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

export function useAndroidSmsCodeRetriever(onSmsCodeRetrieved: (code: string) => void) {
  const callbackRef = useRef(onSmsCodeRetrieved)
  callbackRef.current = onSmsCodeRetrieved

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return
    }
    addSmsListener((event: SmsEvent) => {
      const code = event.message?.match(`\\d{${PHONE_NUMBER_VERIFICATION_CODE_LENGTH}}`)?.[0]
      if (code) {
        callbackRef.current(code)
      }
    })
    // We don't need to wait for this promise to finish, hence the void
    void startSmsRetriever()

    return removeSmsListener
  }, [])
}

// This is only used from the dev menu for now
// TODO: use i18n if this need to be used in prod
export function useRevokeCurrentPhoneNumber() {
  const address = useSelector(walletAddressSelector)
  const e164Number = useSelector(e164NumberSelector)
  const dispatch = useDispatch()

  const revokePhoneNumber = useAsyncCallback(
    async () => {
      Logger.debug(
        `${TAG}/revokeVerification`,
        'Initiating request to revoke phone number verification',
        { address, e164Number }
      )
      ValoraAnalytics.track(PhoneVerificationEvents.phone_verification_revoke_start)

      if (!address || !e164Number) {
        throw new Error('No phone number in the store')
      }

      const signedMessage = await retrieveSignedMessage()
      const response = await fetch(networkConfig.revokePhoneNumberUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Valora ${address}:${signedMessage}`,
        },
        body: JSON.stringify({
          phoneNumber: e164Number,
          clientPlatform: Platform.OS,
          clientVersion: DeviceInfo.getVersion(),
        }),
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      return e164Number
    },
    {
      onSuccess: (e164Number) => {
        ValoraAnalytics.track(PhoneVerificationEvents.phone_verification_revoke_success)
        dispatch(phoneNumberRevoked(e164Number))
      },
      onError: (error: Error) => {
        ValoraAnalytics.track(PhoneVerificationEvents.phone_verification_revoke_error)
        Logger.warn(`${TAG}/revokeVerification`, 'Error revoking verification', error)
      },
    }
  )

  return revokePhoneNumber
}
