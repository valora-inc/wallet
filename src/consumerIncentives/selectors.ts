import { createSelector } from 'reselect'
import { superchargeTokenConfigsSelector } from 'src/app/selectors'
import { SuperchargeTokenConfig } from 'src/consumerIncentives/types'
import { superchargeTokensByUsdBalanceSelector } from 'src/tokens/selectors'

// Balance info for the token with the highest USD balance among the possible supercharge tokens for which the minimum token balance is met
// Note: this logic should match what's done on the backend to determine the supercharging tokens
export const balanceInfoForSuperchargeSelector = createSelector(
  [superchargeTokensByUsdBalanceSelector, superchargeTokenConfigsSelector],
  (
    superchargeTokensByUsdBalance,
    superchargeTokenConfigs
  ): {
    hasBalanceForSupercharge: boolean
    superchargingTokenConfig?: SuperchargeTokenConfig
    hasMaxBalance?: boolean
  } => {
    for (const superchargeToken of superchargeTokensByUsdBalance) {
      const tokenConfig = superchargeTokenConfigs.find(
        (t) => t.tokenSymbol === superchargeToken.symbol
      )
      if (!tokenConfig || superchargeToken.balance.lt(tokenConfig.minBalance)) {
        continue
      }

      return {
        hasBalanceForSupercharge: true,
        superchargingTokenConfig: tokenConfig,
        hasMaxBalance: superchargeToken.balance.gte(tokenConfig.maxBalance),
      }
    }
    return { hasBalanceForSupercharge: false }
  }
)
