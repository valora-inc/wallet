import BigNumber from 'bignumber.js'
import { useEarnPositionBalanceValues } from 'src/earn/hooks'
import { mockEarnPositions } from 'test/values'

describe('useEarnPositionBalanceValues', () => {
  it('should return the correct USD and depositToken crypto balances for a pool', () => {
    const { poolBalanceInUsd, poolBalanceInDepositToken } = useEarnPositionBalanceValues({
      pools: [{ ...mockEarnPositions[0], balance: '100' }],
    })[0]
    expect(poolBalanceInUsd).toEqual(new BigNumber(120))
    expect(poolBalanceInDepositToken).toEqual(new BigNumber(110))
  })
})
