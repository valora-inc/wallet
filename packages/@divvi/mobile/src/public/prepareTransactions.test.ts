import { mockCeloTokenBalance } from 'test/values'
import { feeCurrenciesSelector } from '../tokens/selectors'
import { prepareTransactions as internalPrepareTransactions } from '../viem/prepareTransactions'
import { prepareTransactions, type TransactionRequest } from './prepareTransactions'

jest.mock('../tokens/selectors')
jest.mock('../viem/prepareTransactions')

describe('prepareTransactions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(feeCurrenciesSelector).mockReset()
    jest.mocked(internalPrepareTransactions).mockReset()
  })

  it('should correctly prepare transactions', async () => {
    const mockFeeCurrencies = [mockCeloTokenBalance]
    const mockPrepareResult = { type: 'possible' } as any

    jest.mocked(feeCurrenciesSelector).mockReturnValue(mockFeeCurrencies)
    jest.mocked(internalPrepareTransactions).mockResolvedValue(mockPrepareResult)

    const txRequests: TransactionRequest[] = [
      {
        to: '0x1234567890123456789012345678901234567890',
        data: '0x',
        value: BigInt(1000),
        estimatedGasUse: BigInt(21000),
      },
    ]

    const result = await prepareTransactions({
      networkId: 'celo-alfajores',
      transactionRequests: txRequests,
    })

    expect(result).toEqual(mockPrepareResult)
    expect(internalPrepareTransactions).toHaveBeenCalledWith({
      feeCurrencies: mockFeeCurrencies,
      decreasedAmountGasFeeMultiplier: 1,
      baseTransactions: [
        {
          to: txRequests[0].to,
          data: txRequests[0].data,
          value: txRequests[0].value,
          _estimatedGasUse: txRequests[0].estimatedGasUse,
        },
      ],
      origin: 'framework',
    })
  })
})
