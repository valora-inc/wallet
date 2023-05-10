import BigNumber from 'bignumber.js'
import { totalPositionsBalanceUsdSelector } from 'src/positions/selectors'
import { getFeatureGate } from 'src/statsig'
import { mockPositions } from 'test/values'
import { mocked } from 'ts-jest/utils'

jest.mock('src/statsig')

beforeEach(() => {
  jest.clearAllMocks()
  mocked(getFeatureGate).mockReturnValue(true)
})

describe(totalPositionsBalanceUsdSelector, () => {
  it('returns the total balance of all positions', () => {
    const state: any = {
      positions: {
        positions: mockPositions,
      },
    }
    const total = totalPositionsBalanceUsdSelector(state)
    expect(total).toEqual(new BigNumber('7.9108727285271958646826057721455'))
  })

  it('returns null if there are no positions', () => {
    const state: any = {
      positions: {
        positions: [],
      },
    }
    const total = totalPositionsBalanceUsdSelector(state)
    expect(total).toBeNull()
  })

  it("returns null if the feature isn't enabled", () => {
    mocked(getFeatureGate).mockReturnValue(false)
    const state: any = {
      positions: {
        positions: [],
      },
    }
    const total = totalPositionsBalanceUsdSelector(state)
    expect(total).toBeNull()
  })
})
