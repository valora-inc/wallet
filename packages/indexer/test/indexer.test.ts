import { Contract, Event, indexEvents } from '../src/indexer'
import { getLastBlock, setLastBlock } from '../src/indexer/blocks'
import { partialEventLog } from '../src/util/testing'

// TODO: Write e2e tests running with a real node and a real db.

const saveRowMock = jest.fn()
const getLastBlockMock = getLastBlock as jest.Mock
const setLastBlockMock = setLastBlock as jest.Mock
const getLastBlockNumberMock = jest.fn()
const getAccountEventsMock = jest.fn()

jest.mock('../src/database/db', () => ({
  database: (tableName: string) => ({
    insert: jest.fn((payload: any) => saveRowMock(tableName, payload)),
  }),
}))
jest.mock('../src/indexer/blocks')
jest.mock('../src/util/utils', () => ({
  getContractKit: jest.fn(() => ({
    web3: {
      eth: {
        getBlockNumber: getLastBlockNumberMock,
      },
    },
    contracts: {
      getAccounts: () =>
        Promise.resolve({
          getPastEvents: getAccountEventsMock,
        }),
    },
  })),
}))

const firstTxHash = '0x0001'
const secondTxHash = '0x0002'
const fromBlock = 100
const toBlock = 15000
const tableName = 'accounts'

describe('Indexer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  function prepareMocks() {
    getLastBlockMock.mockImplementation(() => Promise.resolve(fromBlock))
    getLastBlockNumberMock.mockImplementation(() => Promise.resolve(toBlock))
    getAccountEventsMock
      .mockImplementationOnce(() => [partialEventLog({ transactionHash: firstTxHash })])
      .mockImplementationOnce(() => [partialEventLog({ transactionHash: secondTxHash })])
  }

  it('indexes account events', async () => {
    prepareMocks()

    await indexEvents(Contract.Accounts, Event.AccountWalletAddressSet, tableName, (event) => ({
      transactionHash: event.transactionHash,
    }))

    expect(saveRowMock).toHaveBeenCalledTimes(2)
    expect(saveRowMock).toHaveBeenCalledWith(
      tableName,
      expect.objectContaining({ transactionHash: firstTxHash })
    )
    expect(saveRowMock).toHaveBeenCalledWith(
      tableName,
      expect.objectContaining({ transactionHash: secondTxHash })
    )

    expect(setLastBlockMock).toHaveBeenCalledTimes(2)
    expect(setLastBlockMock).toHaveBeenCalledWith(expect.any(String), fromBlock + 10000 + 1)
    expect(setLastBlockMock).toHaveBeenCalledWith(expect.any(String), toBlock)
  })

  it("halts when there's an error storing events", async () => {
    prepareMocks()

    await indexEvents(Contract.Accounts, Event.AccountWalletAddressSet, tableName, () => {
      throw Error('Test error')
    })

    expect(saveRowMock).not.toHaveBeenCalled()
    expect(setLastBlockMock).not.toHaveBeenCalled()
  })
})
