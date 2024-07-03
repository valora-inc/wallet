import { NetworkId } from 'src/transactions/types'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import { TransactionRequest } from 'src/viem/prepareTransactions'
import networkConfig from 'src/web3/networkConfig'

type SimulatedTransactionResponse = {
  status: 'OK'
  simulatedTransactions: {
    status: 'success' | 'failure'
    blockNumber: string
    gasNeeded: number
    gasUsed: number
    gasPrice: string
  }[]
}

export async function simulateTransactions({
  baseTransactions,
  networkId,
}: {
  baseTransactions: TransactionRequest[]
  networkId: NetworkId
}) {
  const response = await fetchWithTimeout(networkConfig.simulateTransactionsUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      transactions: baseTransactions,
      networkId,
    }),
  })

  if (!response.ok) {
    throw new Error(
      `Failed to simulate transactions. status ${response.status}, text: ${await response.text()}`
    )
  }

  const { simulatedTransactions }: SimulatedTransactionResponse = await response.json()

  if (simulatedTransactions.length !== baseTransactions.length) {
    throw new Error(
      `Expected ${baseTransactions.length} simulated transactions, got ${simulatedTransactions.length}, response: ${JSON.stringify(simulatedTransactions)}`
    )
  }

  simulatedTransactions.forEach((tx, i) => {
    if (tx.status !== 'success') {
      throw new Error(
        `Failed to simulate transaction for base transaction ${JSON.stringify(baseTransactions[i])}. response: ${JSON.stringify(tx)}`
      )
    }
  })

  return simulatedTransactions
}
