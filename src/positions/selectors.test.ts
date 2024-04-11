import BigNumber from 'bignumber.js'
import { getPositionBalanceUsd } from 'src/positions/getPositionBalanceUsd'
import {
  positionsByBalanceUsdSelector,
  positionsWithClaimableRewardsSelector,
  totalPositionsBalanceUsdSelector,
} from 'src/positions/selectors'
import { getFeatureGate } from 'src/statsig'
import { mockPositions, mockShortcuts } from 'test/values'

jest.mock('src/statsig')

beforeEach(() => {
  jest.clearAllMocks()
  jest.mocked(getFeatureGate).mockReturnValue(true)
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
    jest.mocked(getFeatureGate).mockReturnValue(false)
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
      [
        {
          "address": "0x31f9dee850b4284b81b52b25a3194f2fc8ff18cf",
          "appId": "ubeswap",
          "balanceUsd": "4.0802397095730601528429330911456",
          "title": "G$ / cUSD",
        },
        {
          "address": "0x19a75250c5a3ab22a8662e55a2b90ff9d3334b00",
          "appId": "ubeswap",
          "balanceUsd": "2.5098739934779290118396726809999",
          "title": "MOO / CELO",
        },
        {
          "address": "0xda7f463c27ec862cfbf2369f3f74c364d050d93f",
          "appId": "ubeswap",
          "balanceUsd": "1.3207590254762067",
          "title": "CELO / cUSD",
        },
      ]
    `)
  })
})

describe('positionsWithClaimableRewardsSelector', () => {
  it('should return positions with claimable rewards', () => {
    const state: any = {
      positions: {
        positions: mockPositions,
        shortcuts: mockShortcuts,
        triggeredShortcutsStatus: {},
      },
    }
    const positions = positionsWithClaimableRewardsSelector(state)
    expect(
      positions.map((position) => {
        return position.claimableShortcut
      })
    ).toMatchInlineSnapshot(`
      [
        {
          "appId": "ubeswap",
          "category": "claim",
          "claimableTokens": [
            {
              "address": "0x00be915b9dcf56a3cbe739d9b9c202ca692409ec",
              "balance": "0.098322815093446616",
              "category": "claimable",
              "decimals": 18,
              "networkId": "celo-mainnet",
              "priceUsd": "0.00904673476946796903",
              "symbol": "UBE",
              "type": "base-token",
            },
            {
              "address": "0x471ece3750da237f93b8e339c536989b8978a438",
              "balance": "0.950545800159603456",
              "category": "claimable",
              "decimals": 18,
              "networkId": "celo-mainnet",
              "priceUsd": "0.6959536890241361",
              "symbol": "CELO",
              "type": "base-token",
            },
          ],
          "description": "Claim rewards for staked liquidity",
          "id": "claim-reward",
          "name": "Claim",
          "networkIds": [
            "celo-mainnet",
          ],
        },
      ]
    `)
  })
})
