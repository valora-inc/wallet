import React from 'react'
import { AnalyticsEventType } from 'src/analytics/Events'
import BackButton from 'src/components/BackButton'
import CustomHeader from 'src/components/header/CustomHeader'

interface Props {
  eventName?: AnalyticsEventType
}

function HeaderWithBackButton({ eventName }: Props) {
  return <CustomHeader left={<BackButton eventName={eventName} />} />
}

export default HeaderWithBackButton
