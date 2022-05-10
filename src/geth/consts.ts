import BigNumber from 'bignumber.js'

// Hard-coded values for the number of Wei, smallest divisible unit of currency, in CELO and cUSD
// respectively. Because they are the same, a single constant is used.
export const WEI_DECIMALS = 18
export const WEI_PER_TOKEN = new BigNumber(10).pow(WEI_DECIMALS)

// Whenever the user enters their PIN, leave the account unlocked for 10 minutes.
export const UNLOCK_DURATION = 600

// 25 is react native geth default
export const SYNCING_MAX_PEERS = 25

export enum GethSyncMode {
  // Valid sync mode values can be seen at https://github.com/celo-org/celo-blockchain/blob/3caca596d1ff23a9faf5339f108c993f38bfa743/mobile/geth.go#L43-L51
  // Anything invalid will cause Geth to panic and app to crash.
  Light = 3,
  // Value of 4 corresponds to a deprecated sync mode.
  Lightest = 5,
}
