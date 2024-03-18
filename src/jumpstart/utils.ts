import { getJumpstartContractAddress } from 'src/jumpstart/selectors'
import { TokenTransfer } from 'src/transactions/types'

export function isJumpstartTransaction(tx: TokenTransfer) {
  const jumpstartAddress = getJumpstartContractAddress(tx.networkId)
  return tx.address === jumpstartAddress
}
