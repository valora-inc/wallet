import BigNumber from 'bignumber.js'
import * as React from 'react'
import { useTokenInfoByAddress } from 'src/tokens/hooks'
import TokenTotalLineItem from 'src/components/TokenTotalLineItem'
import { LocalAmount } from 'src/transactions/types'

interface Props {
  tokenAmount: BigNumber
  tokenAddress?: string
  localAmount?: LocalAmount
  feeToAddInUsd?: BigNumber | undefined
  hideSign?: boolean
  title?: string | null
}

/**
 * @deprecated Use TokenTotalLineItem instead
 */
export default function LegacyTokenTotalLineItem({
  tokenAmount,
  tokenAddress,
  localAmount,
  feeToAddInUsd,
  hideSign,
  title,
}: Props) {
  const tokenInfo = useTokenInfoByAddress(tokenAddress)
  return (
    <TokenTotalLineItem
      tokenAmount={tokenAmount}
      tokenId={tokenInfo?.tokenId}
      localAmount={localAmount}
      feeToAddInUsd={feeToAddInUsd}
      hideSign={hideSign}
      title={title}
    />
  )
}
