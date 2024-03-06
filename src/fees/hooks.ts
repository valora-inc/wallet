import BigNumber from 'bignumber.js'
import { useEffect } from 'react'
import { FeeType, estimateFee } from 'src/fees/reducer'
import { fetchFeeCurrency } from 'src/fees/saga'
import { feeEstimatesSelector } from 'src/fees/selectors'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { useTokenInfo, useUsdToTokenAmount } from 'src/tokens/hooks'
import { celoAddressSelector, tokensByUsdBalanceSelector } from 'src/tokens/selectors'
import { ONE_HOUR_IN_MILLIS } from 'src/utils/time'

export function useFeeCurrency(): string | undefined {
  const tokens = useSelector(tokensByUsdBalanceSelector)
  return fetchFeeCurrency(tokens)
}

/**
 * @deprecated - only works for Celo, and the approach doesn't scale to chains where gas fees vary more quickly
 */
export function useMaxSendAmount(
  tokenId: string | undefined,
  feeType: FeeType.SEND | FeeType.SWAP,
  shouldRefresh: boolean = true
) {
  const dispatch = useDispatch()
  const balance = useTokenInfo(tokenId)?.balance ?? new BigNumber(0)
  const feeEstimates = useSelector(feeEstimatesSelector)
  const tokenInfo = useTokenInfo(tokenId)

  // Optionally Keep Fees Up to Date
  useEffect(() => {
    if (!shouldRefresh || !tokenInfo?.address) return
    const feeEstimate = feeEstimates[tokenInfo.address]?.[feeType]
    if (
      (feeType === FeeType.SWAP && balance.gt(0)) ||
      !feeEstimate ||
      feeEstimate.error ||
      feeEstimate.lastUpdated < Date.now() - ONE_HOUR_IN_MILLIS
    ) {
      dispatch(estimateFee({ feeType, tokenAddress: tokenInfo.address }))
    }
  }, [tokenInfo, shouldRefresh])

  const celoAddress = useSelector(celoAddressSelector)

  // useFeeCurrency chooses which crypto will be used to pay gas fees. It looks at the valid fee currencies (cUSD, cEUR, CELO)
  // in order of highest balance and selects the first one that has more than a minimum threshhold of balance
  // if CELO is selected then it actually returns undefined
  const feeTokenAddress = useFeeCurrency() ?? celoAddress

  const usdFeeEstimate = tokenInfo?.address
    ? feeEstimates[tokenInfo.address]?.[feeType]?.usdFee
    : undefined
  const feeEstimate =
    useUsdToTokenAmount(new BigNumber(usdFeeEstimate ?? 0), tokenInfo?.address ?? undefined) ??
    new BigNumber(0)

  if (!balance) {
    return new BigNumber(0)
  }
  // For example, if you are sending cUSD but you have more CELO this will be true
  if (tokenInfo?.address !== feeTokenAddress) {
    return balance
  }
  return balance.minus(feeEstimate)
}
