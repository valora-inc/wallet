export enum PointsActivities {
  CreateWallet = 'CreateWallet',
  Swap = 'Swap',
  MoreComing = 'MoreComing',
}

export type PointsMetadata = {
  points: number
  activities: Array<{
    name: PointsActivities
  }>
}

export interface ActivityCardProps {
  points: number
  onPress: (bottomSheetDetails: BottomSheetDetails) => void
}

export interface BottomSheetDetails {
  points?: number
  bottomSheetTitle?: string | null
  bottomSheetBody?: string | null
  bottomSheetCta?: string | null
  onCtaPress?: () => void
}
