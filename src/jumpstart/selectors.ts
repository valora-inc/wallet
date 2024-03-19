import { RootState } from 'src/redux/reducers'
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
  return '0x7BF3fefE9881127553D23a8Cd225a2c2442c438C'.toLowerCase()

  // return getDynamicConfigParams(DynamicConfigs[StatsigDynamicConfigs.WALLET_JUMPSTART_CONFIG])
  //   .jumpstartContracts[networkId]?.contractAddress
}
