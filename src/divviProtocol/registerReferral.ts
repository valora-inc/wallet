import { registryContractAbi } from 'src/divviProtocol/abi/Registry'
import { REGISTRY_CONTRACT_ADDRESS } from 'src/divviProtocol/constants'
import { SerializableTransactionRequest } from 'src/viem/preparedTransactionSerialization'
import { TransactionRequest } from 'src/viem/prepareTransactions'
import { decodeFunctionData } from 'viem'

export function isRegistrationTransaction(tx: TransactionRequest | SerializableTransactionRequest) {
  return (
    tx.to === REGISTRY_CONTRACT_ADDRESS &&
    tx.data &&
    decodeFunctionData({
      abi: registryContractAbi,
      data: tx.data,
    }).functionName === 'registerReferral'
  )
}
