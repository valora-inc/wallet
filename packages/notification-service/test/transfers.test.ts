import { Response as FetchResponseClass } from 'node-fetch'
import { Response, TokenTransfer, Transfer } from '../src/blockscout/blockscout'
import {
  convertWeiValue,
  Currencies,
  filterAndJoinTransfers,
  handleTransferNotifications,
  notifyForNewTransfers,
  updateProcessedBlocks,
} from '../src/blockscout/transfers'

const DOLLAR_TRANSFER = {
  recipient: 'dollar-recipient',
  sender: 'dollar-sender',
  value: '3',
  blockNumber: 153,
  txHash: 'dollar-txhash',
  currency: Currencies.DOLLAR,
  timestamp: 1,
}
const DOLLAR_EXCHANGE = {
  recipient: 'recipient',
  sender: 'sender',
  value: '10',
  blockNumber: 154,
  txHash: 'exchange-txhash',
  currency: Currencies.DOLLAR,
  timestamp: 2,
}
const CELO_TRANSFER = {
  recipient: 'celo-recipient',
  sender: 'celo-sender',
  value: '5',
  blockNumber: 156,
  txHash: 'celo-txhash',
  currency: Currencies.GOLD,
  timestamp: 3,
}
const CELO_EXCHANGE = {
  recipient: 'recipient',
  sender: 'sender',
  value: '10',
  blockNumber: 154,
  txHash: 'exchange-txhash',
  currency: Currencies.GOLD,
  timestamp: 2,
}

export let sendPaymentNotificationMock: any
export let getLastBlockNotifiedMock: any
export let setLastBlockNotifiedMock: any
export let transfersFormatterMock: any
const lastNotifiedBlock = 150

jest.mock('node-fetch')
const fetchMock: jest.Mock = require('node-fetch')
const FetchResponse: typeof FetchResponseClass = (jest.requireActual('node-fetch') as any).Response

jest.mock('firebase-admin')

jest.mock('../src/firebase', () => {
  sendPaymentNotificationMock = jest.fn(() => {
    return new Promise<void>((resolve) => setTimeout(resolve, 1000))
  })
  getLastBlockNotifiedMock = jest.fn(() => lastNotifiedBlock)
  setLastBlockNotifiedMock = jest.fn((newblock) => newblock)
  return {
    sendPaymentNotification: sendPaymentNotificationMock,
    getLastBlockNotified: getLastBlockNotifiedMock,
    setLastBlockNotified: setLastBlockNotifiedMock,
  }
})

jest.mock('../src/blockscout/transfersFormatter', () => {
  transfersFormatterMock = jest
    .fn()
    .mockReturnValueOnce({ transfers: [], latestBlock: 156 })
    .mockReturnValueOnce({ transfers: [], latestBlock: 154 })

  return {
    formatTransfers: transfersFormatterMock,
  }
})

const defaultResponse: Response<TokenTransfer> = {
  status: '',
  result: [
    {
      transactionIndex: '',
      transactionHash: '',
      topics: [''],
      timeStamp: '',
      logIndex: '',
      gatewayFeeRecipient: '',
      gatewayFee: '',
      gasUsed: '',
      gasPrice: '',
      feeCurrency: '',
      data: '',
      blockNumber: '',
      address: '',
      fromAddressHash: '',
      toAddressHash: '',
      amount: '',
    },
  ],
  message: '',
}
const defaultResponseJson = JSON.stringify(defaultResponse)

describe('Transfers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    fetchMock.mockImplementation(() => new FetchResponse(defaultResponseJson))
  })

  it('should exclude exchanges', () => {
    const celoTransfers = new Map<string, Transfer[]>()
    const stableTransfers = new Map<string, Transfer[]>()

    celoTransfers.set(CELO_EXCHANGE.txHash, [CELO_EXCHANGE])
    stableTransfers.set(DOLLAR_EXCHANGE.txHash, [DOLLAR_EXCHANGE])

    const concated = filterAndJoinTransfers(celoTransfers, stableTransfers)

    expect(concated).toEqual([])
  })

  it('should include unique transactions and update the last block', () => {
    const celoTransfers = new Map<string, Transfer[]>()
    const stableTransfers = new Map<string, Transfer[]>()

    celoTransfers.set(CELO_TRANSFER.txHash, [CELO_TRANSFER])
    stableTransfers.set(DOLLAR_TRANSFER.txHash, [DOLLAR_TRANSFER])

    const concated = filterAndJoinTransfers(celoTransfers, stableTransfers)

    expect(concated).toEqual([CELO_TRANSFER, DOLLAR_TRANSFER])
  })

  it('should notify for new transfers since last block notified', async () => {
    const transfers = [CELO_TRANSFER, DOLLAR_TRANSFER]
    const returned = await notifyForNewTransfers(transfers)

    expect(sendPaymentNotificationMock).toHaveBeenCalledWith(
      CELO_TRANSFER.sender,
      CELO_TRANSFER.recipient,
      convertWeiValue(CELO_TRANSFER.value),
      CELO_TRANSFER.currency,
      CELO_TRANSFER.blockNumber,
      {
        ...CELO_TRANSFER,
        blockNumber: String(CELO_TRANSFER.blockNumber),
        timestamp: String(CELO_TRANSFER.timestamp),
      }
    )

    expect(sendPaymentNotificationMock).toHaveBeenCalledWith(
      DOLLAR_TRANSFER.sender,
      DOLLAR_TRANSFER.recipient,
      convertWeiValue(DOLLAR_TRANSFER.value),
      DOLLAR_TRANSFER.currency,
      DOLLAR_TRANSFER.blockNumber,
      {
        ...DOLLAR_TRANSFER,
        blockNumber: String(DOLLAR_TRANSFER.blockNumber),
        timestamp: String(DOLLAR_TRANSFER.timestamp),
      }
    )
    expect(returned.length).toEqual(transfers.length)
  })

  it('should only notify once for each transfer', async () => {
    const transfers = new Map<string, Transfer[]>()
    transfers.set(CELO_TRANSFER.txHash, [CELO_TRANSFER])

    updateProcessedBlocks(transfers, Currencies.GOLD, CELO_TRANSFER.blockNumber)
    const returned = await notifyForNewTransfers([CELO_TRANSFER])
    expect(sendPaymentNotificationMock).not.toHaveBeenCalled()
    expect(returned.length).toEqual(0)
  })

  it('should update the last set block number', async () => {
    await handleTransferNotifications()
    expect(setLastBlockNotifiedMock).toBeCalledWith(CELO_TRANSFER.blockNumber)
  })

  // This is so the polling loop can retry on the next iteration
  // as we need both the celo and stable transfers fetch from blockscout to work
  // in order to send the right push notifications
  it('should propagate fetch errors', async () => {
    fetchMock.mockRejectedValue(new Error('FAKE ERROR, IGNORE'))
    await expect(handleTransferNotifications()).rejects.toThrow('FAKE ERROR, IGNORE')
    expect(sendPaymentNotificationMock).not.toHaveBeenCalled()
    expect(setLastBlockNotifiedMock).not.toHaveBeenCalled()
  })
})
