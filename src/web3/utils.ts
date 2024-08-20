import { CeloTx, CeloTxObject, CeloTxReceipt } from '@celo/connect'
import BigNumber from 'bignumber.js'
import { GAS_INFLATION_FACTOR } from 'src/config'
import { Network, NetworkId } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { getContractKitAsync } from 'src/web3/contracts'
import { networkIdToNetwork } from 'src/web3/networkConfig'

const TAG = 'web3/utils'

// Estimate gas taking into account the configured inflation factor
export async function estimateGas(txObj: CeloTxObject<any>, txParams: CeloTx): Promise<BigNumber> {
  const contractKit = await getContractKitAsync()
  const gasEstimator = (_tx: CeloTx) => txObj.estimateGas({ ..._tx })
  const getCallTx = (_tx: CeloTx) => {
    // @ts-ignore missing _parent property from TransactionObject type.
    return { ..._tx, data: txObj.encodeABI(), to: txObj._parent._address }
  }
  const caller = (_tx: CeloTx) => contractKit.connection.web3.eth.call(getCallTx(_tx))

  contractKit.connection.defaultGasInflationFactor = GAS_INFLATION_FACTOR
  const gas = new BigNumber(
    await contractKit.connection.estimateGasWithInflationFactor(txParams, gasEstimator, caller)
  )
  return gas
}

// Fetches the transaction receipt for a given hash, returning null if the transaction has not been mined.
export async function getTransactionReceipt(txHash: string): Promise<CeloTxReceipt | null> {
  Logger.debug(TAG, `Getting transaction receipt for ${txHash}`)
  const contractkit = await getContractKitAsync()
  return contractkit.connection.getTransactionReceipt(txHash)
}

export function getNetworkFromNetworkId(networkId?: NetworkId): Network | undefined {
  return networkId ? networkIdToNetwork[networkId] : undefined
}
