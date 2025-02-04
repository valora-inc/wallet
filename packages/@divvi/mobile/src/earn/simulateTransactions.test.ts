import { FetchMock } from 'jest-fetch-mock'
import { simulateTransactions } from 'src/earn/simulateTransactions'
import { NetworkId } from 'src/transactions/types'
import { TransactionRequest } from 'src/viem/prepareTransactions'
import networkConfig from 'src/web3/networkConfig'

const mockBaseTransactions: TransactionRequest[] = [
  {
    from: '0x123',
    to: '0x456',
    data: '0xencodedData',
  },
  {
    from: '0x456',
    to: '0x789',
    data: '0xencodedData',
  },
]

const mockSimulatedTransactions = [
  {
    status: 'success',
    blockNumber: '1',
    gasNeeded: 3000,
    gasUsed: 2800,
    gasPrice: '1',
  },
  {
    status: 'success',
    blockNumber: '1',
    gasNeeded: 50000,
    gasUsed: 49800,
    gasPrice: '1',
  },
]

describe('simulateTransactions', () => {
  const mockFetch = fetch as FetchMock
  beforeEach(() => {
    mockFetch.resetMocks()
  })

  it('should fetch simulated transactions', async () => {
    mockFetch.mockResponseOnce(
      JSON.stringify({
        status: 'OK',
        simulatedTransactions: mockSimulatedTransactions,
      })
    )
    const simulatedTransactions = await simulateTransactions({
      baseTransactions: mockBaseTransactions,
      networkId: NetworkId['arbitrum-sepolia'],
    })
    expect(mockFetch).toHaveBeenCalledWith(
      networkConfig.simulateTransactionsUrl,
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactions: mockBaseTransactions,
          networkId: NetworkId['arbitrum-sepolia'],
        }),
      })
    )
    expect(simulatedTransactions).toEqual(mockSimulatedTransactions)
  })
  it('should throw an error if the response is not ok', async () => {
    mockFetch.mockResponseOnce(
      JSON.stringify({
        status: 'ERROR',
        error: 'something went wrong',
      }),
      { status: 500 }
    )
    await expect(
      simulateTransactions({
        baseTransactions: mockBaseTransactions,
        networkId: NetworkId['arbitrum-sepolia'],
      })
    ).rejects.toThrow(
      'Failed to simulate transactions. status 500, text: {"status":"ERROR","error":"something went wrong"}'
    )
  })
  it('should throw an error if the number of simulated transactions does not match the number of base transactions', async () => {
    mockFetch.mockResponseOnce(
      JSON.stringify({
        status: 'OK',
        simulatedTransactions: mockSimulatedTransactions.slice(0, 1),
      })
    )
    await expect(
      simulateTransactions({
        baseTransactions: mockBaseTransactions,
        networkId: NetworkId['arbitrum-sepolia'],
      })
    ).rejects.toThrow(
      'Expected 2 simulated transactions, got 1, response: [{"status":"success","blockNumber":"1","gasNeeded":3000,"gasUsed":2800,"gasPrice":"1"}]'
    )
  })
  it('should throw an error if a simulated transaction is not successful', async () => {
    mockFetch.mockResponseOnce(
      JSON.stringify({
        status: 'OK',
        simulatedTransactions: [
          mockSimulatedTransactions[0],
          { ...mockSimulatedTransactions[1], status: 'failure' },
        ],
      })
    )
    await expect(
      simulateTransactions({
        baseTransactions: mockBaseTransactions,
        networkId: NetworkId['arbitrum-sepolia'],
      })
    ).rejects.toThrow(
      'Failed to simulate transaction for base transaction {"from":"0x456","to":"0x789","data":"0xencodedData"}. response: {"status":"failure","blockNumber":"1","gasNeeded":50000,"gasUsed":49800,"gasPrice":"1"}'
    )
  })
})
