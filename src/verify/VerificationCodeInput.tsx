import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native'
import CodeInput, { CodeInputStatus } from 'src/components/CodeInput'
import KeyboardAwareScrollView from 'src/components/KeyboardAwareScrollView'
import KeyboardSpacer from 'src/components/KeyboardSpacer'
import { PHONE_NUMBER_VERIFICATION_CODE_LENGTH } from 'src/config'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import ResendButtonWithDelay from 'src/verify/ResendButtonWithDelay'
import { PhoneNumberVerificationStatus, useAndroidSmsCodeRetriever } from 'src/verify/hooks'

interface Props {
  phoneNumber: string
  verificationStatus: PhoneNumberVerificationStatus
  setSmsCode: (code: string) => void
  onResendSms?: () => void
  onSuccess: () => void
  containerStyle?: StyleProp<ViewStyle>
  title?: JSX.Element
}

function VerificationCodeInput({
  phoneNumber,
  verificationStatus,
  setSmsCode,
  onResendSms,
  onSuccess,
  containerStyle,
  title,
}: Props) {
  const [code, setCode] = useState('')
  const [codeInputStatus, setCodeInputStatus] = useState(CodeInputStatus.Inputting)

  const { t } = useTranslation()
  // Android uses the SMS Retriever API to automatically fill in the verification code
  useAndroidSmsCodeRetriever(setCode)

  useEffect(() => {
    if (code.length === PHONE_NUMBER_VERIFICATION_CODE_LENGTH) {
      setCodeInputStatus(CodeInputStatus.Processing)
      setSmsCode(code)
    } else {
      setCodeInputStatus(CodeInputStatus.Inputting)
    }
  }, [code])

  useEffect(() => {
    if (verificationStatus === PhoneNumberVerificationStatus.SUCCESSFUL) {
      setCodeInputStatus(CodeInputStatus.Accepted)
      setTimeout(onSuccess, 500)
    } else if (verificationStatus === PhoneNumberVerificationStatus.FAILED) {
      setCodeInputStatus(CodeInputStatus.Error)
    }
  }, [verificationStatus])

  return (
    <>
      <KeyboardAwareScrollView
        style={[styles.scrollContainer, containerStyle]}
        keyboardShouldPersistTaps="always"
      >
        {title}
        <Text style={styles.body}>{t('phoneVerificationInput.description', { phoneNumber })}</Text>
        <CodeInput
          autoFocus
          status={codeInputStatus}
          inputValue={code}
          inputPlaceholder={t('phoneVerificationInput.codeInputPlaceholder')}
          onInputChange={setCode}
          testID="PhoneVerificationCode"
          style={styles.codeInput}
        />
      </KeyboardAwareScrollView>
      {onResendSms && (
        <View style={styles.resendButtonContainer}>
          <ResendButtonWithDelay onPress={onResendSms} />
        </View>
      )}
      <KeyboardSpacer />
    </>
  )
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    padding: Spacing.Thick24,
    width: '100%',
  },
  body: {
    ...fontStyles.regular,
    marginBottom: Spacing.Thick24,
    textAlign: 'center',
  },
  codeInput: {
    marginHorizontal: Spacing.Thick24,
  },
  resendButtonContainer: {
    padding: Spacing.Thick24,
    alignItems: 'center',
  },
})

export default VerificationCodeInput
