import BigNumber from 'bignumber.js'

// Hard-coded values for the number of Wei, smallest divisible unit of currency, in CELO and cUSD
// respectively. Because they are the same, a single constant is used.
export const WEI_DECIMALS = 18
export const WEI_PER_TOKEN = new BigNumber(10).pow(WEI_DECIMALS)

// Whenever the user enters their PIN, leave the account unlocked for 10 minutes.
export const UNLOCK_DURATION = 600
