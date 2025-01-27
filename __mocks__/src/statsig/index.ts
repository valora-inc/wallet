export const getDynamicConfigParams = jest.fn().mockReturnValue({})
export const getFeatureGate = jest.fn().mockReturnValue(false)
export const getExperimentParams = jest.fn().mockReturnValue({})
export const patchUpdateStatsigUser = jest.fn()
export const getMultichainFeatures = jest.fn().mockReturnValue({
  showBalances: ['celo-alfajores', 'ethereum-sepolia'],
  showCico: ['celo-alfajores', 'ethereum-sepolia'],
  showSend: ['celo-alfajores', 'ethereum-sepolia'],
  showSwap: ['celo-alfajores', 'ethereum-sepolia'],
  showTransfers: ['celo-alfajores', 'ethereum-sepolia'],
})
export const setupOverridesFromLaunchArgs = jest.fn()
export const getDefaultStatsigUser = jest.fn()
