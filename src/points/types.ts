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
  pointsAmount: number
  activityId: PointsActivity
}

export type PointsMetadata = {
  pointsAmount: number
  activities: Array<{
    activityId: PointsActivity
  }>
}

type ClaimActivity = 'create-wallet' | 'swap'

interface BaseClaimHistory {
  createdAt: string // ISO 8601 string
  activityId: ClaimActivity
  pointsAmount: number // In smallest units
}

type CreateWalletClaimHistory = BaseClaimHistory & {
  activityId: 'create-wallet'
}
type SwapClaimHistory = BaseClaimHistory & {
  activityId: 'swap'
  metadata: {
    to: string
    from: string
  }
}

export type ClaimHistory = CreateWalletClaimHistory | SwapClaimHistory

export interface GetHistoryResponse {
  data: ClaimHistory[]
  hasNextPage: boolean
  nextPageUrl: string
}
