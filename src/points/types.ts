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

type ClaimActivity = 'create-wallet' | 'swap'

interface BaseClaimHistory {
  createdAt: string // ISO 8601 string
  activity: ClaimActivity
  points: string // In wei
}

type CreateWalletClaimHistory = BaseClaimHistory & {
  activity: 'create-wallet'
}
type SwapClaimHistory = BaseClaimHistory & {
  activity: 'swap'
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
