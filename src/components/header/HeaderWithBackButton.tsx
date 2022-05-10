import React from 'react'
import { AnalyticsEventType } from 'src/analytics/Events'
import BackButton from 'src/components/BackButton'
import CustomHeader from 'src/components/header/CustomHeader'

interface Props {
  eventName?: AnalyticsEventType
}

// TODO: Replace request header also & add translations for both
function HeaderWithBackButton({ eventName }: Props) {
  return <CustomHeader left={<BackButton eventName={eventName} />} />
}

export default HeaderWithBackButton
