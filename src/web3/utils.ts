import { CeloTx, CeloTxObject, CeloTxReceipt, PromiEvent } from '@celo/connect'
import { ContractKit } from '@celo/contractkit'
import BigNumber from 'bignumber.js'
import { GAS_INFLATION_FACTOR } from 'src/config'
import Logger from 'src/utils/Logger'
import { getContractKitAsync, getWeb3Async } from 'src/web3/contracts'
import { Network, NetworkId } from 'src/transactions/types'
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

// Note: This returns Promise<Block>
export async function getLatestBlock() {
  Logger.debug(TAG, 'Getting latest block')
  const web3 = await getWeb3Async()
  return web3.eth.getBlock('latest')
}

export async function getLatestBlockNumber() {
  Logger.debug(TAG, 'Getting latest block number')
  const web3 = await getWeb3Async()
  return web3.eth.getBlockNumber()
}

export async function getContract(abi: any, tokenAddress: string) {
  const kit = await getContractKitAsync()
  return new kit.web3.eth.Contract(abi, tokenAddress)
}

// This is meant to be called before normalizer.populate
// There's a bug in TxParamsNormalizer that sets the chainId as a number if not present
// but then if no gas is set, the estimateGas call will fail with espresso hardfork nodes
// with the error: `Gas estimation failed: Could not decode transaction failure reason or Error: invalid argument 0: json: cannot unmarshal non-string into Go struct field TransactionArgs.chainId of type *hexutil.Big`
// So here we make sure the chainId is set as a hex string so estimateGas works
// TODO: consider removing this when TxParamsNormalizer is fixed
export function applyChainIdWorkaround(tx: any, chainId: number) {
  tx.chainId = `0x${new BigNumber(tx.chainId || chainId).toString(16)}`
  return tx
}

export function buildTxo(kit: ContractKit, tx: CeloTx): CeloTxObject<never> {
  return {
    get arguments(): any[] {
      return []
    },
    call(unusedTx?: CeloTx) {
      throw new Error('Fake TXO not implemented')
    },
    // updatedTx contains the `feeCurrency`, `gas`, and `gasPrice` set by our `sendTransaction` helper
    send(updatedTx?: CeloTx): PromiEvent<CeloTxReceipt> {
      return kit.web3.eth.sendTransaction({
        ...tx,
        ...updatedTx,
      })
    },
    // updatedTx contains the `feeCurrency`, and `gasPrice` set by our `sendTransaction` helper
    estimateGas(updatedTx?: CeloTx): Promise<number> {
      return kit.connection.estimateGas({
        ...tx,
        ...updatedTx,
        gas: undefined,
      })
    },
    encodeABI(): string {
      return tx.data ?? ''
    },
    // @ts-ignore
    _parent: {
      // @ts-ignore
      _address: tx.to,
    },
  }
}

export function getNetworkFromNetworkId(networkId?: NetworkId): Network | undefined {
  return networkId ? networkIdToNetwork[networkId] : undefined
}
