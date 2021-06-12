import { Contract, Event, indexEvents } from '../src/indexer'
import { db, database, initDatabase } from '../src/database/db'
import { partialEventLog } from '../src/util/testing'
import { getLastBlock } from '../src/indexer/blocks'

const getLastBlockNumberMock = jest.fn()
const getAccountEventsMock = jest.fn()

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

// We want to pick a toBlock that triggers multiple iterations of the indexEvents
// loop. 15000 ensures that because we start with last block = 0 and 15000 is
// larger than the batch sizes.
const toBlock = 15000
// Pick a table that exists.
const tableName = 'account_wallet_mappings'

describe('Indexer', () => {
  beforeEach(async () => {
    await initDatabase()
    jest.clearAllMocks()
  })

  afterEach(() => {
    return db.destroy()
  })

  function prepareMocks() {
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

    expect(await database(tableName)).toHaveLength(2)
    expect(
      await database(tableName)
        .where({
          transactionHash: firstTxHash,
        })
        .first()
    ).toBeTruthy()
    expect(
      await database(tableName)
        .where({
          transactionHash: secondTxHash,
        })
        .first()
    ).toBeTruthy()

    const key = `${Contract.Accounts}_${Event.AccountWalletAddressSet}`
    expect(await getLastBlock(key)).toEqual(toBlock)
  })

  it("halts when there's an error storing events", async () => {
    prepareMocks()

    await indexEvents(Contract.Accounts, Event.AccountWalletAddressSet, tableName, () => {
      throw Error('Test error')
    })

    expect(await database(tableName)).toHaveLength(0)

    const key = `${Contract.Accounts}_${Event.AccountWalletAddressSet}`
    expect(await getLastBlock(key)).toEqual(0)
  })
})
