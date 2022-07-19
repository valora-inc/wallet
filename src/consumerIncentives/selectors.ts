import { createSelector } from 'reselect'
import { superchargeTokenConfigByTokenSelector } from 'src/app/selectors'
import { SuperchargeTokenConfig } from 'src/consumerIncentives/types'
import { tokensByAddressSelector } from 'src/tokens/selectors'
import Logger from 'src/utils/Logger'

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
      if (!tokenInfo || !tokenInfo.usdPrice) {
        Logger.warn(`A possible supercharged token info couldn't be obtained from firebase`)
        continue
      }

      if (tokenInfo.balance.lt(superchargeTokenConfig.minBalance)) {
        continue
      }

      const superchargeableBalance = Math.min(
        tokenInfo.balance.toNumber(),
        superchargeTokenConfig.maxBalance
      )
      const superchargeableUsdBalance = tokenInfo.usdPrice.times(superchargeableBalance).toNumber()
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

// function useDefaultTokenConfigToSupercharge(): Partial<SuperchargeTokenConfig> {
//   const { superchargeTokens } = useSelector((state) => state.app)
//   const userCountry = useSelector(userLocationDataSelector)
//   const { IS_IN_EUROPE } = useCountryFeatures()

//   const tokenToSupercharge = IS_IN_EUROPE
//     ? 'cEUR'
//     : userCountry?.countryCodeAlpha2 === 'BR'
//       ? 'cREAL'
//       : 'cUSD'
//   return (
//     superchargeTokens.find((token) => token.tokenSymbol === tokenToSupercharge) ?? {
//       tokenSymbol: tokenToSupercharge,
//     }
//   )
// }
