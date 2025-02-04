import { createSelector } from 'reselect'
import type { RootState } from 'src/redux/reducers'
import { getDynamicConfigParams } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs } from 'src/statsig/types'

/**
 * Get the "raw" (non-lower-cased) version of the wallet address in redux state.
 *
 * Intended for the niche data analytics use case of preserving backwards-compatibility with
 *  when we took the wallet address from redux state a different way (not using walletAddressSelector)
 *  for the "accountAddress" user property, which falls back to EOA if no MTW exists.
 *
 * NOTE: modern users (2020 onwards) will *already* have a lower-cased address saved in redux state, so this will
 *  give the same output as walletAddressSelector most of the time.
 */
export const rawWalletAddressSelector = (state: RootState) => state.web3.account ?? null

export const demoModeEnabledSelector = createSelector(
  [
    () =>
      getDynamicConfigParams(DynamicConfigs[StatsigDynamicConfigs.DEMO_MODE_CONFIG])
        ?.enabledInOnboarding,
    (state: RootState) => state.web3.demoModeEnabled,
  ],
  (dynamicConfigEnabled, demoModeToggledOn) => {
    return dynamicConfigEnabled && demoModeToggledOn
  }
)

export const walletAddressSelector = createSelector(
  [
    rawWalletAddressSelector,
    demoModeEnabledSelector,
    () =>
      getDynamicConfigParams(DynamicConfigs[StatsigDynamicConfigs.DEMO_MODE_CONFIG])
        ?.demoWalletAddress,
  ],
  (rawAddress, demoModeEnabled, demoModeAddress) => {
    return (demoModeEnabled ? demoModeAddress : rawAddress)?.toLowerCase() ?? null
  }
)

// @deprecated please use walletAddressSelector instead.
export const currentAccountSelector = walletAddressSelector

export type WalletAddressSelector = typeof walletAddressSelector
