import BigNumber from 'bignumber.js'
import { getPositionBalanceUsd } from 'src/positions/getPositionBalanceUsd'
import {
  positionsByBalanceUsdSelector,
  totalPositionsBalanceUsdSelector,
} from 'src/positions/selectors'
import { getFeatureGate } from 'src/statsig'
import { mockPositions } from 'test/values'
import { mocked } from 'ts-jest/utils'

jest.mock('src/statsig')

beforeEach(() => {
  jest.clearAllMocks()
  mocked(getFeatureGate).mockReturnValue(true)
})

describe('totalPositionsBalanceUsdSelector', () => {
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

describe('positionsByBalanceUsdSelector', () => {
  it('returns the positions sorted by USD balance in descending order', () => {
    const state: any = {
      positions: {
        positions: mockPositions,
      },
    }
    const positions = positionsByBalanceUsdSelector(state)
    expect(
      positions.map((position) => {
        return {
          appId: position.appId,
          address: position.address,
          title: position.displayProps.title,
          balanceUsd: getPositionBalanceUsd(position),
        }
      })
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "address": "0x31f9dee850b4284b81b52b25a3194f2fc8ff18cf",
          "appId": "ubeswap",
          "balanceUsd": "4.0802397095730601528429330911456",
          "title": "G$ / cUSD",
        },
        Object {
          "address": "0x19a75250c5a3ab22a8662e55a2b90ff9d3334b00",
          "appId": "ubeswap",
          "balanceUsd": "2.5098739934779290118396726809999",
          "title": "MOO / CELO",
        },
        Object {
          "address": "0xda7f463c27ec862cfbf2369f3f74c364d050d93f",
          "appId": "ubeswap",
          "balanceUsd": "1.3207590254762067",
          "title": "CELO / cUSD",
        },
      ]
    `)
  })
})
