import BigNumber from 'bignumber.js'
import { createSelector } from 'reselect'
import {
  AppTokenPosition,
  ClaimablePosition,
  ClaimableShortcut,
  EarnPosition,
  Position,
  Token,
} from 'src/positions/types'
import { RootState } from 'src/redux/reducers'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import { tokensByIdSelector } from 'src/tokens/selectors'
import { NetworkId } from 'src/transactions/types'
import { isPresent } from 'src/utils/typescript'
import networkConfig from 'src/web3/networkConfig'
import { getPositionBalanceUsd } from './getPositionBalanceUsd'

export const showPositionsSelector = () => getFeatureGate(StatsigFeatureGates.SHOW_POSITIONS)
export const showClaimShortcutsSelector = () =>
  getFeatureGate(StatsigFeatureGates.SHOW_CLAIM_SHORTCUTS)
export const allowHooksPreviewSelector = () =>
  getFeatureGate(StatsigFeatureGates.ALLOW_HOOKS_PREVIEW)

const positionsSelector = (state: RootState) =>
  showPositionsSelector() ? state.positions.positions : []
export const earnPositionIdsSelector = (state: RootState) => state.positions.earnPositionIds
export const positionsStatusSelector = (state: RootState) =>
  showPositionsSelector() ? state.positions.status : 'idle'
export const positionsFetchedAtSelector = (state: RootState) => state.positions.positionsFetchedAt

// When displaying user positions, we don't want positions which don't have a balance
// For instance earn positions which aren't yet held by the user
export const positionsWithBalanceSelector = createSelector([positionsSelector], (positions) =>
  positions.filter((position) => {
    if (position.type === 'app-token') {
      return new BigNumber(position.balance).gt(0)
    }
    return position.tokens.some((token) => new BigNumber(token.balance).gt(0))
  })
)

export const earnPositionsSelector = createSelector(
  [positionsSelector, earnPositionIdsSelector],
  (positions, earnPositionIds) => {
    const earnPositionIdsSet = new Set(earnPositionIds)
    return positions.filter(
      (position): position is EarnPosition =>
        earnPositionIdsSet.has(position.positionId) &&
        position.type === 'app-token' &&
        !!position.dataProps
    )
  }
)

export const totalPositionsBalanceUsdSelector = createSelector(
  [
    positionsWithBalanceSelector,
    (state: RootState) => tokensByIdSelector(state, Object.values(NetworkId)),
  ],
  (positions, tokensById) => {
    if (positions.length === 0) {
      return null
    }

    let totalBalanceUsd = new BigNumber(0)
    for (const position of positions) {
      if ('tokenId' in position) {
        const token = tokensById[position.tokenId]
        // Skip tokens that are already counted as part of the regular token list
        if (token && !token.isFromPosition) {
          continue
        }
      }
      const balanceUsd = getPositionBalanceUsd(position)
      totalBalanceUsd = totalBalanceUsd.plus(balanceUsd)
    }

    return totalBalanceUsd
  }
)

// Sort positions by USD balance (descending)
function sortByBalanceUsd(position1: Position, position2: Position) {
  const position1BalanceUsd = getPositionBalanceUsd(position1)
  const position2BalanceUsd = getPositionBalanceUsd(position2)
  return position2BalanceUsd.comparedTo(position1BalanceUsd)
}

export const positionsByBalanceUsdSelector = createSelector(
  [positionsWithBalanceSelector],
  (positions) => {
    return [...positions].sort(sortByBalanceUsd)
  }
)

export const shortcutsSelector = (state: RootState) => state.positions.shortcuts

export const shortcutsStatusSelector = (state: RootState) => state.positions.shortcutsStatus

export const triggeredShortcutsStatusSelector = (state: RootState) =>
  state.positions.triggeredShortcutsStatus

export const claimableShortcutSelector = createSelector([shortcutsSelector], (shortcuts) => {
  return shortcuts.filter((shortcut) => shortcut.category === 'claim')
})

function getAllClaimableTokens(tokens: Token[]): Token[] {
  const claimableTokens = tokens.filter(
    (token) => token.category === 'claimable' && BigNumber(token.balance).gt(0)
  )
  const nestedTokens = tokens
    .filter((token): token is AppTokenPosition => 'tokens' in token)
    .flatMap((token) => getAllClaimableTokens(token.tokens))

  return [...claimableTokens, ...nestedTokens]
}

// we need to uniquely identify a claimable reward to display the reward status
// correctly. some rewards can be continuously claimed, so upon claim success
// the reward at the same position address could be updated to a new (lower)
// value, for this scenario we need to allow the user to claim the reward again
export function getClaimableRewardId(
  positionAddress: string,
  claimableShortcut: ClaimableShortcut
) {
  let claimableValue = new BigNumber(0)
  claimableShortcut.claimableTokens.forEach((token) => {
    claimableValue = claimableValue.plus(token.balance)
  })
  return `${claimableShortcut.id}-${positionAddress}-${claimableValue.toString()}`
}

export const positionsWithClaimableRewardsSelector = createSelector(
  [positionsWithBalanceSelector, claimableShortcutSelector, triggeredShortcutsStatusSelector],
  (positions, shortcuts, triggeredShortcuts) => {
    const claimablePositions: ClaimablePosition[] = []
    positions.forEach((position) => {
      const appShortcuts = shortcuts.filter(
        (shortcut) =>
          shortcut.appId === position.appId && shortcut.networkIds.includes(position.networkId)
      )

      appShortcuts.forEach((shortcut) => {
        const { availableShortcutIds, tokens, ...rest } = position
        const claimableTokens = getAllClaimableTokens(tokens)
        if (availableShortcutIds.includes(shortcut.id) && claimableTokens.length > 0) {
          const claimableShortcut = {
            ...shortcut,
            claimableTokens,
          }
          claimablePositions.push({
            ...rest,
            claimableShortcut,
            status:
              triggeredShortcuts[getClaimableRewardId(position.address, claimableShortcut)]
                ?.status ?? 'idle',
          })
        }
      })
    })

    return claimablePositions
  }
)

export const hooksPreviewApiUrlSelector = (state: RootState) =>
  allowHooksPreviewSelector() && state.positions.previewApiUrl

export const hooksApiUrlSelector = (state: RootState) =>
  hooksPreviewApiUrlSelector(state) || networkConfig.hooksApiUrl

export const hooksPreviewStatusSelector = (state: RootState) => {
  const statuses = [
    showPositionsSelector() ? positionsStatusSelector(state) : undefined,
    showClaimShortcutsSelector() ? shortcutsStatusSelector(state) : undefined,
  ].filter(isPresent)

  if (statuses.includes('loading')) {
    return 'loading'
  }

  if (statuses.includes('error')) {
    return 'error'
  }

  if (statuses.every((status) => status === 'success')) {
    return 'success'
  }

  return 'idle'
}
