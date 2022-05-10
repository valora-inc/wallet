export enum SuperchargeToken {
  cUSD = 'cUSD',
  cEUR = 'cEUR',
  cREAL = 'cREAL',
}

export interface SuperchargeTokenConfig {
  token: SuperchargeToken
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
