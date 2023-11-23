import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import TextButton from 'src/components/TextButton'
import colors from 'src/styles/colors'

const RESEND_DELAY_TIME = 30 * 1000 // recommended timeout for Twilio in milliseconds

interface Props {
  onPress(): void
}

function ResendButtonWithDelay({ onPress }: Props) {
  const { t } = useTranslation()
  // Used for re-rendering, actual value unused
  const [, setTimer] = useState(0)

  const startTime = useRef(Date.now())
  const endTime = useMemo(() => startTime.current + RESEND_DELAY_TIME, [startTime.current])
  const secondsRemaining = Math.ceil((endTime - Date.now()) / 1000)

  const handleOnPress = () => {
    startTime.current = Date.now()
    onPress()
  }

  useEffect(() => {
    if (secondsRemaining < 0) {
      return
    }

    const interval = setInterval(() => {
      setTimer((timer) => timer + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [secondsRemaining < 0])

  const disabled = secondsRemaining > 0
  return (
    <TextButton
      testID="PhoneVerificationResendSmsBtn"
      disabled={disabled}
      style={{
        color: disabled ? colors.gray2 : colors.onboardingBrownLight,
        fontVariant: ['tabular-nums'],
      }}
      onPress={handleOnPress}
    >
      {disabled
        ? t('phoneVerificationInput.resendButtonNotYetAvailable', { secondsRemaining })
        : t('phoneVerificationInput.resendButton')}
    </TextButton>
  )
}

export default ResendButtonWithDelay
