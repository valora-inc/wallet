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
