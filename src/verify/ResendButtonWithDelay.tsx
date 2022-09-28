import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import TextButton from 'src/components/TextButton'
import colors from 'src/styles/colors'

const RESEND_DELAY_TIME = 60

interface Props {
  onPress(): void
}

function ResendButtonWithDelay({ onPress }: Props) {
  const { t } = useTranslation()
  const [secondsRemaining, setSecondsRemaining] = useState(RESEND_DELAY_TIME)

  const handleOnPress = () => {
    setSecondsRemaining(RESEND_DELAY_TIME)
    onPress()
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const disabled = secondsRemaining > 0
  return (
    <TextButton
      testID="PhoneVerificationResendSmsBtn"
      disabled={disabled}
      style={disabled ? { color: colors.gray6 } : { color: colors.onboardingBrownLight }}
      onPress={handleOnPress}
    >
      {disabled
        ? t('phoneVerificationInput.resendButtonNotYetAvailable', { secondsRemaining })
        : t('phoneVerificationInput.resendButton')}
    </TextButton>
  )
}

export default ResendButtonWithDelay
