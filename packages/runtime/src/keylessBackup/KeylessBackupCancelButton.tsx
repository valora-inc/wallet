import React from 'react'
import { AnalyticsEventType } from 'src/analytics/Properties'
import CancelButton from 'src/components/CancelButton'
import { KeylessBackupFlow, KeylessBackupOrigin } from 'src/keylessBackup/types'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'

export default function KeylessBackupCancelButton({
  flow,
  origin,
  eventName,
}: {
  flow: KeylessBackupFlow
  origin: KeylessBackupOrigin
  eventName: AnalyticsEventType
}) {
  return (
    <CancelButton
      eventName={eventName}
      eventProperties={{ keylessBackupFlow: flow, origin }}
      onCancel={() => {
        flow === KeylessBackupFlow.Setup ? navigateHome() : navigate(Screens.ImportSelect)
      }}
    />
  )
}
