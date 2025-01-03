import { NetworkId } from 'src/transactions/types'
import { Address, Hash } from 'viem'

const pointsActivities = ['create-wallet', 'swap', 'create-live-link', 'deposit-earn'] as const
export type PointsActivityId = (typeof pointsActivities)[number]

export function isPointsActivityId(activity: unknown): activity is PointsActivityId {
  return typeof activity === 'string' && pointsActivities.includes(activity as PointsActivityId)
}

export interface PointsActivity {
  activityId: PointsActivityId
  pointsAmount: number
  previousPointsAmount?: number
  completed: boolean
}

export interface BottomSheetParams extends PointsActivity {
  title: string
  body: string
  cta?: {
    text: string
    onPress: () => void
  }
}

const claimActivities = ['create-wallet', 'swap', 'create-live-link', 'deposit-earn'] as const
type ClaimActivityId = (typeof claimActivities)[number]

const liveLinkTypes = ['erc20', 'erc721'] as const
type LiveLinkType = (typeof liveLinkTypes)[number]

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
type DepositEarnClaimHistory = BaseClaimHistory & {
  activityId: 'deposit-earn'
  metadata: {
    tokenId: string
  }
}
type BaseCreateLiveLinkClaimHistory = BaseClaimHistory & {
  activityId: 'create-live-link'
  metadata: {
    liveLinkType: LiveLinkType
  }
}
type Erc20CreateLiveLinkClaimHistory = BaseCreateLiveLinkClaimHistory & {
  metadata: {
    liveLinkType: 'erc20'
    tokenId: string
  }
}
type Erc721CreateLiveLinkClaimHistory = BaseCreateLiveLinkClaimHistory & {
  metadata: {
    liveLinkType: 'erc721'
  }
}
export type CreateLiveLinkClaimHistory =
  | Erc20CreateLiveLinkClaimHistory
  | Erc721CreateLiveLinkClaimHistory

export type ClaimHistory =
  | CreateWalletClaimHistory
  | SwapClaimHistory
  | CreateLiveLinkClaimHistory
  | DepositEarnClaimHistory

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

interface PointsEventDepositEarn {
  activityId: 'deposit-earn'
  transactionHash: Hash
  networkId: NetworkId
  tokenId: string
}

interface PointsEventBaseCreateLiveLink {
  activityId: 'create-live-link'
  liveLinkType: LiveLinkType
  beneficiaryAddress: Address
  transactionHash: Hash
  networkId: NetworkId
}

type PointsEventErc20CreateLiveLink = PointsEventBaseCreateLiveLink & {
  liveLinkType: 'erc20'
  tokenId: string
  amount: string
}

type PointsEventErc721CreateLiveLink = PointsEventBaseCreateLiveLink & {
  liveLinkType: 'erc721'
  tokenAddress: Address
  erc721TokenId: string
}

type PointsEventCreateLiveLink = PointsEventErc20CreateLiveLink | PointsEventErc721CreateLiveLink

export type PointsEvent =
  | PointsEventCreateWallet
  | PointsEventSwap
  | PointsEventCreateLiveLink
  | PointsEventDepositEarn
