import BigNumber from 'bignumber.js'
import { Pool } from 'src/earn/types'
import { Position } from 'src/positions/types'
import { Address } from 'viem'

export function convertPositionToPool(position: Position): Pool {
  if (!position.dataProps) {
    throw new Error('Pool position is missing dataProps')
  }
  if (position.type !== 'app-token') {
    throw new Error('Pool position is not an app-token')
  }
  return {
    poolId: position.positionId,
    providerId: position.appId,
    networkId: position.networkId,
    tokens: position.tokens.map((token) => token.tokenId),
    depositTokenId: position.dataProps.depositTokenId,
    poolTokenId: position.dataProps.withdrawTokenId,
    poolAddress: position.address as Address,
    yieldRates: position.dataProps.yieldRates,
    earnItems: position.dataProps.earningItems,
    tvl: position.dataProps.tvl,
    provider: position.appName,
    balance: new BigNumber(position.balance),
    priceUsd: new BigNumber(position.priceUsd),
    pricePerShare: position.pricePerShare,
  }
}
