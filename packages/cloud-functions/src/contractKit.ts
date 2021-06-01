import { ContractKit, newKit } from '@celo/contractkit'
import { FULL_NODE_URL } from './config'

let contractKit: ContractKit
export async function getContractKit(): Promise<ContractKit> {
  if (contractKit && (await contractKit.connection.isListening())) {
    return contractKit
  } else {
    contractKit = newKit(FULL_NODE_URL)
    return contractKit
  }
}
