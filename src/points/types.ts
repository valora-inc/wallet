import React from 'react'

const pointsActivities = ['create-wallet', 'swap', 'more-coming'] as const
export type PointsActivityId = (typeof pointsActivities)[number]

export function isPointsActivityId(activity: unknown): activity is PointsActivityId {
  return typeof activity === 'string' && pointsActivities.includes(activity as PointsActivityId)
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
  activityId: PointsActivityId
}

export type PointsMetadata = {
  pointsAmount: number
  activities: Array<{
    activityId: PointsActivityId
  }>
}

type ClaimActivityId = 'create-wallet' | 'swap'

interface BaseClaimHistory {
  createdAt: string // ISO 8601 string
  activityId: ClaimActivityId
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

interface PointsEventCreateWallet {
  activityId: 'create-wallet'
}

interface PointsEventSwap {
  activityId: 'swap'
  transactionHash: string
}

export type PointsEvent = PointsEventCreateWallet | PointsEventSwap
