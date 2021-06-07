import { notEmpty } from '@celo/utils/lib/collections'
import web3Abi, { AbiCoder } from 'web3-eth-abi'
import { TokenTransfer, Transfer } from './blockscout'
import { Currencies } from './transfers'

const abiCoder = (web3Abi as unknown) as AbiCoder

export function formatTransfers(transfers: TokenTransfer[], currency: Currencies) {
  // tx hash -> Transfers[]
  const transfersByTxHash = new Map<string, Transfer[]>()
  let latestBlock = 0

  for (const transfer of transfers) {
    latestBlock = Math.max(latestBlock, parseInt(transfer.blockNumber, 16))
    const formattedTransfer = formatTransfer(transfer, currency)
    if (formattedTransfer) {
      const existingTransfers = transfersByTxHash.get(transfer.transactionHash) || []
      existingTransfers.push(formattedTransfer)
      transfersByTxHash.set(transfer.transactionHash, existingTransfers)
    }
  }

  return { transfers: transfersByTxHash, latestBlock }
}

function formatTransfer(transfer: TokenTransfer, currency: Currencies): Transfer | null {
  const value = transfer.data ? getValueFromData(transfer) : transfer.amount
  if (!value) {
    console.info(
      `Failed to find value for transfer. txHash: ${transfer.transactionHash}. Data: ${transfer.data}`
    )
    return null
  }

  return {
    recipient: transfer.toAddressHash.toLowerCase(),
    sender: transfer.fromAddressHash.toLowerCase(),
    value,
    blockNumber: parseInt(transfer.blockNumber, 16),
    timestamp: parseInt(transfer.timeStamp, 16) * 1000,
    txHash: transfer.transactionHash,
    currency,
  }
}

function getValueFromData(transfer: TokenTransfer) {
  try {
    const decodedData = abiCoder.decodeLog(
      [
        {
          indexed: false,
          name: 'value',
          type: 'uint256',
        },
      ],
      transfer.data,
      // Docs: An array with the index parameter topics of the log, without the topic[0] if its a non-anonymous event.
      transfer.topics.slice(1).filter(notEmpty)
    )
    return decodedData.value
  } catch (error) {
    console.error('Error decoding transfer log', error)
    return null
  }
}
