import { createSelector } from 'reselect'
import { superchargeTokenConfigByTokenSelector } from 'src/app/selectors'
import { SuperchargeTokenConfig } from 'src/consumerIncentives/types'
import { RootState } from 'src/redux/reducers'
import { tokensByAddressSelector } from 'src/tokens/selectors'

interface SuperchargeInfo {
  hasBalanceForSupercharge: boolean
  superchargingTokenConfig?: SuperchargeTokenConfig
  hasMaxBalance?: boolean
  superchargeBalance?: number
  superchargeUsdBalance?: number
}

// Supercharge info for the token with the highest USD balance among the possible supercharge tokens for which the minimum token balance is met
// Note: this logic should match what's done on the backend to determine the supercharging tokens
export const superchargeInfoSelector = createSelector(
  tokensByAddressSelector,
  superchargeTokenConfigByTokenSelector,
  (tokensByAddress, superchargeTokenConfigByToken): SuperchargeInfo => {
    let superchargeInfo: SuperchargeInfo = { hasBalanceForSupercharge: false }

    for (const [tokenAddress, superchargeTokenConfig] of Object.entries(
      superchargeTokenConfigByToken
    )) {
      const tokenInfo = tokensByAddress[tokenAddress.toLowerCase()]
      if (!tokenInfo || !tokenInfo.priceUsd) {
        continue
      }

      if (tokenInfo.balance.lt(superchargeTokenConfig.minBalance)) {
        continue
      }

      const superchargeableBalance = Math.min(
        tokenInfo.balance.toNumber(),
        superchargeTokenConfig.maxBalance
      )
      const superchargeableUsdBalance = tokenInfo.priceUsd.times(superchargeableBalance).toNumber()
      if (
        !superchargeInfo.superchargeUsdBalance ||
        superchargeableUsdBalance > superchargeInfo.superchargeUsdBalance
      ) {
        superchargeInfo = {
          superchargingTokenConfig: {
            ...superchargeTokenConfig,
            tokenSymbol: tokenInfo.symbol,
          },
          superchargeBalance: superchargeableBalance,
          superchargeUsdBalance: superchargeableUsdBalance,
          hasMaxBalance: tokenInfo.balance.gte(superchargeTokenConfig.maxBalance),
          hasBalanceForSupercharge: true,
        }
      }
    }

    return superchargeInfo
  }
)

export const superchargeRewardsLoadingSelector = (state: RootState) => state.supercharge.loading

export const availableRewardsSelector = (state: RootState) => state.supercharge.availableRewards

export const superchargeRewardContractAddressSelector = (state: RootState) =>
  state.supercharge.superchargeRewardContractAddress

export const fetchAvailableRewardsErrorSelector = (state: RootState) =>
  state.supercharge.fetchAvailableRewardsError
