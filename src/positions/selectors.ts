import BigNumber from 'bignumber.js'
import { createSelector } from 'reselect'
import {
  AppTokenPosition,
  ClaimablePosition,
  Position,
  TokenWithCategory,
} from 'src/positions/types'
import { RootState } from 'src/redux/reducers'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import { getPositionBalanceUsd } from './getPositionBalanceUsd'

export const showPositionsSelector = () => getFeatureGate(StatsigFeatureGates.SHOW_POSITIONS)

export const positionsSelector = (state: RootState) =>
  showPositionsSelector() ? state.positions.positions : []
export const positionsStatusSelector = (state: RootState) =>
  showPositionsSelector() ? state.positions.status : 'idle'

export const totalPositionsBalanceUsdSelector = createSelector([positionsSelector], (positions) => {
  if (positions.length === 0) {
    return null
  }

  let totalBalanceUsd = new BigNumber(0)
  for (const position of positions) {
    const balanceUsd = getPositionBalanceUsd(position)
    totalBalanceUsd = totalBalanceUsd.plus(balanceUsd)
  }

  return totalBalanceUsd
})

// Sort positions by USD balance (descending)
function sortByBalanceUsd(position1: Position, position2: Position) {
  const position1BalanceUsd = getPositionBalanceUsd(position1)
  const position2BalanceUsd = getPositionBalanceUsd(position2)
  return position2BalanceUsd.comparedTo(position1BalanceUsd)
}

export const positionsByBalanceUsdSelector = createSelector([positionsSelector], (positions) => {
  return [...positions].sort(sortByBalanceUsd)
})

export const shortcutsSelector = (state: RootState) => state.positions.shortcuts

export const claimableShortcutSelector = createSelector([shortcutsSelector], (shortcuts) => {
  return shortcuts.filter((shortcut) => shortcut.category === 'claim')
})

function getAllClaimableTokens(tokens: TokenWithCategory[]): TokenWithCategory[] {
  const claimableTokens = tokens.filter((token) => token.category === 'claimable')
  const nestedTokens = tokens
    .filter((token): token is AppTokenPosition => 'tokens' in token)
    .flatMap((token) => getAllClaimableTokens(token.tokens))

  return [...claimableTokens, ...nestedTokens]
}

export const positionsWithClaimableRewardsSelector = createSelector(
  [positionsSelector, claimableShortcutSelector],
  (positions, shortcuts) => {
    const claimablePositions: ClaimablePosition[] = []
    positions.forEach((position) => {
      const appShortcutIds = shortcuts
        .filter((shortcut) => shortcut.appId === position.appId)
        .map((shortcut) => shortcut.id)

      appShortcutIds.forEach((shortcutId) => {
        const { availableShortcutIds, tokens, ...rest } = position
        if (availableShortcutIds.includes(shortcutId)) {
          claimablePositions.push({
            ...rest,
            shortcutId,
            claimableTokens: getAllClaimableTokens(tokens),
          })
        }
      })
    })

    return claimablePositions
  }
)
