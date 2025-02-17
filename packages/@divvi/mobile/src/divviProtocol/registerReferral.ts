import { registryContractAbi } from 'src/divviProtocol/abi/Registry'
import { REGISTRY_CONTRACT_ADDRESS } from 'src/divviProtocol/constants'
import { SerializableTransactionRequest } from 'src/viem/preparedTransactionSerialization'
import { TransactionRequest } from 'src/viem/prepareTransactions'
import { decodeFunctionData } from 'viem'

export function isRegistrationTransaction(tx: TransactionRequest | SerializableTransactionRequest) {
  try {
    return (
      tx.to === REGISTRY_CONTRACT_ADDRESS &&
      tx.data &&
      decodeFunctionData({
        abi: registryContractAbi,
        data: tx.data,
      }).functionName === 'registerReferral'
    )
  } catch (error) {
    // decodeFunctionData will throw if the data does not match any function in
    // the abi, but this is unlikely to happen since we are checking the "to"
    // address first. In any case, we should return false unless we are sure
    // that the transaction is a registration transaction.
    return false
  }
}
