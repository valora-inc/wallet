import React from 'react'
import { NetworkId } from 'src/transactions/types'

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

const claimActivities = ['create-wallet', 'swap'] as const
type ClaimActivityId = (typeof claimActivities)[number]

export function isClaimActivityId(activity: unknown): activity is ClaimActivityId {
  return typeof activity === 'string' && claimActivities.includes(activity as ClaimActivityId)
}

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

// See https://stackoverflow.com/questions/59794474/omitting-a-shared-property-from-a-union-type-of-objects-results-in-error-when-us
type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never
export type ClaimHistoryCardItem = DistributiveOmit<ClaimHistory, 'createdAt'> & {
  timestamp: number
}

export interface GetHistoryResponse {
  data: ClaimHistory[]
  hasNextPage: boolean
  nextPageUrl: string
}

export interface GetPointsBalanceResponse {
  balance: string
}

interface PointsEventCreateWallet {
  activityId: 'create-wallet'
}

interface PointsEventSwap {
  activityId: 'swap'
  transactionHash: string
  networkId: NetworkId
  toTokenId: string
  fromTokenId: string
}

export type PointsEvent = PointsEventCreateWallet | PointsEventSwap
