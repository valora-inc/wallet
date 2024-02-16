import React from 'react'
import { AnalyticsEventType } from 'src/analytics/Properties'
import CancelButton from 'src/components/CancelButton'
import { KeylessBackupFlow } from 'src/keylessBackup/types'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'

export default function KeylessBackupCancelButton({
  flow,
  eventName,
}: {
  flow: KeylessBackupFlow
  eventName: AnalyticsEventType
}) {
  return (
    <CancelButton
      eventName={eventName}
      eventProperties={{ keylessBackupFlow: flow }}
      onCancel={() => {
        flow === KeylessBackupFlow.Setup ? navigateHome() : navigate(Screens.ImportSelect)
      }}
    />
  )
}
