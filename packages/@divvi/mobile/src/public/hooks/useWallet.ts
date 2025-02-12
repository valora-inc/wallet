/**
 * With the current structure of the @divvi/mobile package there is a requirement to initialize
 * missingGlobals.ts before everything else. It is imported in the src/public/createApp.ts.
 * For this reason we cannot use top level imports using absolute internal paths like `src/redux/hooks`
 * as it can cause those resolved paths to be included in the runtime before the globals file.
 * The same issue happens if we try to use absolute imports like '@divvi/mobile/src/redux/hooks'.
 *
 * Until we resolve this issue, the approach to include any code from src folder should be as following:
 *   - top level imports of external modules are allowed (e.g. 'react')
 *   - internal modules should be included with an inline require
 *   - "import type" can be used to persist type-safety as it doesn't include types in the runtime
 *   - when using "import type" - use relative paths (e.g. ../../redux/hooks)
 */

import { useMemo } from 'react'
import type { EarnPosition } from 'src/positions/types'
import type { UseSelector } from '../../redux/hooks'
import type { SortedTokensWithBalanceOrShowZeroBalanceSelector } from '../../tokens/selectors'
import type { TokenBalance } from '../../tokens/slice'
import type { GetSupportedNetworkIdsForSend } from '../../tokens/utils'
import type { NetworkId } from '../../transactions/types'
import type { WalletAddressSelector } from '../../web3/selectors'

function useTokens() {
  const useSelector = require('../../redux/hooks').useSelector as UseSelector
  const getSupportedNetworkIdsForSend = require('../../tokens/utils')
    .getSupportedNetworkIdsForSend as GetSupportedNetworkIdsForSend
  const sortedTokensWithBalanceOrShowZeroBalanceSelector = require('../../tokens/selectors')
    .sortedTokensWithBalanceOrShowZeroBalanceSelector as SortedTokensWithBalanceOrShowZeroBalanceSelector

  const supportedNetworkIds = getSupportedNetworkIdsForSend().join(',')
  const memoizedNetworkIds = useMemo(
    () => supportedNetworkIds.split(',') as NetworkId[],
    [supportedNetworkIds]
  )
  // explicitly allow zero state tokens to be shown for exploration purposes for
  // new users with no balance
  const tokens = useSelector((state) =>
    sortedTokensWithBalanceOrShowZeroBalanceSelector(state, memoizedNetworkIds)
  )
  return tokens
}

function useEarnPositions() {
  const useSelector = require('../../redux/hooks').useSelector as UseSelector
  const earnPositionsSelector = require('../../positions/selectors').earnPositionsSelector
  const positions = useSelector(earnPositionsSelector)
  return positions
}

export function useWallet() {
  const useSelector = require('../../redux/hooks').useSelector as UseSelector
  const walletAddressSelector = require('../../web3/selectors')
    .walletAddressSelector as WalletAddressSelector
  const address = useSelector(walletAddressSelector) as string | null
  const tokens = useTokens() as TokenBalance[]

  const earnPositions = useEarnPositions() as EarnPosition[]
  return {
    address,
    tokens,
    earnPositions,
  }
}
