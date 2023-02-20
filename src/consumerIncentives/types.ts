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
  transaction: {
    from: string
    chainId: string
    to: string
    data: string
  }
  details: {
    tokenAddress: string
    amount: string
  }
}
