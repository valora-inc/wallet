import React from 'react'

const pointsActivities = ['create-wallet', 'swap', 'more-coming'] as const
export type PointsActivity = (typeof pointsActivities)[number]

export function isPointsActivity(activity: unknown): activity is PointsActivity {
  return typeof activity === 'string' && pointsActivities.includes(activity as PointsActivity)
}

export interface PointsCardMetadata {
  bottomSheet?: BottomSheetMetadata
  title: string
  icon: React.ReactNode
  defaultCompletionStatus: boolean
}

export interface BottomSheetMetadata {
  title: string
  body: string
  cta?: {
    text: string
    onPress: () => void
  }
}

export type BottomSheetParams = BottomSheetMetadata & {
  points: number
  activity: PointsActivity
}

export type PointsMetadata = {
  points: number
  activities: Array<{
    name: PointsActivity
  }>
}
