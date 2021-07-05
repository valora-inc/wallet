import { CeloContract, ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import Web3 from 'web3'
import { WEB3_PROVIDER_URL } from '../config'

interface ObjectWithStringsAndUndefined {
  [key: string]: string | undefined
}

interface ObjectWithStrings {
  [key: string]: string
}

export function removeEmptyValuesFromObject(obj: ObjectWithStringsAndUndefined) {
  const newObj: ObjectWithStrings = {}
  Object.keys(obj)
    // @ts-ignore
    .filter((k) => obj[k] !== null && obj[k] !== undefined)
    // @ts-ignore
    .forEach((k) => (newObj[k] = obj[k]))
  return newObj
}

let goldTokenAddress: string
let cUsdTokenAddress: string
let cEurTokenAddress: string
export async function getTokenAddresses() {
  if (goldTokenAddress && cUsdTokenAddress && cEurTokenAddress) {
    return { goldTokenAddress, cUsdTokenAddress, cEurTokenAddress }
  } else {
    const kit = await getContractKit()
    goldTokenAddress = await kit.registry.addressFor(CeloContract.GoldToken)
    cUsdTokenAddress = await kit.registry.addressFor(CeloContract.StableToken)
    cEurTokenAddress = await kit.registry.addressFor(CeloContract.StableTokenEUR)
    return { goldTokenAddress, cUsdTokenAddress, cEurTokenAddress }
  }
}

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

// Flat single level array
// TODO: remove this once we upgrade to node >= 11 which natively supports Array.prototype.flat
export function flat<T>(arr: T[][]): T[] {
  return ([] as T[]).concat(...arr)
}
