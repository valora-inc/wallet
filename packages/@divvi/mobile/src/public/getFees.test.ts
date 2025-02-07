import { getFeeCurrencyAndAmounts } from '../viem/prepareTransactions'
import { getFees } from './getFees'
import type { PreparedTransactionsPossible } from './prepareTransactions'

jest.mock('../viem/prepareTransactions')

describe('getFees', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(getFeeCurrencyAndAmounts).mockReset()
  })

  it('should delegate to getFeeCurrencyAndAmounts', () => {
    const mockPreparedResult = { type: 'possible' } as PreparedTransactionsPossible
    const mockFees = {} as any

    jest.mocked(getFeeCurrencyAndAmounts).mockReturnValue(mockFees)

    const result = getFees(mockPreparedResult)

    expect(result).toEqual(mockFees)
    expect(getFeeCurrencyAndAmounts).toHaveBeenCalledWith(mockPreparedResult)
  })
})
