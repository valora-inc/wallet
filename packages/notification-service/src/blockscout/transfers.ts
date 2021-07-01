import BigNumber from 'bignumber.js'
import fetch from 'node-fetch'
import { performance } from 'perf_hooks'
import { BLOCKSCOUT_API } from '../config'
import { getLastBlockNotified, sendPaymentNotification, setLastBlockNotified } from '../firebase'
import { metrics } from '../metrics'
import { flat, getTokenAddresses, removeEmptyValuesFromObject } from '../util/utils'
import { Response, TokenTransfer, Transfer } from './blockscout'
import { formatTransfers } from './transfersFormatter'

export const WEI_PER_GOLD = 1000000000000000000.0
export const MAX_BLOCKS_TO_WAIT = 80

export enum Currencies {
  GOLD = 'gold',
  DOLLAR = 'dollar',
  EURO = 'euro',
}

const processedBlocks: { [currency in Currencies]: number[] } = {
  [Currencies.GOLD]: [],
  [Currencies.DOLLAR]: [],
  [Currencies.EURO]: [],
}

export async function query(path: string) {
  try {
    console.debug('Querying Blockscout. Path:', path)
    const response = await fetch(BLOCKSCOUT_API + path)
    const json = await response.json()
    console.debug('Blockscout queried successfully. Path:', path)
    return json
  } catch (error) {
    console.error('Error querying blockscout', error)
    throw error
  }
}

async function getLatestTokenTransfers(
  tokenAddress: string,
  lastBlockNotified: number,
  currency: Currencies
) {
  // Measure time before query
  const t0 = performance.now()

  const response: Response<TokenTransfer> = await query(
    `module=token&action=tokentx&fromBlock=${lastBlockNotified + 1}` +
      `&toBlock=latest&contractaddress=${tokenAddress}`
  )

  // Measure after query
  const t1 = performance.now()
  metrics.setLatestTokenTransfersDuration(t1 - t0)

  if (!response || !response.result) {
    console.error('Invalid query response format')
    return { transfers: null, latestBlock: lastBlockNotified }
  }

  if (!response.result.length) {
    console.debug('No new logs found for token:', currency)
    return { transfers: null, latestBlock: lastBlockNotified }
  }

  console.debug('New logs found for token:', currency, response.result.length)
  const { transfers, latestBlock } = formatTransfers(response.result as TokenTransfer[], currency)
  return { transfers, latestBlock }
}

export function filterAndJoinTransfers(
  celoTransfersByTx: Map<string, Transfer[]> | null,
  cUsdTransfersByTx: Map<string, Transfer[]> | null,
  cEurTransfersByTx: Map<string, Transfer[]> | null
): Transfer[] {
  const cUsdTransfers = cUsdTransfersByTx ? flat([...cUsdTransfersByTx.values()]) : []
  const cEurTransfers = cEurTransfersByTx ? flat([...cEurTransfersByTx.values()]) : []
  const celoTransfers = celoTransfersByTx ? flat([...celoTransfersByTx.values()]) : []

  // Exclude transaction found in both maps as those are from exchanges
  const filteredCelo = celoTransfers.filter(
    (t) => !cUsdTransfersByTx?.has(t.txHash) && !cEurTransfersByTx?.has(t.txHash)
  )
  const filteredCusd = cUsdTransfers.filter((t) => !celoTransfersByTx?.has(t.txHash))
  const filteredCEur = cEurTransfers.filter((t) => !celoTransfersByTx?.has(t.txHash))
  return filteredCelo.concat(filteredCusd).concat(filteredCEur)
}

export function notifyForNewTransfers(transfers: Transfer[]): Promise<void[]> {
  const results = new Array<Promise<void>>(transfers.length)
  for (let i = 0; i < transfers.length; i++) {
    const t = transfers[i]
    if (!t) {
      continue
    }

    const currencyProcessedBlocks = processedBlocks[t.currency]
    // Skip transactions for which we've already sent notifications
    if (currencyProcessedBlocks.find((blockNumber) => blockNumber === t.blockNumber)) {
      continue
    }

    // notification data must be only string type
    const notificationData = {
      ...t,
      blockNumber: String(t.blockNumber),
      timestamp: String(t.timestamp),
    }
    const result: Promise<void> = sendPaymentNotification(
      t.sender,
      t.recipient,
      convertWeiValue(t.value),
      t.currency,
      t.blockNumber,
      removeEmptyValuesFromObject(notificationData)
    )
    results[i] = result
  }
  const filtered = results.filter((el) => {
    return el !== undefined
  })
  return Promise.all(filtered)
}

export function convertWeiValue(value: string) {
  return new BigNumber(value).div(WEI_PER_GOLD).decimalPlaces(4).valueOf()
}

export function updateProcessedBlocks(
  transfers: Map<string, Transfer[]> | null,
  currency: Currencies,
  lastBlock: number
) {
  if (!transfers) {
    return
  }
  flat([...transfers.values()]).forEach((transfer) => {
    if (transfer && !processedBlocks[currency].includes(transfer.blockNumber)) {
      processedBlocks[currency].push(transfer?.blockNumber)
    }
  })
  processedBlocks[currency] = processedBlocks[currency].filter(
    (blockNumber) => blockNumber >= lastBlock - MAX_BLOCKS_TO_WAIT
  )
}

export async function handleTransferNotifications(): Promise<void> {
  const lastBlockNotified = getLastBlockNotified()
  if (lastBlockNotified < 0) {
    // Firebase not yet ready
    return
  }
  // Blockscout is eventually consistent, it doesn't resolve all blocks in order.
  // To account for this, we save a cache of all blocks already handled in the last |MAX_BLOCKS_TO_WAIT| blocks (|processedBlocks|),
  // so a transaction has that number of blocks to show up on Blockscout before we miss sending the notification for it.
  const blockToQuery = lastBlockNotified - MAX_BLOCKS_TO_WAIT
  const { goldTokenAddress, cUsdTokenAddress, cEurTokenAddress } = await getTokenAddresses()

  const [
    { transfers: celoTransfers, latestBlock: celoTransfersLatestBlock },
    { transfers: cUsdTransfers, latestBlock: cUsdTransfersLatestBlock },
    { transfers: cEurTransfers, latestBlock: cEurTransfersLatestBlock },
  ] = await Promise.all([
    await getLatestTokenTransfers(goldTokenAddress, blockToQuery, Currencies.GOLD),
    await getLatestTokenTransfers(cUsdTokenAddress, blockToQuery, Currencies.DOLLAR),
    await getLatestTokenTransfers(cEurTokenAddress, blockToQuery, Currencies.EURO),
  ])

  const allTransfers = filterAndJoinTransfers(celoTransfers, cUsdTransfers, cEurTransfers)
  const newCheckpointBlock = setLastBlockNotified(
    Math.max(Math.max(cUsdTransfersLatestBlock, celoTransfersLatestBlock), cEurTransfersLatestBlock)
  )
  await notifyForNewTransfers(allTransfers)
  updateProcessedBlocks(celoTransfers, Currencies.GOLD, celoTransfersLatestBlock)
  updateProcessedBlocks(cUsdTransfers, Currencies.DOLLAR, cUsdTransfersLatestBlock)
  updateProcessedBlocks(cEurTransfers, Currencies.EURO, cEurTransfersLatestBlock)

  return newCheckpointBlock
}
