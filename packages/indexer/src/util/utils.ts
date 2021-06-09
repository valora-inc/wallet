import { ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import Web3 from 'web3'
import { WEB3_PROVIDER_URL } from '../config'

let contractKit: ContractKit
export async function getContractKit(): Promise<ContractKit> {
  if (contractKit && (await contractKit.connection.isListening())) {
    // Already connected
    return contractKit
  } else {
    const httpProvider = new Web3.providers.HttpProvider(WEB3_PROVIDER_URL)
    const web3 = new Web3(httpProvider)
    contractKit = newKitFromWeb3(web3)
    return contractKit
  }
}
