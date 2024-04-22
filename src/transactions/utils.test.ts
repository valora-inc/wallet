import {
  NetworkId,
  TokenTransaction,
  TokenTransactionTypeV2,
  TransactionStatus,
} from 'src/transactions/types'
import { groupFeedItemsInSections } from 'src/transactions/utils'
import { mockCusdAddress, mockCusdTokenId } from 'test/values'

const mockFeedItem = (
  timestamp: number,
  comment: string,
  status = TransactionStatus.Complete
): TokenTransaction => {
  return {
    __typename: 'TokenTransferV3',
    networkId: NetworkId['celo-alfajores'],
    type: TokenTransactionTypeV2.Sent,
    block: '8648978',
    transactionHash: 'any_value',
    amount: {
      value: '5.05',
      tokenAddress: mockCusdAddress,
      tokenId: mockCusdTokenId,
      localAmount: undefined,
    },
    fees: [],
    timestamp,
    address: '0xanything',
    status,
    metadata: {
      comment,
    },
  }
}

const sept172019Timestamp = 1568735100000
const daysAgo = (days: number) => sept172019Timestamp - days * 24 * 60 * 60 * 1000

describe('groupFeedItemsInSections', () => {
  // Lock the time on Sept 17 2019.
  let dateNowSpy: any
  beforeAll(() => {
    dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => sept172019Timestamp)
    // set the offset to ALWAYS be Pacific for these tests regardless of where they are run
    // see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTimezoneOffset
    jest.spyOn(Date.prototype, 'getTimezoneOffset').mockImplementation(() => 420)
  })
  afterAll(() => {
    dateNowSpy.mockRestore()
  })

  it('groups into sections correctly', () => {
    const standbyTransactions = [
      // most recent tx, should be first in the list
      mockFeedItem(daysAgo(1), 'standby1', TransactionStatus.Pending),
      // there are more recent completed transactions than this, but it should appear second
      mockFeedItem(daysAgo(6), 'standby2', TransactionStatus.Pending),
    ]
    const feedItems = [
      mockFeedItem(daysAgo(3), 'recent1'),
      mockFeedItem(daysAgo(5), 'recent2'),
      mockFeedItem(daysAgo(15), 'september'),
      mockFeedItem(daysAgo(20), 'august'),
      mockFeedItem(daysAgo(30), 'august'),
      mockFeedItem(daysAgo(30), 'august'),
      mockFeedItem(daysAgo(50), 'july'),
      mockFeedItem(daysAgo(275), 'december 2018'),
      mockFeedItem(daysAgo(400), 'august 2018'),
    ]
    const sections = groupFeedItemsInSections(standbyTransactions, feedItems)
    expect(sections.length).toEqual(6)

    expect(sections[0].title).toEqual('feedSectionHeaderRecent')
    expect(sections[0].data).toEqual([
      expect.objectContaining({
        metadata: { comment: 'standby1' },
        status: TransactionStatus.Pending,
      }),
      expect.objectContaining({
        metadata: { comment: 'standby2' },
        status: TransactionStatus.Pending,
      }),
      expect.objectContaining({
        metadata: { comment: 'recent1' },
        status: TransactionStatus.Complete,
      }),
      expect.objectContaining({
        metadata: { comment: 'recent2' },
        status: TransactionStatus.Complete,
      }),
    ])

    expect(sections[1].title).toEqual('September')
    expect(sections[1].data.length).toEqual(1)

    expect(sections[2].title).toEqual('August')
    expect(sections[2].data.length).toEqual(3)

    expect(sections[3].title).toEqual('July')
    expect(sections[3].data.length).toEqual(1)

    expect(sections[4].title).toEqual('December 2018')
    expect(sections[4].data.length).toEqual(1)

    expect(sections[5].title).toEqual('August 2018')
    expect(sections[5].data.length).toEqual(1)
  })
})
