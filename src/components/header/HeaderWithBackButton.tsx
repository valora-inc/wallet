import React from 'react'
import { AnalyticsEventType } from 'src/analytics/Events'
import BackButton from 'src/components/BackButton'
import CustomHeader from 'src/components/header/CustomHeader'
import variables from 'src/styles/variables'

interface Props {
  eventName?: AnalyticsEventType
}

// TODO: Replace request header also & add translations for both
function HeaderWithBackButton({ eventName }: Props) {
  return (
    <CustomHeader
      left={<BackButton style={{ paddingLeft: variables.contentPadding }} eventName={eventName} />}
    />
  )
}

export default HeaderWithBackButton
