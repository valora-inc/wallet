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
