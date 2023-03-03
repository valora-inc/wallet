export interface SuperchargeTokenConfigByToken {
  [tokenAddress: string]: {
    minBalance: number
    maxBalance: number
  }
}
export interface SuperchargeTokenConfig {
  tokenSymbol: string
  minBalance: number
  maxBalance: number
}

export interface SuperchargePendingReward {
  amount: string
  contractAddress: string
  createdAt: number
  index: number
  proof: string[]
  tokenAddress: string
}

export interface SuperchargePendingRewardV2 {
  transaction: {
    from: string
    chainId: number
    to: string
    data: string
    gas: number
  }
  details: {
    tokenAddress: string
    amount: string
  }
}

export const isSuperchargePendingRewardsV2 = (
  pendingRewards: SuperchargePendingReward[] | SuperchargePendingRewardV2[]
): pendingRewards is SuperchargePendingRewardV2[] => 'transaction' in pendingRewards[0]
