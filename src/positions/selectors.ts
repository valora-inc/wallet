import BigNumber from 'bignumber.js'
import { createSelector } from 'reselect'
import { RootState } from 'src/redux/reducers'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'

export const showPositionsSelector = () => getFeatureGate(StatsigFeatureGates.SHOW_POSITIONS)

export const positionsSelector = (state: RootState) => state.positions.positions
export const positionsStatusSelector = (state: RootState) => state.positions.status

export const totalPositionsBalanceUsdSelector = createSelector(
  [showPositionsSelector, positionsSelector],
  (showPositions, positions) => {
    if (!showPositions || positions.length === 0) {
      return null
    }

    let totalBalanceUsd = new BigNumber(0)
    for (const position of positions) {
      let balanceUsd
      if (position.type === 'app-token') {
        const balance = new BigNumber(position.balance)
        balanceUsd = balance.multipliedBy(position.priceUsd)
      } else {
        balanceUsd = new BigNumber(position.balanceUsd)
      }
      totalBalanceUsd = totalBalanceUsd.plus(balanceUsd)
    }

    return totalBalanceUsd
  }
)
