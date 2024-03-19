import { RootState } from 'src/redux/reducers'
import { getDynamicConfigParams } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import { NetworkId } from 'src/transactions/types'

export const showJumstartClaimLoading = (state: RootState) => {
  return state.jumpstart.claimStatus === 'loading'
}

export const showJumstartClaimError = (state: RootState) => {
  return state.jumpstart.claimStatus === 'error'
}

export const jumpstartSendStatusSelector = (state: RootState) => {
  return state.jumpstart.depositStatus
}

export const jumpstartReclaimStatusSelector = (state: RootState) => {
  return state.jumpstart.reclaimStatus
}

export const getJumpstartContractAddress = (networkId: NetworkId) => {
  return getDynamicConfigParams(DynamicConfigs[StatsigDynamicConfigs.WALLET_JUMPSTART_CONFIG])
    .jumpstartContracts[networkId]?.contractAddress
}
