import BigNumber from 'bignumber.js'
import { totalPositionsBalanceUsdSelector } from 'src/positions/selectors'
import { mockPositions } from 'test/values'

describe(totalPositionsBalanceUsdSelector, () => {
  it('returns the total balance of all positions', () => {
    const state = {
      positions: {
        positions: mockPositions,
      },
    }
    const total = totalPositionsBalanceUsdSelector(state)
    expect(total).toEqual(new BigNumber('7.9108727285271958646826057721455'))
  })

  it('returns null if there are no positions', () => {
    const state = {
      positions: {
        positions: [],
      },
    }
    const total = totalPositionsBalanceUsdSelector(state)
    expect(total).toBeNull()
  })
})
