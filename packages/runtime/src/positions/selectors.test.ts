import BigNumber from 'bignumber.js'
import { getPositionBalanceUsd } from 'src/positions/getPositionBalanceUsd'
import {
  earnPositionsSelector,
  positionsByBalanceUsdSelector,
  positionsWithBalanceSelector,
  positionsWithClaimableRewardsSelector,
  totalPositionsBalanceUsdSelector,
} from 'src/positions/selectors'
import { AppTokenPosition } from 'src/positions/types'
import { getFeatureGate } from 'src/statsig'
import { NetworkId } from 'src/transactions/types'
import { mockPositions, mockShortcuts } from 'test/values'

jest.mock('src/statsig')

beforeEach(() => {
  jest.clearAllMocks()
  jest.mocked(getFeatureGate).mockReturnValue(true)
})

describe('positionsWithBalanceSelector', () => {
  it('returns the positions with a balance', () => {
    const state: any = {
      positions: {
        positions: [
          {
            type: 'contract-position' as const,
            networkId: NetworkId['celo-alfajores'],
            address: '0xa',
            positionId: 'celo-alfajores:0xa',
            appId: 'a',
            displayProps: {
              title: 'Title A',
            },
            tokens: [
              {
                tokenId: 'celo-alfajores:0xb',
                networkId: NetworkId['celo-alfajores'],
                balance: '0',
                priceUsd: '10',
              },
            ],
            // will be ignored, what matters is the balance of the tokens
            balanceUsd: '20',
          },
          {
            type: 'app-token' as const,
            networkId: NetworkId['celo-alfajores'],
            address: '0xb',
            positionId: 'celo-alfajores:0xb',
            appId: 'b',
            displayProps: {
              title: 'Title B',
            },
            tokens: [],
            // for an app token, the balance is the balance of the token
            balance: '1.11',
          },
        ],
      },
    }
    const positions = positionsWithBalanceSelector(state)
    expect(positions.map((position) => position.positionId)).toStrictEqual(['celo-alfajores:0xb'])
  })
})

describe('earnPositionsSelector', () => {
  it('returns the earn positions', () => {
    const state: any = {
      positions: {
        positions: [
          {
            type: 'app-token' as const,
            networkId: NetworkId['celo-alfajores'],
            address: '0xa',
            positionId: 'celo-alfajores:0xa',
            appId: 'a',
            displayProps: {
              title: 'Title A',
            },
            tokens: [],
            dataProps: {
              earningItems: [],
              yieldRates: [],
              depositTokenId: '0x1',
              withdrawTokenId: '0x2',
            },
          },
          {
            type: 'app-token' as const,
            networkId: NetworkId['celo-alfajores'],
            address: '0xb',
            positionId: 'celo-alfajores:0xb',
            appId: 'b',
            displayProps: {
              title: 'Title B',
            },
            tokens: [],
            dataProps: {
              earningItems: [],
              yieldRates: [],
              depositTokenId: '0x1',
              withdrawTokenId: '0x2',
            },
          },
        ],
        earnPositionIds: ['celo-alfajores:0xb'],
      },
    }
    const positions = earnPositionsSelector(state)
    expect(positions.map((position) => position.positionId)).toStrictEqual(['celo-alfajores:0xb'])
  })
})

describe('totalPositionsBalanceUsdSelector', () => {
  it('returns the total balance of all positions', () => {
    const state: any = {
      positions: {
        positions: mockPositions,
      },
      tokens: {
        tokenBalances: {},
      },
    }
    const total = totalPositionsBalanceUsdSelector(state)
    expect(total).toEqual(new BigNumber('7.9108727285271958646826057721455'))
  })

  it('returns the total balance ignoring tokens which are already counted as part of the regular token list', () => {
    const appTokenPosition = mockPositions[0] as AppTokenPosition
    const { tokens, ...appToken } = appTokenPosition
    const state: any = {
      positions: {
        positions: mockPositions,
      },
      tokens: {
        tokenBalances: {
          [appToken.tokenId]: appToken, // the total will not include this token
        },
      },
    }
    const total = totalPositionsBalanceUsdSelector(state)
    expect(total).toEqual(new BigNumber('5.4009987350492668528429330911456'))
    const totalNoRegularTokens = totalPositionsBalanceUsdSelector({
      ...state,
      tokens: { tokenBalances: {} },
    })
    // This checks the difference is the balance of the app token
    expect(totalNoRegularTokens).toEqual(total?.plus(getPositionBalanceUsd(appTokenPosition)))
  })

  it('returns null if there are no positions', () => {
    const state: any = {
      positions: {
        positions: [],
      },
      tokens: {
        tokenBalances: {},
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
      tokens: {
        tokenBalances: {},
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
              "tokenId": "celo-mainnet:0x00be915b9dcf56a3cbe739d9b9c202ca692409ec",
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
              "tokenId": "celo-mainnet:0x471ece3750da237f93b8e339c536989b8978a438",
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
