import { isGasSubsidizedForNetwork } from 'src/earn/utils'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import { NetworkId } from 'src/transactions/types'

jest.mock('src/statsig')

describe('isGasSubsidizedForNetwork', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(getFeatureGate).mockReturnValue(false)
  })

  it('should return true if network is in INTERNAL_RPC_SUPPORTED_NETWORKS and feature gate is on', () => {
    jest
      .mocked(getFeatureGate)
      .mockImplementation((gate) => gate === StatsigFeatureGates.SUBSIDIZE_STABLECOIN_EARN_GAS_FEES)
    expect(isGasSubsidizedForNetwork(NetworkId['arbitrum-one'])).toEqual(true)
    expect(isGasSubsidizedForNetwork(NetworkId['arbitrum-sepolia'])).toEqual(true)
  })

  it('should return false if network is not in INTERNAL_RPC_SUPPORTED_NETWORKS and feature gate is on', () => {
    jest
      .mocked(getFeatureGate)
      .mockImplementation((gate) => gate === StatsigFeatureGates.SUBSIDIZE_STABLECOIN_EARN_GAS_FEES)
    expect(isGasSubsidizedForNetwork(NetworkId['celo-mainnet'])).toEqual(false)
    expect(isGasSubsidizedForNetwork(NetworkId['celo-alfajores'])).toEqual(false)
  })

  it('should return false for any network if feature gate is off', () => {
    expect(isGasSubsidizedForNetwork(NetworkId['arbitrum-one'])).toEqual(false)
    expect(isGasSubsidizedForNetwork(NetworkId['arbitrum-sepolia'])).toEqual(false)
    expect(isGasSubsidizedForNetwork(NetworkId['celo-mainnet'])).toEqual(false)
    expect(isGasSubsidizedForNetwork(NetworkId['celo-alfajores'])).toEqual(false)
  })
})
