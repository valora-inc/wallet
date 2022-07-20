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
