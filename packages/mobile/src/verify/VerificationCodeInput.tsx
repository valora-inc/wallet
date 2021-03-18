import { hexToBuffer } from '@celo/utils/lib/address'
import {
  extractAttestationCodeFromMessage,
  extractSecurityCodeWithPrefix,
} from '@celo/utils/lib/attestations'
import * as React from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import CodeInput, { CodeInputStatus } from 'src/components/CodeInput'
import Logger from 'src/utils/Logger'
import { ATTESTATION_CODE_PLACEHOLDER, AttestationCode } from 'src/verify/module'

interface Props {
  label: string
  index: number // index of code in attestationCodes array
  inputValue: string // the raw code inputed by the user
  inputPlaceholder: string
  inputPlaceholderWithClipboardContent: string
  isCodeSubmitting: boolean // is the inputted code being processed
  onInputChange: (value: string) => void
  attestationCodes: AttestationCode[] // The codes in the redux store
  numCompleteAttestations: number // has the code been accepted and completed
  style?: StyleProp<ViewStyle>
  shortVerificationCodesEnabled: boolean
}

function VerificationCodeInput({
  label,
  index,
  inputValue,
  inputPlaceholder,
  inputPlaceholderWithClipboardContent,
  onInputChange,
  isCodeSubmitting,
  attestationCodes,
  numCompleteAttestations,
  style,
  shortVerificationCodesEnabled,
}: Props) {
  let codeStatus: CodeInputStatus = CodeInputStatus.DISABLED
  if (numCompleteAttestations > index) {
    codeStatus = CodeInputStatus.ACCEPTED
    inputValue = getRecodedAttestationValue(attestationCodes[index], shortVerificationCodesEnabled)
  } else if (attestationCodes.length > index) {
    codeStatus = CodeInputStatus.RECEIVED
    inputValue = getRecodedAttestationValue(attestationCodes[index], shortVerificationCodesEnabled)
  } else if (isCodeSubmitting) {
    codeStatus = CodeInputStatus.PROCESSING
  } else if (attestationCodes.length === index) {
    codeStatus = CodeInputStatus.INPUTTING
  }
  return (
    <CodeInput
      label={label}
      status={codeStatus}
      inputValue={inputValue}
      inputPlaceholder={inputPlaceholder}
      inputPlaceholderWithClipboardContent={inputPlaceholderWithClipboardContent}
      onInputChange={onInputChange}
      shouldShowClipboard={shouldShowClipboard(attestationCodes, shortVerificationCodesEnabled)}
      style={style}
      shortVerificationCodesEnabled={shortVerificationCodesEnabled}
    />
  )
}

function getRecodedAttestationValue(
  attestationCode: AttestationCode,
  shortVerificationCodesEnabled: boolean
) {
  try {
    if (!attestationCode.code || attestationCode.code === ATTESTATION_CODE_PLACEHOLDER) {
      return ''
    }
    if (shortVerificationCodesEnabled && attestationCode.shortCode) {
      return attestationCode.shortCode
    }
    return hexToBuffer(attestationCode.code).toString('base64')
  } catch (error) {
    Logger.warn('VerificationCodeRow', 'Could not recode verification code to base64')
    return ''
  }
}

function shouldShowClipboard(
  attestationCodes: AttestationCode[],
  shortVerificationCodesEnabled: boolean
) {
  return (value: string) => {
    const extractedCode = shortVerificationCodesEnabled
      ? extractSecurityCodeWithPrefix(value)
      : extractAttestationCodeFromMessage(value)
    return (
      !!extractedCode &&
      !attestationCodes.find(
        (c) => (shortVerificationCodesEnabled ? c.shortCode : c.code) === extractedCode
      )
    )
  }
}

export default VerificationCodeInput
