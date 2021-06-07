import { concurrentMap } from '@celo/base'
import { ContractKit, StableToken } from '@celo/contractkit'
import { BaseWrapper } from '@celo/contractkit/lib/wrappers/BaseWrapper'
import { EventLog } from 'web3-core'
import { database } from '../database/db'
import { getContractKit } from '../util/utils'
import { getLastBlock, setLastBlock } from './blocks'

const TAG = 'Indexer'
const CONCURRENT_EVENTS_HANDLED = 5

export enum Contract {
  Accounts = 'Accounts',
  Escrow = 'Escrow',
  Attestations = 'Attestations',
  cUsd = 'cUsd',
}

// TODO: Add types for the events of each contract.
export enum Event {
  AccountWalletAddressSet = 'AccountWalletAddressSet',
  AttestationCompleted = 'AttestationCompleted',
  Revocation = 'Revocation',
  Transfer = 'Transfer',
  Withdrawal = 'Withdrawal',
}

// TODO: Rethink this interface. batchSize should be tied to contract + event, not just contract.
// Probably good to handle this together with the TODO on the Event enum.
interface ContractInfo {
  contract: (kit: ContractKit) => Promise<BaseWrapper<any>>
  batchSize: number
}

const contracts: { [contract in Contract]: ContractInfo } = {
  [Contract.Accounts]: {
    contract: (kit) => kit.contracts.getAccounts(),
    batchSize: 10000,
  },
  [Contract.Escrow]: {
    contract: (kit) => kit.contracts.getEscrow(),
    batchSize: 10000,
  },
  [Contract.Attestations]: {
    contract: (kit) => kit.contracts.getAttestations(),
    batchSize: 1000,
  },
  [Contract.cUsd]: {
    contract: (kit) => kit.contracts.getStableToken(StableToken.cUSD),
    batchSize: 500,
  },
}

export async function indexEvents(
  contractKey: Contract,
  contractEvent: Event,
  tableName: string,
  payloadMapper: (event: EventLog) => any
) {
  const key = `${contractKey}_${contractEvent}`

  try {
    const kit = await getContractKit()
    let fromBlock = (await getLastBlock(key)) + 1
    const lastBlock = await kit.web3.eth.getBlockNumber()
    console.debug(TAG, `${key} - Starting to fetch from block ${fromBlock}`)

    const { contract, batchSize } = contracts[contractKey]
    const contractWrapper = await contract(kit)

    while (fromBlock <= lastBlock) {
      const toBlock = Math.min(lastBlock, fromBlock + batchSize)
      const events = await contractWrapper.getPastEvents(contractEvent, {
        fromBlock,
        toBlock,
      })
      if (events.length > 0) {
        console.debug(
          TAG,
          `${key} - Got ${events.length} events between blocks [${fromBlock}, ${toBlock}]`
        )
      }
      fromBlock = toBlock + 1
      await concurrentMap(CONCURRENT_EVENTS_HANDLED, events, async (event) => {
        const { transactionHash, logIndex, blockNumber, blockHash } = event
        await database(tableName).insert({
          transactionHash,
          logIndex,
          blockNumber,
          blockHash,
          ...payloadMapper(event),
        })
      })
      setLastBlock(key, toBlock)
    }
  } catch (error) {
    console.error(TAG, `${key} - Error while handling events`, error)
  }
}
