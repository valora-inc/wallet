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
