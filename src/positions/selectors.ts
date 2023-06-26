import BigNumber from 'bignumber.js'
import { createSelector } from 'reselect'
import { Position } from 'src/positions/types'
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

export const positionsWithClaimableRewardsSelector = createSelector(
  [positionsSelector],
  (positions) => {
    return positions.filter((position) => position.availableShortcutIds.includes('claim-reward'))
  }
)
